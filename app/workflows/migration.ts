import { FatalError, getWorkflowMetadata, sleep } from 'workflow';

import type { DestinationPlatform, SourcePlatform, Video, VideoWithMigrationStatus } from '@/utils/store';

import {
  checkCloudflareStatusStep,
  checkMuxAssetStatusStep,
  fetchPageStep,
  fetchVideoStep,
  getJobHaltStatusStep,
  startProcessVideoWorkflow,
  transferVideoStep,
  updateJobStatusStep,
} from './steps';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;

  if (typeof error === 'object' && error !== null) {
    const maybeMessage = (error as { message?: unknown }).message;
    if (typeof maybeMessage === 'string' && maybeMessage.trim().length > 0) {
      return maybeMessage;
    }

    const maybeError = (error as { error?: unknown }).error;
    if (typeof maybeError === 'string' && maybeError.trim().length > 0) {
      return maybeError;
    }

    if (typeof maybeError === 'object' && maybeError !== null) {
      const nestedMessage = (maybeError as { message?: unknown }).message;
      if (typeof nestedMessage === 'string' && nestedMessage.trim().length > 0) {
        return nestedMessage;
      }
    }

    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }

  return 'Unknown workflow error';
}

function isMuxFreePlanLimitError(errorMessage: string): boolean {
  return errorMessage.includes('Free plan is limited to 10 assets');
}

export async function processVideo(
  jobId: string,
  sourcePlatform: SourcePlatform,
  destinationPlatform: DestinationPlatform,
  videoData: Video
) {
  'use workflow';

  const haltStatus = await getJobHaltStatusStep(jobId);
  if (haltStatus.halted) {
    const haltMessage = haltStatus.reason || 'Migration was halted due to a previous failure.';
    await updateJobStatusStep(jobId, 'migration.video.progress', {
      video: {
        id: videoData.id,
        status: 'failed',
        progress: 100,
        error: haltMessage,
      },
    });
    return { status: 'failed', skipped: true, reason: haltMessage };
  }

  try {
    let video = await fetchVideoStep(sourcePlatform.id, sourcePlatform.credentials!, videoData);

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
    const assetId = transfer.result.id;

    // Poll Mux until asset is ready (replaces webhook/ngrok approach)
    let assetStatus = { ready: false, errored: false };
    while (!assetStatus.ready && !assetStatus.errored) {
      await sleep('5s');
      assetStatus = await checkMuxAssetStatusStep(destinationPlatform.credentials!, assetId);
    }

    await updateJobStatusStep(jobId, 'migration.video.progress', {
      video: {
        id: videoData.id,
        status: assetStatus.ready ? 'completed' : 'failed',
        progress: 100,
        ...(assetStatus.errored ? { error: 'Mux asset processing failed.' } : {}),
      },
    });

    return { status: assetStatus.ready ? 'success' : 'failed', transfer };
  } catch (error) {
    const errorMessage = getErrorMessage(error);

    await updateJobStatusStep(jobId, 'migration.video.progress', {
      video: {
        id: videoData.id,
        status: 'failed',
        progress: 100,
        error: errorMessage,
      },
    });

    if (isMuxFreePlanLimitError(errorMessage)) {
      await updateJobStatusStep(jobId, 'migration.job.halted', {
        reason: errorMessage,
      });
    }

    throw new FatalError(errorMessage);
  }
}

export async function initiateMigration(data: {
  sourcePlatform: SourcePlatform;
  destinationPlatform: DestinationPlatform;
  assetFilter: boolean | null;
}) {
  'use workflow';

  const { workflowRunId: jobId } = getWorkflowMetadata();
  let hasMorePages = true;
  let page = 1;
  let cursor: string | undefined;
  let videoList: Video[] = [];
  const useManualSelection = data.assetFilter === false;

  while (hasMorePages && data.sourcePlatform.credentials) {
    const result = await fetchPageStep(data.sourcePlatform.id, data.sourcePlatform.credentials, page, cursor);
    const { isTruncated, videos } = result;
    cursor = result.cursor ?? undefined;

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

  if (!useManualSelection) {
    for (const video of videoList) {
      await startProcessVideoWorkflow(jobId, data.sourcePlatform, data.destinationPlatform, video);
    }

    return { message: 'migration started', videosStarted: videoList.length };
  }

  return { message: 'migration queued', videosQueued: videoList.length };
}

export async function refreshVideoList(jobId: string, sourcePlatform: SourcePlatform) {
  'use workflow';

  let hasMorePages = true;
  let page = 1;
  let cursor: string | undefined;
  let videoList: Video[] = [];

  while (hasMorePages && sourcePlatform.credentials) {
    const result = await fetchPageStep(sourcePlatform.id, sourcePlatform.credentials, page, cursor);
    const { isTruncated, videos } = result;
    cursor = result.cursor ?? undefined;

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

  return { message: 'video list refreshed', videosFetched: videoList.length };
}
