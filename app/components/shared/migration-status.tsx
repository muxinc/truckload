'use client';

import clsx from 'clsx';
import usePartySocket from 'partysocket/react';

import useMigrationStore from '@/utils/store';

import Heading from '../heading';

// import type { VideoWithMigrationStatus } from '@/utils/store';

export default function MigrationStatus() {
  const job = useMigrationStore((state) => state.job);
  const setVideoMigrationProgress = useMigrationStore((state) => state.setVideoMigrationProgress);

  const socket = usePartySocket({
    host: process.env.NEXT_PUBLIC_PARTYKIT_URL,
    room: job!.id,
    onMessage(event) {
      const payload = JSON.parse(event.data);
      if (!payload) return;
      // todo: set the state appropriately based on the event type
      console.log(`payload received!`);
      console.log(payload);

      switch (payload.type) {
        case 'migration.videos.fetched':
          const { hasMorePages, pageNumber, videos } = payload.data;
          useMigrationStore.setState({ job: { ...job, ...payload.data } });
          break;
        case 'migration.video.progress':
          const { video } = payload.data;

          setVideoMigrationProgress(video.id, video);
          break;
        default:
          break;
      }
    },
  });

  const clearJob = () => {
    useMigrationStore.setState({ job: undefined, currentStep: 'review' });
  };

  const videoIds = Object.keys(job?.videos || {});

  return (
    <div>
      <Heading>Migration Status</Heading>
      {/* {job?.status} */}
      <p className="text-xs mb-2">Note: this page will only update if you've correctly configured status webhooks.</p>

      <div className="relative w-full overflow-auto">
        <table className="w-full caption-bottom text-sm">
          <thead className="[&amp;_tr]:border-b">
            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&amp;:has([role=checkbox])]:pr-0 w-[180px]">
                Video
              </th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&amp;:has([role=checkbox])]:pr-0">
                Progress
              </th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&amp;:has([role=checkbox])]:pr-0">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="[&amp;_tr:last-child]:border-0">
            {videoIds.map((id) => {
              const video = job?.videos[id];
              if (!video) return null;
              return (
                <tr
                  key={video.id}
                  className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                >
                  <td className="p-4 align-middle [&amp;:has([role=checkbox])]:pr-0 font-medium">
                    {video.title || video.id}
                  </td>
                  <td className="p-4 align-middle [&amp;:has([role=checkbox])]:pr-0">{video.progress}%</td>
                  <td className="p-4 align-middle [&amp;:has([role=checkbox])]:pr-0">
                    <span
                      className={clsx(
                        'rounded-full px-3 py-1 capitalize text-xs',
                        video.status === 'pending' && 'bg-orange-400 text-white',
                        video.status === 'failed' && 'bg-red-400 text-white',
                        video.status === 'in-progress' && 'bg-blue-400 text-white',
                        video.status === 'completed' && 'bg-green-400 text-white'
                      )}
                    >
                      {video.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <button className="text-red-800 text-sm block mt-4" onClick={clearJob}>
        Clear job
      </button>
    </div>
  );
}
