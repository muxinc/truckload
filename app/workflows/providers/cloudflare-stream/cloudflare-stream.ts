import type { PlatformCredentials, Video } from '@/utils/store';

import type { CloudflareVideo } from './types';

export async function fetchPage(credentials: PlatformCredentials) {
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${credentials.publicKey}/stream`, {
    headers: {
      Authorization: `Bearer ${credentials.secretKey}`,
      'Content-Type': 'application/json',
    },
  });

  const result = await response.json();
  const isTruncated = result.range && result.range > 0;

  const videos =
    result.result
      ?.map((object: CloudflareVideo) => ({ id: object.uid }))
      .filter((item: Video): item is Video => !!item.id) || [];

  return { isTruncated, videos, cursor: null };
}

export async function fetchVideo(
  credentials: PlatformCredentials,
  video: Video
): Promise<{ id: string; url: string; needsPolling?: boolean }> {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${credentials.publicKey}/stream/${video.id}/downloads`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${credentials.secretKey}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const result = await response.json();

  if (result.result.default.status === 'ready') {
    return { id: video.id, url: result.result.default.url };
  }

  return { id: video.id, url: '', needsPolling: true };
}

export async function checkSourceStatus(
  credentials: PlatformCredentials,
  video: Video
): Promise<{ ready: boolean; url: string }> {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${credentials.publicKey}/stream/${video.id}/downloads`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${credentials.secretKey}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const result = await response.json();

  return {
    ready: result.result.default.status === 'ready',
    url: result.result.default.url as string,
  };
}
