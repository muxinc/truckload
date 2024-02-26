import { encryptionMiddleware } from '@inngest/middleware-encryption';
import { EventSchemas, Inngest } from 'inngest';

import type { AssetFilter, DestinationPlatform, PlatformCredentials, SourcePlatform } from '@/utils/store';

export type Video = {
  id: string;
  url?: string | undefined;
};

type FetchVideo = {
  data: {
    encrypted: {
      credentials: PlatformCredentials;
      video: Video;
    };
  };
};

type FetchPage = {
  data: {
    encrypted: PlatformCredentials;
  };
};

type ProcessVideo = {
  data: {
    encrypted: {
      sourcePlatform: SourcePlatform;
      destinationPlatform: DestinationPlatform;
      video: Video;
    };
  };
};

type InitMigration = {
  data: {
    encrypted: {
      sourcePlatform: SourcePlatform;
      destinationPlatform: DestinationPlatform;
      assetFilter: AssetFilter;
    };
  };
};

type Events = {
  'in-n-out/migration.init': InitMigration;
  'in-n-out/migration.fetch-page': FetchPage;
  'in-n-out/video.process': ProcessVideo;
  'in-n-out/video.fetch': FetchVideo;
  'in-n-out/video.transfer': ProcessVideo;
};

const mw = encryptionMiddleware({
  key: process.env.INNGEST_ENCRYPTION_KEY as string,
});

export const inngest = new Inngest({
  id: 'in-n-out-video',
  middleware: [mw],
  schemas: new EventSchemas().fromRecord<Events>(),
});
