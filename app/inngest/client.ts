import { encryptionMiddleware } from '@inngest/middleware-encryption';
import { EventSchemas, Inngest } from 'inngest';

import type { AssetFilter, DestinationPlatform, PlatformCredentials, SourcePlatform } from '@/utils/store';

type Video = {
  id: string;
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
  'in-n-out/migration.fetch-video': FetchVideo;
};

const mw = encryptionMiddleware({
  key: process.env.INNGEST_ENCRYPTION_KEY as string,
});

export const inngest = new Inngest({
  id: 'in-n-out-video',
  middleware: [mw],
  schemas: new EventSchemas().fromRecord<Events>(),
});
