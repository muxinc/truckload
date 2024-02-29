import { inngest } from '@/inngest/client';
import { createJob } from '@/utils/job';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return new Response('Hello, World!', { status: 200 });
}

export async function POST(request: Request) {
  const body = await request.json();

  const job = await inngest.send({
    name: 'truckload/migration.init',
    data: {
      encrypted: body,
    },
  });

  const jobId = job.ids[0];

  await createJob(jobId);

  return new Response(JSON.stringify({ id: jobId }), { status: 201 });
}
