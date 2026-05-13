import type { PlatformCredentials, Video } from '@/utils/store';

import { PRODUCTION_ENDPOINT, SANDBOX_ENDPOINT } from './constants';
import type { ApiVideoVideo, ListVideosRoot } from './types';

export async function fetchPage(credentials: PlatformCredentials) {
  const environment = credentials.additionalMetadata?.environment;
  const secretKey = credentials.secretKey;
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

  return { isTruncated, videos, cursor };
}

export async function fetchVideo(credentials: PlatformCredentials, video: Video) {
  const environment = credentials.additionalMetadata?.environment;
  const secretKey = credentials.secretKey;
  const endpoint = environment === 'sandbox' ? SANDBOX_ENDPOINT : PRODUCTION_ENDPOINT;

  const response = await fetch(`${endpoint}/videos/${video.id}`, {
    method: 'GET',
    headers: {
      Authorization: `Basic ${btoa(secretKey as string)}`,
      'Content-Type': 'application/json',
    },
  });

  const result = (await response.json()) as ApiVideoVideo;

  if (result.mp4Support) {
    return {
      id: video.id,
      url: result.assets.mp4,
    };
  }

  throw new Error('Only videos with MP4s enabled are supported at this time');
}
