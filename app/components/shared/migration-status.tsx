'use client';

import usePartySocket from 'partysocket/react';
import useMigrationStore from '@/utils/store';

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
      <h1>Migration Status</h1>
      {job?.status}

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
                  <td className="p-4 align-middle [&amp;:has([role=checkbox])]:pr-0">{video.status}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <button className="text-red-800 text-sm block" onClick={clearJob}>
        Clear job
      </button>
    </div>
  );
}
