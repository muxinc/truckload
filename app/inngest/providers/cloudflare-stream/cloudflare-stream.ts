import type { GetEvents } from 'inngest';

import type { Video } from '@/utils/store';
import { inngest } from '@/inngest/client';
import type { CloudflareVideo } from './types';

type Events = GetEvents<typeof inngest>;

export const fetchPage = inngest.createFunction(
  { id: 'fetch-page-cloudflare-stream', name: 'Fetch page', concurrency: 1 },
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

export const checkSourceStatus = inngest.createFunction(
  { id: 'check-source-status-cloudflare-stream', name: 'Check source status Cloudflare Steam', concurrency: 10 },
  { event: 'truckload/migration.check-source-status-cloudflare-stream' },
  async ({ event, step }) => {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${event.data.encrypted.publicKey}/stream/${event.data.encrypted.video.id}/downloads`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${event.data.encrypted.credentials.secretKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const result = await response.json();

    const isReady = result.result.default.status === 'ready';
    const url = result.result.default.url;
    const payload = { isReady, url };
    return payload;
  }
);

export const fetchVideo = inngest.createFunction(
  { id: 'fetch-video-cloudflare-stream', name: 'Fetch video', concurrency: 10 },
  { event: 'truckload/video.fetch' },
  async ({ event, step }) => {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${event.data.encrypted.publicKey}/stream/${event.data.encrypted.video.id}/downloads`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${event.data.encrypted.credentials.secretKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const result = await response.json();

    let video = {
      id: event.data.encrypted.video.id,
      url: '',
    };

    let sourceReady = result.result.default.status === 'ready';

    while (!sourceReady && event.data.encrypted.credentials) {
      const { isReady, url } = await step.invoke(`check-source-status-cloudflare-stream`, {
        function: checkSourceStatus,
        data: {
          jobId: event.data.jobId,
          encrypted: event.data.encrypted.credentials,
        },
      });

      if (isReady) {
        video.url = url;
        sourceReady = true;
      }
    }

    return video;
  }
);
