import { start } from 'workflow/api';

import { createJob } from '@/utils/job';
import type { DestinationPlatform, SourcePlatform, Video } from '@/utils/store';
import { initiateMigration, processVideo, refreshVideoList } from '@/workflows/migration';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return new Response('Hello, World!', { status: 200 });
}

export async function POST(request: Request) {
  const body = await request.json();

  const run = await start(initiateMigration, [body]);
  const jobId = run.runId;

  await createJob(jobId);

  return new Response(JSON.stringify({ id: jobId }), { status: 201 });
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as {
    action?: 'refresh-videos';
    jobId?: string;
    sourcePlatform?: SourcePlatform;
    destinationPlatform?: DestinationPlatform;
    videos?: Video[];
  };

  if (body.action === 'refresh-videos') {
    if (!body.jobId || !body.sourcePlatform) {
      return Response.json({ error: 'jobId and sourcePlatform are required to refresh videos' }, { status: 400 });
    }

    const run = await start(refreshVideoList, [body.jobId, body.sourcePlatform]);
    return Response.json({ refreshStarted: true, runId: run.runId }, { status: 202 });
  }

  if (!body.jobId || !body.sourcePlatform || !body.destinationPlatform || !body.videos?.length) {
    return Response.json(
      { error: 'jobId, sourcePlatform, destinationPlatform, and videos are required' },
      { status: 400 }
    );
  }

  const runIds: string[] = [];
  for (const video of body.videos) {
    const run = await start(processVideo, [body.jobId, body.sourcePlatform, body.destinationPlatform, video]);
    runIds.push(run.runId);
  }

  return Response.json({ started: runIds.length, runIds }, { status: 200 });
}
