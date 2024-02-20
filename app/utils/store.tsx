'use client';

import type {} from '@redux-devtools/extension';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// required for devtools typing

type PlatformCredentialsMetadata = {
  [key: string]: string;
};

type PlatformCredentials = {
  publicKeyId: string;
  secretKeyId?: string | undefined;
  additionalMetadata?: PlatformCredentialsMetadata | undefined;
};

interface SourcePlatform extends Platform {
  id: 's3';
  type: 'source';
}

interface DestinationPlatform extends Platform {
  id: 'mux';
  type: 'destination';
}

type PlatformType = 'source' | 'destination';

interface Platform {
  id: string;
  type: PlatformType;
  credentials?: PlatformCredentials | undefined;
}

interface MigrationState {
  sourcePlatform: SourcePlatform | null;
  destinationPlatform: DestinationPlatform | null;
  setPlatform: (type: PlatformType, platform: Platform) => void;
}

const useMigrationStore = create<MigrationState>()(
  devtools(
    persist(
      (set) => ({
        sourcePlatform: null,
        destinationPlatform: null,
        setPlatform: (type: PlatformType, platform: Platform) => {
          if (type === 'source') {
            set({ sourcePlatform: platform as SourcePlatform });
          } else {
            set({ destinationPlatform: platform as DestinationPlatform });
          }
        },
      }),
      {
        name: 'in-n-out-migration-storage',
      }
    )
  )
);

export default useMigrationStore;
