import { start } from 'workflow/api';

import { createJob } from '@/utils/job';
import { initiateMigration } from '@/workflows/migration';

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
