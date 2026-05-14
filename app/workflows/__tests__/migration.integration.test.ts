import { waitForSleep } from '@workflow/vitest';
import nock from 'nock';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getRun, start } from 'workflow/api';

import { processVideo } from '../migration';

// Save and restore fetch for workflow internal routes
const originalFetch = globalThis.fetch;

beforeEach(() => {
  nock.disableNetConnect();
  // Allow localhost for workflow internal communication
  nock.enableNetConnect(/localhost|127\.0\.0\.1/);

  // Mock partykit job status updates (globalThis.fetch is used for these)
  const mockFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    if (url.includes('party') || !url.startsWith('http')) {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }
    return originalFetch(input, init as any);
  };
  globalThis.fetch = mockFetch as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  nock.cleanAll();
  nock.enableNetConnect();
});

describe('processVideo workflow', () => {
  it('should fetch, transfer, and poll until asset ready (api-video source, mux destination)', async () => {
    // Mock api.video fetchVideo
    nock('https://sandbox.api.video')
      .get('/videos/v1')
      .reply(200, {
        mp4Support: true,
        assets: { mp4: 'https://cdn.api.video/v1.mp4' },
      });

    // Mock Mux asset creation
    nock('https://api.mux.com')
      .post('/video/v1/assets')
      .reply(200, {
        data: { id: 'mux-asset-1', status: 'preparing', playback_ids: [] },
      });

    // Mock Mux asset status poll (first: preparing, second: ready)
    nock('https://api.mux.com')
      .get('/video/v1/assets/mux-asset-1')
      .reply(200, {
        data: { id: 'mux-asset-1', status: 'preparing', playback_ids: [] },
      });

    nock('https://api.mux.com')
      .get('/video/v1/assets/mux-asset-1')
      .reply(200, {
        data: { id: 'mux-asset-1', status: 'ready', playback_ids: [{ id: 'pid-1' }] },
      });

    const run = await start(processVideo, [
      'job-123',
      {
        id: 'api-video' as const,
        name: 'api.video',
        type: 'source' as const,
        logo: '',
        credentials: {
          publicKey: 'pub',
          secretKey: 'secret',
          additionalMetadata: { environment: 'sandbox' },
        },
      },
      {
        id: 'mux' as const,
        name: 'Mux',
        type: 'destination' as const,
        logo: '',
        credentials: { publicKey: 'mux-token-id', secretKey: 'mux-token-secret' },
      },
      { id: 'v1', title: 'Test Video' },
    ]);

    // Wake up the sleep calls (5s polling delays for Mux asset status)
    const sleepId1 = await waitForSleep(run);
    await getRun(run.runId).wakeUp({ correlationIds: [sleepId1] });

    const sleepId2 = await waitForSleep(run);
    await getRun(run.runId).wakeUp({ correlationIds: [sleepId2] });

    const result = await run.returnValue;
    expect(result.status).toBe('success');
  });

  it('should handle cloudflare-stream polling when video not ready', async () => {
    // Mock Cloudflare Stream fetchVideo (POST to create download - not ready)
    nock('https://api.cloudflare.com')
      .post('/client/v4/accounts/cf-account/stream/cf-1/downloads')
      .reply(200, {
        result: { default: { status: 'processing', url: '' } },
      });

    // Mock checkSourceStatus (GET - first poll, still processing)
    nock('https://api.cloudflare.com')
      .get('/client/v4/accounts/cf-account/stream/cf-1/downloads')
      .reply(200, {
        result: { default: { status: 'processing', url: '' } },
      });

    // Mock checkSourceStatus (GET - second poll, ready)
    nock('https://api.cloudflare.com')
      .get('/client/v4/accounts/cf-account/stream/cf-1/downloads')
      .reply(200, {
        result: { default: { status: 'ready', url: 'https://cf.com/video.mp4' } },
      });

    // Mock Mux asset creation
    nock('https://api.mux.com')
      .post('/video/v1/assets')
      .reply(200, {
        data: { id: 'mux-asset-2', status: 'preparing', playback_ids: [] },
      });

    // Mock Mux asset status poll (immediately ready)
    nock('https://api.mux.com')
      .get('/video/v1/assets/mux-asset-2')
      .reply(200, {
        data: { id: 'mux-asset-2', status: 'ready', playback_ids: [{ id: 'pid-2' }] },
      });

    const run = await start(processVideo, [
      'job-456',
      {
        id: 'cloudflare-stream' as const,
        name: 'Cloudflare Stream',
        type: 'source' as const,
        logo: '',
        credentials: { publicKey: 'cf-account', secretKey: 'cf-token' },
      },
      {
        id: 'mux' as const,
        name: 'Mux',
        type: 'destination' as const,
        logo: '',
        credentials: { publicKey: 'mux-token-id', secretKey: 'mux-token-secret' },
      },
      { id: 'cf-1' },
    ]);

    // Wake up Cloudflare polling sleeps
    const sleepId1 = await waitForSleep(run);
    await getRun(run.runId).wakeUp({ correlationIds: [sleepId1] });

    const sleepId2 = await waitForSleep(run);
    await getRun(run.runId).wakeUp({ correlationIds: [sleepId2] });

    // Wake up Mux asset status polling sleep
    const sleepId3 = await waitForSleep(run);
    await getRun(run.runId).wakeUp({ correlationIds: [sleepId3] });

    const result = await run.returnValue;
    expect(result.status).toBe('success');
  });
});
