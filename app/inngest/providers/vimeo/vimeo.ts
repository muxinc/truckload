import { NonRetriableError } from 'inngest/components/NonRetriableError';

import { inngest } from '@/inngest/client';
import type { Video } from '@/utils/store';

import type { ListVideosRoot, VimeoVideo } from './types';

export const fetchPage = inngest.createFunction(
  { id: 'fetch-page-vimeo', name: 'Fetch page - Vimeo', concurrency: 1 },
  { event: 'truckload/migration.fetch-page' },
  async ({ event }: { event: any }) => {
    const secretKey = event.data.encrypted.secretKey;
    const page = event.data.page || 1;
    const response = await fetch(`https://api.vimeo.com/me/videos?page=${page}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${secretKey as string}`,
        'Content-Type': 'application/json',
      },
    });

    const result = (await response.json()) as ListVideosRoot;
    const isTruncated = result.page < Math.ceil(result.total / result.per_page);

    const videos =
      result.data
        ?.map((object: VimeoVideo) => ({ id: object.uri, title: object.name }))
        .filter((item: Video): item is Video => !!item.id) || [];

    const payload = { isTruncated, videos, cursor: null };
    return payload;
  }
);

export const fetchVideo = inngest.createFunction(
  { id: 'fetch-video-vimeo', name: 'Fetch video - Vimeo', concurrency: 10 },
  { event: 'truckload/video.fetch' },
  async ({ event, step }) => {
    const secretKey = event.data.encrypted.credentials.secretKey;

    const response = await fetch(`https://api.vimeo.com${event.data.encrypted.video.id}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${secretKey as string}`,
        'Content-Type': 'application/json',
      },
    });

    const result = (await response.json()) as VimeoVideo;

    if (!result) {
      throw new NonRetriableError('Error fetching video from Vimeo');
    }

    if (result.download && result.status === 'available' && result.type === 'video') {
      // Find highest quality MP4 download link if source is not available
      const download = result.download.find(
        (file) =>
          file.rendition === 'source' ||
          file.rendition === '8k' ||
          file.rendition === '7k' ||
          file.rendition === '6k' ||
          file.rendition === '5k' ||
          file.rendition === '4k' ||
          file.rendition === '2k' ||
          file.rendition === '1080p' ||
          file.rendition === '720p' ||
          file.rendition === '540p' ||
          file.rendition === '480p' ||
          file.rendition === '360p' ||
          file.rendition === '240p'
      );

      return {
        id: event.data.encrypted.video.id,
        url: download?.link,
      };
    }
    return;
  }
);
