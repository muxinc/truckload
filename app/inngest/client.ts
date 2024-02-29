import { encryptionMiddleware } from '@inngest/middleware-encryption';
import { EventSchemas, Inngest } from 'inngest';

import type { AssetFilter, DestinationPlatform, PlatformCredentials, SourcePlatform, Video } from '@/utils/store';

type FetchVideo = {
  data: {
    jobId: string;
    encrypted: {
      credentials: PlatformCredentials;
      video: Video;
    };
  };
};

type FetchPage = {
  data: {
    jobId: string;
    encrypted: PlatformCredentials;
  };
};

type ProcessVideo = {
  data: {
    jobId: string;
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
  'truckload/migration.init': InitMigration;
  'truckload/migration.fetch-page': FetchPage;
  'truckload/video.process': ProcessVideo;
  'truckload/video.fetch': FetchVideo;
  'truckload/video.transfer': ProcessVideo;
};

const mw = encryptionMiddleware({
  key: process.env.INNGEST_ENCRYPTION_KEY as string,
});

export const inngest = new Inngest({
  id: 'truckload-video',
  middleware: [mw],
  schemas: new EventSchemas().fromRecord<Events>(),
});
