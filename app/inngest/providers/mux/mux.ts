import Mux from '@mux/mux-node';
import { PlaybackPolicy } from '@mux/mux-node/resources';

import { inngest } from '@/inngest/client';
import { updateJobStatus } from '@/utils/job';

// We decouple the logic of the copy video function from the run migration function
// to allow this to be re-used and tested independently.
// This also allows the system to define different configuration for each part,
// like limits on concurrency for how many videos should be copied in parallel
// A separate function could be created for each destination platform
export const transferVideo = inngest.createFunction(
  { id: 'transfer-video', name: 'Transfer video - Mux', concurrency: 10 },
  { event: 'truckload/video.transfer' },
  async ({ event, step }) => {
    const mux = new Mux({
      tokenId: event.data.encrypted.destinationPlatform.credentials!.publicKey,
      tokenSecret: event.data.encrypted.destinationPlatform.credentials!.secretKey,
    });

    const config = event.data.encrypted.destinationPlatform.config;

    let input: Mux.Video.Assets.AssetCreateParams.Input[] = [{ url: event.data.encrypted.video.url }];

    if (config?.autoGenerateCaptions) {
      input[0].generated_subtitles = [{ name: 'English', language_code: 'en' }];
    }

    let payload: Mux.Video.Assets.AssetCreateParams = {
      input,
      passthrough: JSON.stringify({ jobId: event.data.jobId, sourceVideoId: event.data.encrypted.video.id }),
    };

    if (config?.maxResolutionTier) {
      payload = { ...payload, max_resolution_tier: config.maxResolutionTier as any };
    }

    if (config?.playbackPolicy) {
      payload = {
        ...payload,
        playback_policy: Array.isArray(config.playbackPolicy)
          ? (config.playbackPolicy as PlaybackPolicy[])
          : ([config.playbackPolicy] as PlaybackPolicy[]),
      };
    }

    if (config?.videoQuality) {
      payload = { ...payload, video_quality: config.videoQuality as any };
    }

    if (config?.testMode) {
      payload = { ...payload, test: true };
    }

    const result = await mux.video.assets.create(payload);

    await updateJobStatus(event.data.jobId, 'migration.video.progress', {
      video: {
        id: event.data.encrypted.video.id,
        status: 'in-progress',
        progress: 0,
      },
    });

    return { status: 'success', result };
  }
);
