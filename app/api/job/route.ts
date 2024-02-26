import { inngest } from '@/inngest/client';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return new Response('Hello, World!', { status: 200 });
}

export async function POST(request: Request) {
  const body = await request.json();

  const job = await inngest.send({
    name: 'in-n-out/migration.init',
    data: {
      encrypted: body,
    },
  });

  const jobId = job.ids[0];

  return new Response(JSON.stringify({ id: jobId }), { status: 201 });
}
