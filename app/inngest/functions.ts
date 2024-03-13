import { GetObjectCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { GetEvents } from 'inngest';

import Mux from '@mux/mux-node';
import { PlaybackPolicy } from '@mux/mux-node/resources';

import type { Video } from '@/utils/store';
import { inngest } from './client';
import { updateJobStatus } from '@/utils/job';

type Events = GetEvents<typeof inngest>;

export const fetchPage = inngest.createFunction(
  { id: 'fetch-page', name: 'Fetch page', concurrency: 1 },
  { event: 'truckload/migration.fetch-page' },
  async ({ event, step }) => {
    const client = new S3Client({
      credentials: {
        accessKeyId: event.data.encrypted.publicKey,
        secretAccessKey: event.data.encrypted.secretKey!,
      },
      region: event.data.encrypted.additionalMetadata!.region,
    });

    const listObjects = new ListObjectsV2Command({ Bucket: event.data.encrypted.additionalMetadata!.bucket });
    const results = await client.send(listObjects);

    const isTruncated = results.IsTruncated;
    const cursor = results.NextContinuationToken;
    const videos =
      results.Contents?.map((object) => ({ id: object.Key })).filter((item): item is Video => !!item.id) || [];
    const payload = { isTruncated, cursor, videos };
    return payload;
  }
);

export const fetchVideo = inngest.createFunction(
  { id: 'fetch-video', name: 'Fetch video', concurrency: 10 },
  { event: 'truckload/video.fetch' },
  async ({ event, step }) => {
    const client = new S3Client({
      credentials: {
        accessKeyId: event.data.encrypted.credentials.publicKey,
        secretAccessKey: event.data.encrypted.credentials.secretKey!,
      },
      region: event.data.encrypted.credentials.additionalMetadata!.region,
    });

    const object = new GetObjectCommand({
      Bucket: event.data.encrypted.credentials.additionalMetadata!.bucket,
      Key: event.data.encrypted.video.id, //'hackweek-mux-video-ad-final.mp4'
    });

    const url = await getSignedUrl(client, object, { expiresIn: 3600 });
    const video = {
      id: event.data.encrypted.video.id,
      url,
    };

    return video;
  }
);

// We decouple the logic of the copy video function from the run migration function
// to allow this to be re-used and tested independently.
// This also allows the system to define different configuration for each part,
// like limits on concurrency for how many videos should be copied in parallel
// A separate function could be created for each destination platform
export const transferVideo = inngest.createFunction(
  { id: 'transfer-video', name: 'Transfer video', concurrency: 10 },
  { event: 'truckload/video.transfer' },
  async ({ event, step }) => {
    const mux = new Mux({
      tokenId: event.data.encrypted.destinationPlatform.credentials!.publicKey,
      tokenSecret: event.data.encrypted.destinationPlatform.credentials!.secretKey,
    });

    const config = event.data.encrypted.destinationPlatform.config;

    let payload: Mux.Video.Assets.AssetCreateParams = {
      input: [{ url: event.data.encrypted.video.url }],
      passthrough: JSON.stringify({ jobId: event.data.jobId, sourceVideoId: event.data.encrypted.video.id }),
    };

    if (config?.maxResolutionTier) {
      payload = { ...payload, max_resolution_tier: config.maxResolutionTier as any };
    }

    if (config?.playbackPolicy) {
      payload = { ...payload, playback_policy: [config.playbackPolicy as PlaybackPolicy] };
    }

    if (config?.encodingTier) {
      payload = { ...payload, encoding_tier: config.encodingTier as any };
    }

    const result = await mux.video.assets.create(payload);

    await updateJobStatus(event.data.jobId, 'migration.video.progress', {
      video: {
        id: event.data.encrypted.video.id,
        status: 'in-progress',
        progress: 0,
      },
    });

    return { status: 'success', result };
  }
);

export const processVideo = inngest.createFunction(
  { id: 'process-video', name: 'Process video' },
  { event: 'truckload/video.process' },
  async ({ event, step }) => {
    const videoData = event.data.encrypted.video;

    const video = await step.invoke(`fetch-video-${videoData.id}`, {
      function: fetchVideo,
      data: {
        jobId: event.data.jobId,
        encrypted: {
          credentials: event.data.encrypted.sourcePlatform.credentials!,
          video: videoData,
        },
      },
    });

    const transfer = await step.invoke(`transfer-video-${videoData.id}`, {
      function: transferVideo,
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
  async ({ event, step }) => {
    let jobId = event.id;
    let hasMorePages = true;
    let page = 1;
    let nextPageNumber: number | undefined = undefined;
    let nextPageToken: string | undefined = undefined;
    let videoList: Video[] = [];

    console.log('jobId: ' + jobId);

    // todo: use this to conditionally set the fetch page function
    let sourcePlatformId = event.data.encrypted.sourcePlatform.id;

    while (hasMorePages && event.data.encrypted.sourcePlatform.credentials) {
      const { cursor, isTruncated, videos } = await step.invoke(`fetch-page-${page}`, {
        function: fetchPage,
        data: {
          jobId: jobId!,
          encrypted: event.data.encrypted.sourcePlatform.credentials,
        },
      });

      videoList = videoList.concat(videos);
      nextPageToken = cursor;

      console.log('page: ' + page);
      console.log('cursor: ' + cursor);
      console.log('isTruncated: ' + isTruncated);
      console.log('videos: ' + JSON.stringify(videos));

      await updateJobStatus(jobId!, 'migration.videos.fetched', {
        pageNumber: page,
        videos: videoList.map((video) => ({ ...video, status: 'pending', progress: 0 })),
        hasMorePages: isTruncated,
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
