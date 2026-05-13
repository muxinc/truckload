import type { PlatformCredentials, Video } from '@/utils/store';

import type { WistiaMedia, WistiaMediaList } from './types';

export async function fetchPage(credentials: PlatformCredentials, page: number = 1) {
  const secretKey = credentials.secretKey;
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

  return { videos, isTruncated, cursor: null };
}

export async function fetchVideo(credentials: PlatformCredentials, video: Video) {
  if (!video) {
    throw new Error('Error fetching video from Wistia');
  }

  return video;
}
