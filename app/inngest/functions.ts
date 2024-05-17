import type { GetEvents } from 'inngest';

import { updateJobStatus } from '@/utils/job';
import type { Video } from '@/utils/store';
import type { VideoWithMigrationStatus } from '@/utils/store';

import { inngest } from './client';
import providerFns from './providers';

type Events = GetEvents<typeof inngest>;

export const processVideo = inngest.createFunction(
  { id: 'process-video', name: 'Process video' },
  { event: 'truckload/video.process' },
  async ({ event, step }) => {
    const videoData = event.data.encrypted.video;
    // use the source platform id to conditionally set the fetch page function
    const sourcePlatformId = event.data.encrypted.sourcePlatform.id;
    const fetchVideoFn = providerFns[sourcePlatformId].fetchVideo;

    // use the destination platform id to conditionally set the transfer video function
    const destinationPlatformId = event.data.encrypted.destinationPlatform.id;
    const transferVideoFn = providerFns[destinationPlatformId].transferVideo;

    const video = await step.invoke(`fetch-video-${videoData.id}`, {
      function: fetchVideoFn,
      data: {
        jobId: event.data.jobId,
        encrypted: {
          credentials: event.data.encrypted.sourcePlatform.credentials!,
          video: videoData,
        },
      },
    });

    const transfer = await step.invoke(`transfer-video-${videoData.id}`, {
      function: transferVideoFn,
      data: {
        jobId: event.data.jobId,
        encrypted: {
          sourcePlatform: event.data.encrypted.sourcePlatform,
          destinationPlatform: event.data.encrypted.destinationPlatform,
          video,
        },
      },
    });

    return { status: 'success', transfer };
  }
);

export const initiateMigration = inngest.createFunction(
  { id: 'initiate-migration' },
  { event: 'truckload/migration.init' },
  async ({ event, step, logger }) => {
    let jobId = event.id;
    let hasMorePages = true;
    let page = 1;
    let nextPageNumber: number | undefined = undefined;
    let nextPageToken: string | null | undefined = undefined;
    let videoList: Video[] = [];

    logger.info('jobId: ' + jobId);

    // use the source platform id to conditionally set the fetch page function
    const sourcePlatformId = event.data.encrypted.sourcePlatform.id;
    const fetchPageFn = providerFns[sourcePlatformId].fetchPage;

    while (hasMorePages && event.data.encrypted.sourcePlatform.credentials) {
      const { cursor, isTruncated, videos } = await step.invoke(`fetch-page-${page}`, {
        function: fetchPageFn,
        data: {
          jobId: jobId!,
          encrypted: event.data.encrypted.sourcePlatform.credentials,
        },
      });

      videoList = videoList.concat(videos);
      nextPageToken = cursor;

      logger.info('page: ' + page);
      logger.info('cursor: ' + cursor);
      logger.info('isTruncated: ' + isTruncated);
      logger.info('videos: ' + JSON.stringify(videos));

      await step.run('update-job-status-with-videos-fetched', async () => {
        await updateJobStatus(jobId!, 'migration.videos.fetched', {
          pageNumber: page,
          videos: videoList.reduce<Record<string, VideoWithMigrationStatus>>((acc, video) => {
            acc[video.id] = { ...video, status: 'pending', progress: 0 };
            return acc;
          }, {}),
          hasMorePages: isTruncated,
        });
      });

      if (!isTruncated) {
        hasMorePages = false;
      } else {
        page++;
      }
    }

    const videoEvents = videoList.map((video): Events['truckload/video.process'] => ({
      name: 'truckload/video.process',
      data: {
        jobId: jobId!,
        encrypted: {
          sourcePlatform: event.data.encrypted.sourcePlatform,
          destinationPlatform: event.data.encrypted.destinationPlatform,
          video,
        },
      },
    }));

    await step.sendEvent('process-videos', videoEvents);

    return { message: 'migration initiated', videosMigrated: videoList.length };
  }
);
