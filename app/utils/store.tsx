'use client';

import type {} from '@redux-devtools/extension';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// required for devtools typing

type PlatformCredentialsMetadata = {
  [key: string]: string;
};

export type PlatformCredentials = {
  publicKeyId: string;
  secretKeyId?: string | undefined;
  additionalMetadata?: PlatformCredentialsMetadata | undefined;
};

export interface SourcePlatform extends Platform {
  id: 's3';
  type: 'source';
}

export interface DestinationPlatform extends Platform {
  id: 'mux';
  type: 'destination';
}

type PlatformType = 'source' | 'destination';

interface Platform {
  name: string;
  logo: () => JSX.Element;
  credentials?: PlatformCredentials | undefined;
}

export type AssetFilter = {
  url: string;
};

interface MigrationState {
  sourcePlatform: SourcePlatform | null;
  destinationPlatform: DestinationPlatform | null;
  assetFilter: AssetFilter[] | null;
  setAssetFilter: (filter: AssetFilter[] | null) => void;
  setPlatform: <T extends PlatformType>(
    type: T,
    platform: T extends 'source' ? SourcePlatform | null : DestinationPlatform | null
  ) => void;
  currentStep: MigrationStep;
  setCurrentStep: (step: MigrationStep) => void;
}

type MigrationStep =
  | 'select-source'
  | 'set-source-credentials'
  | 'select-video-filter'
  | 'select-videos'
  | 'select-destination'
  | 'set-destination-credentials'
  | 'set-destination-metadata'
  | 'review'
  | 'status';

const useMigrationStore = create<MigrationState>()(
  devtools(
    persist(
      (set) => ({
        sourcePlatform: null,
        destinationPlatform: null,
        assetFilter: null,
        currentStep: 'select-source',
        setCurrentStep: (step: MigrationStep) => {
          set({ currentStep: step });
        },
        setAssetFilter: (filter: AssetFilter[] | null) => {
          set({ assetFilter: filter });
        },
        setPlatform: <T extends PlatformType>(
          type: T,
          platform: T extends 'source' ? SourcePlatform | null : DestinationPlatform | null
        ) => {
          if (type === 'source') {
            set({ sourcePlatform: platform as SourcePlatform | null });
          } else if (type === 'destination') {
            set({ destinationPlatform: platform as DestinationPlatform | null });
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
