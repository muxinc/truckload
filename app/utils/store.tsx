'use client';

import type {} from '@redux-devtools/extension';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// required for devtools typing

type PlatformCredentialsMetadata = {
  [key: string]: string;
};

export type PlatformCredentials = {
  publicKey: string;
  secretKey?: string | undefined;
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
export type PlatformConfig = {
  [key: string]: string;
};

interface Platform {
  name: string;
  logo: () => JSX.Element;
  credentials?: PlatformCredentials | undefined;
  config?: PlatformConfig | undefined;
}

export type AssetFilter = {
  url: string;
};

type Job = {
  id: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
};

interface MigrationState {
  sourcePlatform: SourcePlatform | null;
  destinationPlatform: DestinationPlatform | null;
  assetFilter: AssetFilter[] | null;
  job: Job | null;
  currentStep: MigrationStep;
  setAssetFilter: (filter: AssetFilter[] | null) => void;
  setPlatform: <T extends PlatformType>(
    type: T,
    platform: T extends 'source' ? SourcePlatform | null : DestinationPlatform | null
  ) => void;
  setCurrentStep: (step: MigrationStep) => void;
}

type MigrationStep =
  | 'select-source'
  | 'set-source-credentials'
  | 'set-video-filter'
  | 'select-videos'
  | 'select-destination'
  | 'set-destination-credentials'
  | 'set-import-settings'
  | 'review'
  | 'migration-status';

const useMigrationStore = create<MigrationState>()(
  devtools(
    persist(
      (set) => ({
        sourcePlatform: null,
        destinationPlatform: null,
        assetFilter: null,
        job: null,
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
