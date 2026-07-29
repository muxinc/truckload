import type * as Party from 'partykit/server';

import type { MigrationJob } from '@/utils/store';

export default class Server implements Party.Server {
  constructor(readonly room: Party.Room) {}

  job: MigrationJob | undefined;

  private recomputeJobStatus() {
    if (!this.job) return;

    const statuses = Object.values(this.job.videos || {}).map((video) => video.status);
    if (statuses.length === 0) {
      this.job.status = 'pending';
      return;
    }

    if (statuses.some((status) => status === 'in-progress' || status === 'retrying')) {
      this.job.status = 'in-progress';
      return;
    }

    if (statuses.every((status) => status === 'completed')) {
      this.job.status = 'completed';
      return;
    }

    if (statuses.every((status) => status === 'completed' || status === 'failed')) {
      this.job.status = statuses.some((status) => status === 'failed') ? 'failed' : 'completed';
      return;
    }

    this.job.status = 'pending';
  }

  async onRequest(req: Party.Request) {
    if (req.method === 'POST') {
      const job = (await req.json()) as Partial<MigrationJob>;
      this.job = {
        id: job.id || this.room.id,
        status: 'pending',
        progress: 0,
        videos: job.videos || {},
        halted: false,
      };
      return new Response('OK');
    }

    if (req.method === 'PUT') {
      const payload = await req.json<{ id: string; type: string; data: any }>();
      if (!this.job) {
        this.job = { id: payload.id || this.room.id, status: 'pending', progress: 0, videos: {}, halted: false };
      }

      if (payload.type === 'migration.videos.fetched') {
        const incomingVideos = payload.data.videos || {};

        // Keep existing statuses/progress for known videos and add newly discovered videos as pending.
        this.job.videos = {
          ...incomingVideos,
          ...this.job.videos,
        };
        this.recomputeJobStatus();
      }

      if (payload.type === 'migration.video.progress') {
        const video = payload.data?.video;
        if (video?.id) {
          this.job.videos[video.id] = { ...this.job.videos[video.id], ...video };
          this.recomputeJobStatus();
        }
      }

      if (payload.type === 'migration.job.halted') {
        this.job.halted = true;
        this.job.haltReason = payload.data?.reason || 'Migration halted due to an upstream error.';
        this.job.status = 'failed';
      }

      this.room.broadcast(JSON.stringify(payload));
      return new Response('OK');
    }

    if (this.job) {
      return new Response(JSON.stringify(this.job), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not found', { status: 404 });
  }
}

Server satisfies Party.Worker;
