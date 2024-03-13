import type { GetEvents } from 'inngest';

import type { Video } from '@/utils/store';
import { inngest } from '@/inngest/client';
import type { CloudflareVideo } from './types';

type Events = GetEvents<typeof inngest>;

export const fetchPage = inngest.createFunction(
  { id: 'fetch-page', name: 'Fetch page', concurrency: 1 },
  { event: 'truckload/migration.fetch-page' },
  async ({ event, step }) => {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${event.data.encrypted.publicKey}/stream`,
      {
        headers: {
          Authorization: `Bearer ${event.data.encrypted.secretKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const result = await response.json();

    const isTruncated = result.range && result.range > 0;
    const cursor = null;

    const videos =
      result.result
        ?.map((object: CloudflareVideo) => ({ id: object.uid }))
        .filter((item: Video): item is Video => !!item.id) || [];

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

    // todo: enable download, wait for it, and fetch it.

    const url = await getSignedUrl(client, object, { expiresIn: 3600 });
    const video = {
      id: event.data.encrypted.video.id,
      url,
    };

    return video;
  }
);
