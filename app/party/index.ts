import type * as Party from 'partykit/server';

import type { MigrationJob } from '@/utils/store';

export default class Server implements Party.Server {
  constructor(readonly room: Party.Room) {}

  job: MigrationJob | undefined;

  async onRequest(req: Party.Request) {
    if (req.method === 'POST') {
      const job = (await req.json()) as MigrationJob;
      this.job = { ...job, status: 'pending' };
    }

    if (req.method === 'PUT') {
      const payload = await req.json<{ id: string; type: string; data: any }>();
      // this.job.messages.push(payload.message);
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
