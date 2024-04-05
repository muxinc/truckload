import { inngest } from '@/inngest/client';
import type { Video } from '@/utils/store';
import type { ListVideosRoot, ApiVideoVideo } from './types';
import { SANDBOX_ENDPOINT, PRODUCTION_ENDPOINT } from './constants';

export const fetchPage = inngest.createFunction(
  { id: 'fetch-page-api-video', name: 'Fetch page - Api.video', concurrency: 1 },
  { event: 'truckload/migration.fetch-page' },
  async ({ event, step }) => {
    const environment = event.data.encrypted.additionalMetadata?.environment;
    const secretKey = event.data.encrypted.secretKey;
    const endpoint = environment === 'sandbox' ? SANDBOX_ENDPOINT : PRODUCTION_ENDPOINT;

    const response = await fetch(`${endpoint}/videos`, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${btoa(secretKey as string)}`,
        'Content-Type': 'application/json',
      },
    });

    const result = (await response.json()) as ListVideosRoot;
    const isTruncated = result.pagination.currentPage < result.pagination.pagesTotal;
    const cursor = result.pagination.links.find((link) => link.rel === 'next')?.uri;

    const videos =
      result.data
        ?.map((object: ApiVideoVideo) => ({ id: object.videoId, title: object.title }))
        .filter((item: Video): item is Video => !!item.id) || [];

    const payload = { isTruncated, videos, cursor };
    return payload;
  }
);

export const fetchVideo = inngest.createFunction(
  { id: 'fetch-video-api-video', name: 'Fetch video - Api.video', concurrency: 10 },
  { event: 'truckload/video.fetch' },
  async ({ event, step }) => {
    const environment = event.data.encrypted.credentials.additionalMetadata?.environment;
    const secretKey = event.data.encrypted.credentials.secretKey;
    const endpoint = environment === 'sandbox' ? SANDBOX_ENDPOINT : PRODUCTION_ENDPOINT;

    const response = await fetch(`${endpoint}/videos/${event.data.encrypted.video.id}`, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${btoa(secretKey as string)}`,
        'Content-Type': 'application/json',
      },
    });

    const result = (await response.json()) as ApiVideoVideo;

    if (result.mp4Support) {
      return {
        id: event.data.encrypted.video.id,
        url: result.assets.mp4,
      };
    }
    // todo: enable mp4 support if it isn't enabled on the asset
    // similar to how cloudflare stream works
  }
);
