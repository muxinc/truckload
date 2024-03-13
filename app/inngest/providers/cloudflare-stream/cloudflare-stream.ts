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

export const fetchVideo = inngest.createFunction(
  { id: 'fetch-video-cloudflare-stream', name: 'Fetch video', concurrency: 10 },
  { event: 'truckload/video.fetch' },
  async ({ event, step }) => {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${event.data.encrypted.publicKey}/stream/${event.data.encrypted.video.id}/downloads`,
      {
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

    // todo: poll for ready and fire a related event to continue
    if (result.result.default.status === 'inprogress') {
      const downloadReady = await step.waitForEvent('wait-for-download-ready-cloudflare-stream', {
        event: 'app/onboarding.completed',
        timeout: '1d',
        match: 'data.encrypted.video.id',
      });

      video.url = downloadReady?.data.encrypted.video.id;
    } else if (result.result.default.status === 'ready') {
      video.url = result.result.default.url;
    }

    return video;
  }
);
