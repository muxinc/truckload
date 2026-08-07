import { GetObjectCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import Mux from '@mux/mux-node';
import { PlaybackPolicy } from '@mux/mux-node/resources';

import type { DestinationPlatform, PlatformCredentials, SourcePlatform, Video } from '@/utils/store';

// --- Provider logic (inlined to avoid local file imports in step bundle) ---

const API_VIDEO_SANDBOX = 'https://sandbox.api.video';
const API_VIDEO_PRODUCTION = 'https://ws.api.video';

function getApiVideoEndpoint(credentials: PlatformCredentials) {
  return credentials.additionalMetadata?.environment === 'sandbox' ? API_VIDEO_SANDBOX : API_VIDEO_PRODUCTION;
}

type FetchPageResult = { isTruncated: boolean | undefined; videos: Video[]; cursor: string | null | undefined };

function getVimeoThumbnailUrl(video: any): string | undefined {
  if (Array.isArray(video?.pictures?.sizes) && video.pictures.sizes.length > 0) {
    const largest = video.pictures.sizes[video.pictures.sizes.length - 1];
    if (typeof largest?.link === 'string' && largest.link.trim().length > 0) return largest.link;
  }

  if (typeof video?.pictures?.base_link === 'string' && video.pictures.base_link.trim().length > 0) {
    return video.pictures.base_link;
  }

  return undefined;
}

function getVimeoDurationSeconds(video: any): number | undefined {
  if (typeof video?.duration !== 'number' || !Number.isFinite(video.duration) || video.duration < 0) return undefined;
  return Math.floor(video.duration);
}

// --- Fetch Page implementations ---

export async function fetchPageApiVideo(credentials: PlatformCredentials, page: number): Promise<FetchPageResult> {
  const endpoint = getApiVideoEndpoint(credentials);
  const response = await fetch(`${endpoint}/videos?currentPage=${page}`, {
    method: 'GET',
    headers: {
      Authorization: `Basic ${btoa(credentials.secretKey as string)}`,
      'Content-Type': 'application/json',
    },
  });
  const result = await response.json();
  const isTruncated = result.pagination.currentPage < result.pagination.pagesTotal;
  const cursor = result.pagination.links.find((link: any) => link.rel === 'next')?.uri;
  const videos =
    result.data
      ?.map((obj: any) => ({ id: obj.videoId, title: obj.title }))
      .filter((item: Video): item is Video => !!item.id) || [];
  return { isTruncated, videos, cursor };
}

export async function fetchPageCloudflare(credentials: PlatformCredentials, page: number): Promise<FetchPageResult> {
  const perPage = 50;
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${credentials.publicKey}/stream?page=${page}&per_page=${perPage}`,
    {
      headers: {
        Authorization: `Bearer ${credentials.secretKey}`,
        'Content-Type': 'application/json',
      },
    }
  );
  const result = await response.json();
  const videos =
    result.result?.map((obj: any) => ({ id: obj.uid })).filter((item: Video): item is Video => !!item.id) || [];
  const isTruncated = videos.length >= perPage;
  return { isTruncated, videos, cursor: null };
}

export async function fetchPageVimeo(credentials: PlatformCredentials, page: number): Promise<FetchPageResult> {
  const response = await fetch(`https://api.vimeo.com/me/videos?page=${page}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${credentials.secretKey as string}`,
      'Content-Type': 'application/json',
    },
  });
  const result = await response.json();
  const isTruncated = result.page < Math.ceil(result.total / result.per_page);
  const videos =
    result.data
      ?.map((obj: any) => ({
        id: obj.uri,
        title: obj.name,
        thumbnailUrl: getVimeoThumbnailUrl(obj),
        durationSeconds: getVimeoDurationSeconds(obj),
        status: obj.status,
        type: obj.type,
      }))
      .filter((item: any): item is Video => !!item.id && item.status === 'available' && item.type === 'video') || [];
  return { isTruncated, videos, cursor: null };
}

export async function fetchPageWistia(credentials: PlatformCredentials, page: number): Promise<FetchPageResult> {
  const response = await fetch(`https://api.wistia.com/modern/medias?page=${page}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${credentials.secretKey as string}`,
      'Content-Type': 'application/json',
    },
  });
  const result: any[] = await response.json();
  const videos = result?.map((media: any) => {
    const download =
      media.assets?.find((asset: any) => asset.type === 'OriginalFile') ||
      media.assets?.reduce((largest: any, asset: any) =>
        asset.file_size > (largest?.file_size || 0) ? asset : largest
      );
    return { id: media.hashed_id, title: media.name, url: download?.url };
  });
  return { videos, isTruncated: result.length !== 0, cursor: null };
}

function getS3Credentials(credentials: PlatformCredentials) {
  const creds: any = {
    accessKeyId: credentials.publicKey,
    secretAccessKey: credentials.secretKey!,
  };
  if (credentials.additionalMetadata?.sessionToken) {
    creds.sessionToken = credentials.additionalMetadata.sessionToken;
  }
  return creds;
}

async function fetchPageS3(credentials: PlatformCredentials, _page: number, cursor?: string): Promise<FetchPageResult> {
  const client = new S3Client({
    credentials: getS3Credentials(credentials),
    region: credentials.additionalMetadata!.region,
  });
  const command: any = { Bucket: credentials.additionalMetadata!.bucket };
  if (cursor) {
    command.ContinuationToken = cursor;
  }
  const results = await client.send(new ListObjectsV2Command(command));
  const videos =
    results.Contents?.map((obj) => ({ id: obj.Key })).filter(
      (item): item is Video => !!item.id && /\.(mp4|mov|mp3)$/i.test(item.id)
    ) || [];
  return { isTruncated: results.IsTruncated, cursor: results.NextContinuationToken, videos };
}

// --- Fetch Video implementations ---

export async function fetchVideoApiVideo(credentials: PlatformCredentials, video: Video) {
  const endpoint = getApiVideoEndpoint(credentials);
  const response = await fetch(`${endpoint}/videos/${video.id}`, {
    method: 'GET',
    headers: {
      Authorization: `Basic ${btoa(credentials.secretKey as string)}`,
      'Content-Type': 'application/json',
    },
  });
  const result = await response.json();
  if (result.mp4Support) {
    return { id: video.id, url: result.assets.mp4 };
  }
  throw new Error('Only videos with MP4s enabled are supported at this time');
}

export async function fetchVideoCloudflare(credentials: PlatformCredentials, video: Video) {
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

export async function fetchVideoVimeo(credentials: PlatformCredentials, video: Video) {
  const response = await fetch(`https://api.vimeo.com${video.id}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${credentials.secretKey as string}`,
      'Content-Type': 'application/json',
    },
  });
  if (typeof response.ok === 'boolean' && !response.ok) {
    throw new Error(`Vimeo API request failed for ${video.id} with status ${response.status}`);
  }

  const result = await response.json();
  if (!result) throw new Error('Error fetching video from Vimeo');
  if (result.download && result.status === 'available' && result.type === 'video') {
    const renditions = ['source', '8k', '7k', '6k', '5k', '4k', '2k', '1080p', '720p', '540p', '480p', '360p', '240p'];
    const download = result.download.find((f: any) => renditions.includes(f.rendition));
    if (!download?.link) {
      throw new Error(`Vimeo video ${video.id} has no supported downloadable rendition`);
    }
    return {
      id: video.id,
      url: download?.link,
      title: result?.name,
      thumbnailUrl: getVimeoThumbnailUrl(result),
      durationSeconds: getVimeoDurationSeconds(result),
    };
  }
  throw new Error(
    `Vimeo video ${video.id} is not available for download (status=${result.status}, type=${result.type})`
  );
}

export async function fetchVideoWistia(_credentials: PlatformCredentials, video: Video) {
  if (!video) throw new Error('Error fetching video from Wistia');
  return video;
}

async function fetchVideoS3(credentials: PlatformCredentials, video: Video) {
  const client = new S3Client({
    credentials: getS3Credentials(credentials),
    region: credentials.additionalMetadata!.region,
  });
  const url = await getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: credentials.additionalMetadata!.bucket, Key: video.id }),
    { expiresIn: 3600 }
  );
  return { id: video.id, url };
}

// --- Provider dispatch maps ---

const fetchPageFns: Record<
  string,
  (credentials: PlatformCredentials, page: number, cursor?: string) => Promise<FetchPageResult>
> = {
  'api-video': fetchPageApiVideo,
  'cloudflare-stream': fetchPageCloudflare,
  vimeo: fetchPageVimeo,
  wistia: fetchPageWistia,
  s3: fetchPageS3,
};

const fetchVideoFns: Record<string, (credentials: PlatformCredentials, video: Video) => Promise<any>> = {
  'api-video': fetchVideoApiVideo,
  'cloudflare-stream': fetchVideoCloudflare,
  vimeo: fetchVideoVimeo,
  wistia: fetchVideoWistia,
  s3: fetchVideoS3,
};

// --- Step Functions ---

export async function fetchPageStep(
  platformId: string,
  credentials: PlatformCredentials,
  page: number,
  cursor?: string
): Promise<FetchPageResult> {
  'use step';
  const fn = fetchPageFns[platformId];
  if (!fn) throw new Error(`Provider ${platformId} does not support fetchPage`);
  return fn(credentials, page, cursor);
}

export async function fetchVideoStep(
  platformId: string,
  credentials: PlatformCredentials,
  video: Video
): Promise<Video & { needsPolling?: boolean }> {
  'use step';
  const fn = fetchVideoFns[platformId];
  if (!fn) throw new Error(`Provider ${platformId} does not support fetchVideo`);
  return fn(credentials, video);
}

export async function checkCloudflareStatus(
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

export async function checkCloudflareStatusStep(
  credentials: PlatformCredentials,
  video: Video
): Promise<{ ready: boolean; url: string }> {
  'use step';
  return checkCloudflareStatus(credentials, video);
}

export async function checkMuxAssetStatus(
  credentials: PlatformCredentials,
  assetId: string
): Promise<{ ready: boolean; errored: boolean }> {
  const response = await fetch(`https://api.mux.com/video/v1/assets/${assetId}`, {
    headers: {
      Authorization: `Basic ${btoa(`${credentials.publicKey}:${credentials.secretKey}`)}`,
      'Content-Type': 'application/json',
    },
  });
  const result = await response.json();
  return {
    ready: result.data.status === 'ready',
    errored: result.data.status === 'errored',
  };
}

export async function checkMuxAssetStatusStep(
  credentials: PlatformCredentials,
  assetId: string
): Promise<{ ready: boolean; errored: boolean }> {
  'use step';
  return checkMuxAssetStatus(credentials, assetId);
}

export async function transferVideoStep(
  jobId: string,
  video: Video,
  sourcePlatform: SourcePlatform,
  destinationPlatform: DestinationPlatform
): Promise<{ status: string; result: any }> {
  'use step';
  const mux = new Mux({
    tokenId: destinationPlatform.credentials!.publicKey,
    tokenSecret: destinationPlatform.credentials!.secretKey,
  });

  const config = destinationPlatform.config;
  let input: Mux.Video.Assets.AssetCreateParams.Input[] = [{ url: video.url }];
  if (config?.autoGenerateCaptions) {
    input[0].generated_subtitles = [{ name: 'English', language_code: 'en' }];
  }

  let payload: Mux.Video.Assets.AssetCreateParams = {
    input,
    meta: { external_id: video.id, title: video.title || video.id },
    passthrough: JSON.stringify({ jobId, sourceVideoId: video.id }),
  };

  if (config?.maxResolutionTier) payload = { ...payload, max_resolution_tier: config.maxResolutionTier as any };
  if (config?.playbackPolicy) {
    payload = {
      ...payload,
      playback_policy: Array.isArray(config.playbackPolicy)
        ? (config.playbackPolicy as PlaybackPolicy[])
        : ([config.playbackPolicy] as PlaybackPolicy[]),
    };
  }
  if (config?.videoQuality) payload = { ...payload, video_quality: config.videoQuality as any };
  if (config?.testMode) payload = { ...payload, test: true };

  const result = await mux.video.assets.create(payload);

  await fetch(`${process.env.NEXT_PUBLIC_PARTYKIT_URL}/party/${jobId}`, {
    method: 'PUT',
    body: JSON.stringify({
      id: jobId,
      type: 'migration.video.progress',
      data: { video: { id: video.id, status: 'in-progress', progress: 0 } },
    }),
    headers: { 'Content-Type': 'application/json' },
  });

  return { status: 'success', result };
}

export async function updateJobStatusStep(jobId: string, eventType: string, data: any): Promise<void> {
  'use step';
  await fetch(`${process.env.NEXT_PUBLIC_PARTYKIT_URL}/party/${jobId}`, {
    method: 'PUT',
    body: JSON.stringify({ id: jobId, type: eventType, data }),
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function getJobHaltStatusStep(jobId: string): Promise<{ halted: boolean; reason?: string }> {
  'use step';

  const response = await fetch(`${process.env.NEXT_PUBLIC_PARTYKIT_URL}/party/${jobId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    return { halted: false };
  }

  const job = (await response.json()) as { halted?: boolean; haltReason?: string };
  return { halted: !!job.halted, reason: job.haltReason };
}

export async function startProcessVideoWorkflow(
  jobId: string,
  sourcePlatform: SourcePlatform,
  destinationPlatform: DestinationPlatform,
  video: Video
): Promise<string> {
  'use step';
  const { start } = await import('workflow/api');
  const { processVideo } = await import('./migration');
  const run = await start(processVideo, [jobId, sourcePlatform, destinationPlatform, video]);
  return run.runId;
}
