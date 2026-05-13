import { FatalError, getWorkflowMetadata, sleep } from 'workflow';

import type { DestinationPlatform, SourcePlatform, Video, VideoWithMigrationStatus } from '@/utils/store';

import {
  checkCloudflareStatusStep,
  fetchPageStep,
  fetchVideoStep,
  startProcessVideoWorkflow,
  transferVideoStep,
  updateJobStatusStep,
} from './steps';

export async function processVideo(
  jobId: string,
  sourcePlatform: SourcePlatform,
  destinationPlatform: DestinationPlatform,
  videoData: Video
) {
  'use workflow';

  let video = await fetchVideoStep(sourcePlatform.id, sourcePlatform.credentials!, videoData);

  if (!video) {
    throw new FatalError(`Failed to fetch video with ID: ${videoData.id}`);
  }

  // Handle Cloudflare Stream polling case
  if (video.needsPolling) {
    let status = { ready: false, url: '' };
    while (!status.ready) {
      await sleep('5s');
      status = await checkCloudflareStatusStep(sourcePlatform.credentials!, videoData);
    }
    video = { id: videoData.id, url: status.url };
  }

  const transfer = await transferVideoStep(jobId, video, sourcePlatform, destinationPlatform);

  return { status: 'success', transfer };
}

export async function initiateMigration(data: {
  sourcePlatform: SourcePlatform;
  destinationPlatform: DestinationPlatform;
  assetFilter: any;
}) {
  'use workflow';

  const { workflowRunId: jobId } = getWorkflowMetadata();

  let hasMorePages = true;
  let page = 1;
  let videoList: Video[] = [];

  while (hasMorePages && data.sourcePlatform.credentials) {
    const { cursor, isTruncated, videos } = await fetchPageStep(
      data.sourcePlatform.id,
      data.sourcePlatform.credentials,
      page
    );

    videoList = videoList.concat(videos);

    await updateJobStatusStep(jobId, 'migration.videos.fetched', {
      pageNumber: page,
      videos: videoList.reduce<Record<string, VideoWithMigrationStatus>>((acc, video) => {
        acc[video.id] = { ...video, status: 'pending', progress: 0 };
        return acc;
      }, {}),
      hasMorePages: isTruncated,
    });

    if (!isTruncated) {
      hasMorePages = false;
    } else {
      page++;
    }
  }

  // Start a processVideo workflow for each video
  for (const video of videoList) {
    await startProcessVideoWorkflow(jobId, data.sourcePlatform, data.destinationPlatform, video);
  }

  return { message: 'migration initiated', videosMigrated: videoList.length };
}
