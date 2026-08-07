import { start } from 'workflow/api';

import { createJob } from '@/utils/job';
import type { DestinationPlatform, SourcePlatform, Video } from '@/utils/store';
import { initiateMigration, processVideo, refreshVideoList } from '@/workflows/migration';

export const dynamic = 'force-dynamic';

async function fetchPartyKitJob(jobId: string): Promise<Response> {
  const partyKitUrl = process.env.NEXT_PUBLIC_PARTYKIT_URL;
  if (!partyKitUrl) {
    throw new Error('NEXT_PUBLIC_PARTYKIT_URL is not configured');
  }

  return fetch(`${partyKitUrl}/party/${jobId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function GET(request: Request) {
  return new Response('Hello, World!', { status: 200 });
}

export async function POST(request: Request) {
  const body = await request.json();

  const run = await start(initiateMigration, [body]);
  const jobId = run.runId;

  try {
    await createJob(jobId);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to initialize migration job';
    return Response.json({ error: message }, { status: 503 });
  }

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

  try {
    const partyKitResponse = await fetchPartyKitJob(body.jobId);
    if (partyKitResponse.status === 404) {
      return Response.json(
        { error: 'Migration job was not found. Restart PartyKit and create a new migration job.' },
        { status: 409 }
      );
    }

    if (!partyKitResponse.ok) {
      return Response.json(
        { error: `PartyKit returned ${partyKitResponse.status}. Start PartyKit and retry.` },
        { status: 503 }
      );
    }
  } catch {
    return Response.json({ error: 'PartyKit is unavailable. Start PartyKit and retry.' }, { status: 503 });
  }

  const runIds: string[] = [];
  for (const video of body.videos) {
    const run = await start(processVideo, [body.jobId, body.sourcePlatform, body.destinationPlatform, video]);
    runIds.push(run.runId);
  }

  return Response.json({ started: runIds.length, runIds }, { status: 200 });
}
