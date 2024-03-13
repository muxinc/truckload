import { GetObjectCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { GetEvents } from 'inngest';

import type { Video } from '@/utils/store';
import { inngest } from './client';
import { updateJobStatus } from '@/utils/job';
import type { VideoWithMigrationStatus } from '@/utils/store';

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
      results.Contents?.map((object) => ({ id: object.Key })).filter(
        (item): item is Video => !!item.id && /\.(mp4|mov|mp3)$/i.test(item.id)
      ) || [];

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
