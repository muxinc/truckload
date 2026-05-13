import type { PlatformCredentials, Video } from '@/utils/store';

import type { ListVideosRoot, VimeoVideo } from './types';

export async function fetchPage(credentials: PlatformCredentials, page: number = 1) {
  const secretKey = credentials.secretKey;
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
      ?.map((object: VimeoVideo) => ({
        id: object.uri,
        title: object.name,
        status: object.status,
        type: object.type,
      }))
      .filter(
        (item: Video & { status?: string; type?: string }): item is Video =>
          !!item.id && !(item.status !== 'available' && item.type !== 'video')
      ) || [];

  return { isTruncated, videos, cursor: null };
}

export async function fetchVideo(credentials: PlatformCredentials, video: Video) {
  const secretKey = credentials.secretKey;

  const response = await fetch(`https://api.vimeo.com${video.id}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${secretKey as string}`,
      'Content-Type': 'application/json',
    },
  });

  const result = (await response.json()) as VimeoVideo;

  if (!result) {
    throw new Error('Error fetching video from Vimeo');
  }

  if (result.download && result.status === 'available' && result.type === 'video') {
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
      id: video.id,
      url: download?.link,
      title: result?.name,
    };
  }

  return undefined;
}
