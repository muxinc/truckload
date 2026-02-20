import { NonRetriableError } from 'inngest';

import { inngest } from '@/inngest/client';

import type { WistiaMedia, WistiaMediaList } from './types';

export const fetchPage = inngest.createFunction(
  { id: 'fetch-page-wistia', name: 'Fetch page - Wistia', concurrency: 1 },
  { event: 'truckload/migration.fetch-page' },
  async ({ event }: { event: any }) => {
    const secretKey = event.data.encrypted.secretKey;
    const page = event.data.page || 1;
    const response = await fetch(`https://api.wistia.com/modern/medias?page=${page}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${secretKey as string}`,
        'Content-Type': 'application/json',
      },
    });

    const result: WistiaMediaList | [] = await response.json();

    const videos = result?.map((media: WistiaMedia) => {
      const download =
        media.assets?.find((asset) => asset.type === 'OriginalFile') ||
        media.assets?.reduce((largest, asset) => (asset.file_size > (largest?.file_size || 0) ? asset : largest));
      return {
        id: media.hashed_id,
        title: media.name,
        url: download?.url,
      };
    });

    const isTruncated = result.length !== 0;

    const payload = { videos, isTruncated, cursor: null };
    return payload;
  }
);

export const fetchVideo = inngest.createFunction(
  { id: 'fetch-video-wistia', name: 'Fetch video - Wistia', concurrency: 10 },
  { event: 'truckload/video.fetch' },
  async ({ event, step }) => {
    if (!event.data.encrypted) {
      throw new NonRetriableError('Error fetching video from Wistia');
    }

    return event.data.encrypted.video;
  }
);
