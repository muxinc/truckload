import { GetObjectCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import Mux from '@mux/mux-node';

import { inngest } from './client';

export const helloWorld = inngest.createFunction(
  { id: 'hello-world' },
  { event: 'test/hello.world' },
  async ({ event, step }) => {
    await step.sleep('wait-a-moment', '1s');
    return { event, body: 'Hello, World!' };
  }
);

const fetchPage = inngest.createFunction(
  { id: 'fetch-page', name: 'Fetch page' },
  { event: 'in-n-out/migration.fetch-page' },
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
    const videos = results.Contents?.map((object) => object.Key);

    const payload = { isTruncated, cursor, videos };
    return payload;
  }
);

const fetchVideo = inngest.createFunction(
  { id: 'fetch-video', name: 'Fetch video' },
  { event: 'in-n-out/migration.fetch-video' },
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

    const video = await getSignedUrl(client, object, { expiresIn: 3600 });
    return { video };
  }
);

// We decouple the logic of the copy video function from the run migration function
// to allow this to be re-used and tested independently.
// This also allows the system to define different configuration for each part,
// like limits on concurrency for how many videos should be copied in parallel
// A separate function could be created for each destination platform
const transferVideo = inngest.createFunction(
  { id: 'transfer-video', name: 'Transfer video', concurrency: 10 },
  { event: 'app/transfer.initiated' },
  async ({ event, step }) => {
    const mux = new Mux({
      tokenId: event.data.encrypted.destinationPlatform.credentials.publicKey as string,
      tokenSecret: event.data.encrypted.destinationPlatform.credentials.secretKey as string,
    });

    const result = await mux.video.assets.create({ input: [] });
    // #6 - Option A - Could add pushing updates to the browser with something like Websockets
    return { status: 'success', result };
  }
);

export const processVideo = inngest.createFunction(
  { id: 'process-video' },
  { event: 'in-n-out/video.process' },
  async ({ event, step }) => {
    const videoData = event.data.video;

    const video = await step.invoke(`fetch-video-${videoData.id}`, {
      function: fetchVideo,
      data: {
        videoData,
        destinationPlatform: event.data.destinationPlatform,
        settings: event.data.settings,
      },
    });

    const transfer = await step.invoke(`transfer-video-${videoData.id}`, {
      function: transferVideo,
      data: {
        video,
        destinationPlatform: event.data.destinationPlatform,
        settings: event.data.settings,
      },
    });

    return { status: 'success', transfer };
  }
);

export const initiateMigration = inngest.createFunction(
  { id: 'initiate-migration' },
  { event: 'in-n-out/migration.init' },
  async ({ event, step }) => {
    let hasMorePages = true;
    let page = 1;
    let nextPageNumber;
    let nextPageToken;
    let videoList = [];
    let sourcePlatformId = event.data.encrypted.sourcePlatform.id;

    while (hasMorePages) {
      const { cursor, isTruncated, videos } = step.invoke(`fetch-page-${page}`, {
        function: fetchPage,
        data: event.data.encrypted,
      });

      videoList = videoList.concat(videos);
      nextPageToken = cursor;
      if (!isTruncated) {
        hasMorePages = false;
      }
    }

    const videoEvents = videoList.map((video) => ({
      name: 'in-n-out/video.process',
      data: {
        video,
      },
    }));

    await step.sendEvent('process-videos', videoEvents);

    return { message: 'migration initiated', videosMigrated: videoList.length };
  }
);
