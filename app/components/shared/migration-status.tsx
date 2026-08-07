'use client';

import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import clsx from 'clsx';
import usePartySocket from 'partysocket/react';

import useMigrationStore from '@/utils/store';

import Heading from '../heading';

// import type { VideoWithMigrationStatus } from '@/utils/store';

type VideoStatusFilter = 'all' | 'pending' | 'in-progress' | 'retrying' | 'completed' | 'failed';

function formatDuration(durationSeconds?: number): string | null {
  if (typeof durationSeconds !== 'number' || !Number.isFinite(durationSeconds) || durationSeconds < 0) {
    return null;
  }

  const totalSeconds = Math.floor(durationSeconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const minutePart = String(minutes).padStart(2, '0');
  const secondPart = String(seconds).padStart(2, '0');
  if (hours > 0) {
    return `${hours}:${minutePart}:${secondPart}`;
  }

  return `${minutePart}:${secondPart}`;
}

export default function MigrationStatus() {
  const job = useMigrationStore((state) => state.job);
  const sourcePlatform = useMigrationStore((state) => state.sourcePlatform);
  const destinationPlatform = useMigrationStore((state) => state.destinationPlatform);
  const assetFilter = useMigrationStore((state) => state.assetFilter);
  const setVideoMigrationProgress = useMigrationStore((state) => state.setVideoMigrationProgress);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [startingIds, setStartingIds] = useState<Record<string, boolean>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [statusFilter, setStatusFilter] = useState<VideoStatusFilter>('all');

  const getSourceLink = (id: string): string | null => {
    if (!sourcePlatform) return null;

    if (sourcePlatform.id === 'vimeo') {
      const normalizedId = id.replace(/^\/videos\//, '');
      return `https://vimeo.com/manage/videos/${normalizedId}`;
    }

    return null;
  };

  const videoIds = Object.keys(job?.videos || {});
  const filteredVideoIds = useMemo(() => {
    const query = filterText.trim().toLowerCase();
    return videoIds.filter((id) => {
      const video = job?.videos[id];
      if (!video) return false;

      const matchesStatus = statusFilter === 'all' || video.status === statusFilter;
      if (!matchesStatus) return false;

      if (!query) return true;

      const title = (video.title || '').toLowerCase();
      const normalizedId = video.id.toLowerCase();
      return title.includes(query) || normalizedId.includes(query);
    });
  }, [filterText, job?.videos, statusFilter, videoIds]);

  const pendingVideoIds = useMemo(
    () => videoIds.filter((id) => job?.videos[id]?.status === 'pending'),
    [videoIds, job?.videos]
  );
  const filteredPendingVideoIds = useMemo(
    () => filteredVideoIds.filter((id) => job?.videos[id]?.status === 'pending'),
    [filteredVideoIds, job?.videos]
  );
  const selectedPendingIds = selectedIds.filter((id) => pendingVideoIds.includes(id));
  const selectedFilteredPendingIds = selectedIds.filter((id) => filteredPendingVideoIds.includes(id));
  const isManualSelectionMode = assetFilter === false;

  const startUploads = async (ids: string[]) => {
    if (!job || !sourcePlatform || !destinationPlatform || ids.length === 0) return;

    const videos = ids
      .map((id) => job.videos[id])
      .filter((video): video is NonNullable<typeof video> => !!video)
      .map((video) => ({ id: video.id, title: video.title }));

    if (!videos.length) return;

    const updates = videos.reduce<Record<string, boolean>>((acc, video) => {
      acc[video.id] = true;
      return acc;
    }, {});
    setStartingIds((prev) => ({ ...prev, ...updates }));

    try {
      const response = await fetch('/api/job', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.id,
          sourcePlatform,
          destinationPlatform,
          videos,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error || 'Failed to enqueue upload start');
      }

      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
      toast.success(`Started ${videos.length} upload${videos.length > 1 ? 's' : ''}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start uploads';

      for (const video of videos) {
        const current = useMigrationStore.getState().job?.videos[video.id];
        if (!current) continue;
        setVideoMigrationProgress(video.id, {
          ...current,
          status: 'failed',
          progress: 100,
          error: errorMessage,
        });
      }

      toast.error(errorMessage);
    } finally {
      setStartingIds((prev) => {
        const next = { ...prev };
        for (const id of ids) delete next[id];
        return next;
      });
    }
  };

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
          useMigrationStore.setState({ job: { ...job, ...payload.data } });
          break;
        case 'migration.video.progress':
          const { video } = payload.data;

          setVideoMigrationProgress(video.id, video);
          break;
        case 'migration.job.halted':
          useMigrationStore.setState({
            job: {
              ...useMigrationStore.getState().job!,
              halted: true,
              haltReason: payload.data?.reason,
              status: 'failed',
            },
          });
          break;
        default:
          break;
      }
    },
  });

  const clearJob = () => {
    useMigrationStore.setState({ job: undefined, currentStep: 'review' });
  };

  const refreshVideoList = async () => {
    if (!job?.id || !sourcePlatform) return;

    setIsRefreshing(true);
    try {
      const response = await fetch('/api/job', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'refresh-videos',
          jobId: job.id,
          sourcePlatform,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error || 'Failed to refresh video list');
      }

      toast.success('Refreshing video list...');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to refresh video list');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div>
      <Heading>Migration Status</Heading>
      {/* {job?.status} */}
      <p className="text-xs mb-2">Note: this page updates in real-time as videos are processed.</p>
      {isManualSelectionMode && (
        <div className="mb-3 flex items-center gap-3">
          <button
            className="text-sm rounded border border-slate-300 px-3 py-1 disabled:opacity-50"
            onClick={refreshVideoList}
            disabled={!job?.id || !sourcePlatform || isRefreshing}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh video list'}
          </button>
          <div className="grow" />
          <span className="text-xs text-slate-500">
            {selectedPendingIds.length}/{pendingVideoIds.length} selected
          </span>
          <button
            className="text-sm rounded border border-slate-300 px-3 py-1 disabled:opacity-50"
            disabled={selectedPendingIds.length === 0}
            onClick={() => startUploads(selectedPendingIds)}
          >
            Upload selected
          </button>
        </div>
      )}

      <div className="mb-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
        <div>
          <label htmlFor="migration-status-filter" className="mb-1 block text-xs text-slate-600">
            Filter by video name or ID
          </label>
          <input
            id="migration-status-filter"
            type="text"
            value={filterText}
            onChange={(event) => setFilterText(event.target.value)}
            placeholder="Search videos..."
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
        <div>
          <label htmlFor="migration-status-filter-status" className="mb-1 block text-xs text-slate-600">
            Filter by status
          </label>
          <select
            id="migration-status-filter-status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as VideoStatusFilter)}
            className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In progress</option>
            <option value="retrying">Retrying</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      <div className="relative w-full overflow-auto">
        <table className="w-full table-auto caption-bottom text-sm">
          <thead className="[&amp;_tr]:border-b">
            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
              {isManualSelectionMode && (
                <th className="h-12 w-px whitespace-nowrap px-4 text-left align-middle font-medium text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={
                      filteredPendingVideoIds.length > 0 &&
                      selectedFilteredPendingIds.length === filteredPendingVideoIds.length
                    }
                    onChange={(event) => {
                      if (event.target.checked) {
                        setSelectedIds((prev) => [...new Set([...prev, ...filteredPendingVideoIds])]);
                      } else {
                        setSelectedIds((prev) => prev.filter((id) => !filteredPendingVideoIds.includes(id)));
                      }
                    }}
                    aria-label="Select pending videos"
                  />
                </th>
              )}
              <th className="h-12 w-full px-4 text-left align-middle font-medium text-muted-foreground [&amp;:has([role=checkbox])]:pr-0">
                Video
              </th>
              <th className="h-12 w-px whitespace-nowrap px-4 text-left align-middle font-medium text-muted-foreground [&amp;:has([role=checkbox])]:pr-0">
                Progress
              </th>
              <th className="h-12 w-px whitespace-nowrap px-4 text-left align-middle font-medium text-muted-foreground [&amp;:has([role=checkbox])]:pr-0">
                Status
              </th>
              <th className="h-12 w-px whitespace-nowrap px-4 text-left align-middle font-medium text-muted-foreground [&amp;:has([role=checkbox])]:pr-0">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="[&amp;_tr:last-child]:border-0">
            {filteredVideoIds.map((id) => {
              const video = job?.videos[id];
              if (!video) return null;
              const durationLabel = formatDuration(video.durationSeconds);
              const sourceLink = getSourceLink(video.id);
              return (
                <tr
                  key={video.id}
                  className="h-[108px] border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                >
                  {isManualSelectionMode && (
                    <td className="p-4 align-middle">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(video.id)}
                        disabled={video.status !== 'pending'}
                        onChange={(event) => {
                          setSelectedIds((prev) => {
                            if (event.target.checked) {
                              return [...new Set([...prev, video.id])];
                            }
                            return prev.filter((id) => id !== video.id);
                          });
                        }}
                        aria-label={`Select ${video.title || video.id}`}
                      />
                    </td>
                  )}
                  <td className="w-full p-4 align-middle font-medium [&amp;:has([role=checkbox])]:pr-0">
                    <div className="flex min-h-[84px] items-center gap-3">
                      <div className="relative h-[84px] w-[150px] shrink-0 overflow-hidden rounded border border-slate-200 bg-slate-100">
                        {video.thumbnailUrl ? (
                          <img
                            src={video.thumbnailUrl}
                            alt={video.title || video.id}
                            width={150}
                            className="block h-full w-[150px] object-cover"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[11px] font-medium uppercase tracking-wide text-slate-400">
                            No preview
                          </div>
                        )}
                        {durationLabel ? (
                          <span className="absolute bottom-1 right-1 rounded bg-black/75 px-1.5 py-0.5 text-[11px] font-medium text-white">
                            {durationLabel}
                          </span>
                        ) : null}
                      </div>

                      <div className="flex h-[84px] min-w-0 flex-col justify-center">
                        <p className="truncate">{video.title || video.id}</p>
                        {sourceLink ? (
                          <a
                            href={sourceLink}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 truncate text-xs font-normal text-primary underline"
                          >
                            {video.id}
                          </a>
                        ) : (
                          <p className="mt-1 truncate text-xs font-normal text-slate-500">{video.id}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="w-px whitespace-nowrap p-4 align-middle [&amp;:has([role=checkbox])]:pr-0">
                    {video.progress}%
                  </td>
                  <td className="w-px whitespace-nowrap p-4 align-middle [&amp;:has([role=checkbox])]:pr-0">
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
                    {video.error ? (
                      <span
                        className="ml-2 inline-flex h-4 w-4 items-center justify-center rounded-full border border-red-300 text-[10px] font-semibold text-red-700 cursor-help"
                        title={video.error}
                        aria-label={video.error}
                      >
                        ?
                      </span>
                    ) : null}
                  </td>
                  <td className="w-px whitespace-nowrap p-4 align-middle [&amp;:has([role=checkbox])]:pr-0">
                    {video.status === 'failed' ? (
                      <button
                        className="text-xs rounded border border-primary px-2 py-1 text-primary disabled:opacity-50"
                        disabled={!!startingIds[video.id]}
                        onClick={() => startUploads([video.id])}
                      >
                        {startingIds[video.id] ? 'Retrying...' : 'Retry'}
                      </button>
                    ) : isManualSelectionMode && video.status === 'pending' ? (
                      <button
                        className="text-xs rounded border border-primary px-2 py-1 text-primary disabled:opacity-50"
                        disabled={!!startingIds[video.id]}
                        onClick={() => startUploads([video.id])}
                      >
                        {startingIds[video.id] ? 'Starting...' : 'Start upload'}
                      </button>
                    ) : (
                      <span className="text-slate-400 text-xs">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {filteredVideoIds.length === 0 ? (
              <tr>
                <td className="p-4 text-sm text-slate-500" colSpan={isManualSelectionMode ? 5 : 4}>
                  No videos match the current filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <button className="text-red-800 text-sm block mt-4" onClick={clearJob}>
        Clear job
      </button>
    </div>
  );
}
