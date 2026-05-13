import Mux from '@mux/mux-node';
import { PlaybackPolicy } from '@mux/mux-node/resources';

import { updateJobStatus } from '@/utils/job';
import type { DestinationPlatform, SourcePlatform, Video } from '@/utils/store';

export async function transferVideo(
  jobId: string,
  video: Video,
  sourcePlatform: SourcePlatform,
  destinationPlatform: DestinationPlatform
) {
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
    meta: {
      external_id: video.id,
      title: video.title || video.id,
    },
    passthrough: JSON.stringify({ jobId, sourceVideoId: video.id }),
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

  await updateJobStatus(jobId, 'migration.video.progress', {
    video: {
      id: video.id,
      status: 'in-progress',
      progress: 0,
    },
  });

  return { status: 'success', result };
}
