'use client';

import type {} from '@redux-devtools/extension';
import type Image from 'next/image';
import { ComponentPropsWithoutRef } from 'react';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export type MigrationVideoProgressEvent = {
  type: 'migration.video.progress';
  data: {
    video: VideoWithMigrationStatus[];
  };
};

export type MigrationVideosFetchedEvent = {
  type: 'migration.videos.fetched';
  data: {
    pageNumber: number;
    videos: VideoWithMigrationStatus[];
    hasMorePages: boolean;
  };
};

export type MigrationStatus = {
  status: 'pending' | 'in-progress' | 'retrying' | 'completed' | 'failed';
  progress: number;
};

export type Video = {
  id: string;
  url?: string | undefined;
  title?: string | undefined;
  thumbnailUrl?: string | undefined;
};

export type VideoWithMigrationStatus = Video & MigrationStatus;

type PlatformCredentialsMetadata = {
  [key: string]: string;
};

export type PlatformCredentials = {
  publicKey: string;
  secretKey?: string | undefined;
  additionalMetadata?: PlatformCredentialsMetadata | undefined;
};

export interface SourcePlatform extends Platform {
  id: 's3' | 'cloudflare-stream' | 'api-video';
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
  logo: ComponentPropsWithoutRef<typeof Image>['src'];
  credentials?: PlatformCredentials | undefined;
  config?: PlatformConfig | undefined;
}

export type AssetFilter = {
  url: string;
};

export type MigrationJob = {
  id: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  progress: number;
  videos: Record<string, VideoWithMigrationStatus>;
};

type MigrationActions = {
  setAssetFilter: (filter: AssetFilter[] | null) => void;
  setPlatform: <T extends PlatformType>(
    type: T,
    platform: T extends 'source' ? SourcePlatform | null : DestinationPlatform | null
  ) => void;
  setCurrentStep: (step: MigrationStep) => void;
  setVideoMigrationProgress: (id: string, status: VideoWithMigrationStatus) => void;
};

interface MigrationState {
  sourcePlatform: SourcePlatform | null;
  destinationPlatform: DestinationPlatform | null;
  assetFilter: AssetFilter[] | null;
  job: MigrationJob | null;
  currentStep: MigrationStep;
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

// required for devtools typing
const useMigrationStore = create<MigrationState & MigrationActions>()(
  devtools(
    persist(
      immer((set) => ({
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
        setVideoMigrationProgress: (id: string, status: VideoWithMigrationStatus) => {
          set((state) => {
            if (state.job) {
              state.job.videos[id] = status;
            }
          });
        },
      })),
      {
        name: 'truckload-migration-storage',
      }
    )
  )
);

export default useMigrationStore;
