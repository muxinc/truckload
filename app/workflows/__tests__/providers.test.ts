import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  checkCloudflareStatus,
  checkMuxAssetStatus,
  fetchPageApiVideo,
  fetchPageCloudflare,
  fetchPageVimeo,
  fetchPageWistia,
  fetchVideoApiVideo,
  fetchVideoCloudflare,
  fetchVideoVimeo,
  fetchVideoWistia,
} from '../steps';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

describe('Api.video provider', () => {
  it('fetchPage returns videos', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          data: [
            { videoId: 'v1', title: 'Video 1' },
            { videoId: 'v2', title: 'Video 2' },
          ],
          pagination: {
            currentPage: 1,
            pagesTotal: 1,
            links: [],
          },
        }),
    });

    const result = await fetchPageApiVideo(
      {
        publicKey: 'pub',
        secretKey: 'secret',
        additionalMetadata: { environment: 'sandbox' },
      },
      1
    );

    expect(result.videos).toHaveLength(2);
    expect(result.videos[0].id).toBe('v1');
    expect(result.isTruncated).toBe(false);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://sandbox.api.video/videos?currentPage=1',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('fetchVideo returns video with mp4 url', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          mp4Support: true,
          assets: { mp4: 'https://cdn.api.video/v1.mp4' },
        }),
    });

    const result = await fetchVideoApiVideo({ publicKey: 'pub', secretKey: 'secret' }, { id: 'v1' });

    expect(result).toEqual({ id: 'v1', url: 'https://cdn.api.video/v1.mp4' });
  });

  it('fetchVideo throws when no mp4 support', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({ mp4Support: false }),
    });

    await expect(fetchVideoApiVideo({ publicKey: 'pub', secretKey: 'secret' }, { id: 'v1' })).rejects.toThrow(
      'Only videos with MP4s enabled are supported'
    );
  });
});

describe('Cloudflare Stream provider', () => {
  it('fetchPage returns videos', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          result: [{ uid: 'cf-1' }, { uid: 'cf-2' }],
        }),
    });

    const result = await fetchPageCloudflare(
      {
        publicKey: 'account-id',
        secretKey: 'api-token',
      },
      1
    );

    expect(result.videos).toHaveLength(2);
    expect(result.videos[0].id).toBe('cf-1');
    expect(result.isTruncated).toBe(false);
  });

  it('fetchVideo returns ready video', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          result: { default: { status: 'ready', url: 'https://download.cloudflare.com/v.mp4' } },
        }),
    });

    const result = await fetchVideoCloudflare({ publicKey: 'account-id', secretKey: 'api-token' }, { id: 'cf-1' });

    expect(result).toEqual({ id: 'cf-1', url: 'https://download.cloudflare.com/v.mp4' });
  });

  it('fetchVideo returns needsPolling when not ready', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          result: { default: { status: 'processing', url: '' } },
        }),
    });

    const result = await fetchVideoCloudflare({ publicKey: 'account-id', secretKey: 'api-token' }, { id: 'cf-1' });

    expect(result.needsPolling).toBe(true);
  });

  it('checkCloudflareStatus returns status', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          result: { default: { status: 'ready', url: 'https://download.cloudflare.com/v.mp4' } },
        }),
    });

    const result = await checkCloudflareStatus({ publicKey: 'account-id', secretKey: 'api-token' }, { id: 'cf-1' });

    expect(result.ready).toBe(true);
    expect(result.url).toBe('https://download.cloudflare.com/v.mp4');
  });
});

describe('Vimeo provider', () => {
  it('fetchPage returns videos', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          total: 2,
          page: 1,
          per_page: 25,
          data: [
            { uri: '/videos/1', name: 'V1', status: 'available', type: 'video' },
            { uri: '/videos/2', name: 'V2', status: 'available', type: 'video' },
          ],
        }),
    });

    const result = await fetchPageVimeo({ publicKey: '', secretKey: 'token' }, 1);

    expect(result.videos).toHaveLength(2);
    expect(result.isTruncated).toBe(false);
  });

  it('fetchVideo returns video with download link', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          uri: '/videos/1',
          name: 'My Video',
          status: 'available',
          type: 'video',
          download: [{ rendition: 'source', link: 'https://vimeo.com/download/1.mp4' }],
        }),
    });

    const result = await fetchVideoVimeo({ publicKey: '', secretKey: 'token' }, { id: '/videos/1' });

    expect(result).toEqual({
      id: '/videos/1',
      url: 'https://vimeo.com/download/1.mp4',
      title: 'My Video',
    });
  });
});

describe('Mux asset status', () => {
  it('checkMuxAssetStatus returns ready when asset is ready', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          data: { id: 'asset-1', status: 'ready', playback_ids: [{ id: 'pid-1' }] },
        }),
    });

    const result = await checkMuxAssetStatus({ publicKey: 'token-id', secretKey: 'token-secret' }, 'asset-1');

    expect(result.ready).toBe(true);
    expect(result.errored).toBe(false);
  });

  it('checkMuxAssetStatus returns errored when asset has errored', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          data: { id: 'asset-1', status: 'errored' },
        }),
    });

    const result = await checkMuxAssetStatus({ publicKey: 'token-id', secretKey: 'token-secret' }, 'asset-1');

    expect(result.ready).toBe(false);
    expect(result.errored).toBe(true);
  });

  it('checkMuxAssetStatus returns not ready when asset is preparing', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () =>
        Promise.resolve({
          data: { id: 'asset-1', status: 'preparing' },
        }),
    });

    const result = await checkMuxAssetStatus({ publicKey: 'token-id', secretKey: 'token-secret' }, 'asset-1');

    expect(result.ready).toBe(false);
    expect(result.errored).toBe(false);
  });
});

describe('Wistia provider', () => {
  it('fetchPage returns videos', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () =>
        Promise.resolve([
          {
            hashed_id: 'w1',
            name: 'Wistia Video',
            assets: [{ type: 'OriginalFile', file_size: 1000, url: 'https://wistia.com/w1.mp4' }],
          },
        ]),
    });

    const result = await fetchPageWistia({ publicKey: '', secretKey: 'token' }, 1);

    expect(result.videos).toHaveLength(1);
    expect(result.videos[0].id).toBe('w1');
    expect(result.videos[0].url).toBe('https://wistia.com/w1.mp4');
  });

  it('fetchVideo returns the video as-is', async () => {
    const video = { id: 'w1', url: 'https://wistia.com/w1.mp4' };
    const result = await fetchVideoWistia({ publicKey: '', secretKey: 'token' }, video);
    expect(result).toEqual(video);
  });
});
