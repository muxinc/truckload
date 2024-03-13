import { updateJobStatus } from '@/utils/job';
import type { MigrationStatus } from '@/utils/store';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = await request.json();

  if (body.type !== 'video.asset.ready') {
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  const assetId = body.data.id;
  const passthrough = body.data.passthrough;
  const meta = JSON.parse(passthrough);
  const jobId = meta.jobId;
  const sourceVideoId = meta.sourceVideoId;
  const status: MigrationStatus['status'] = body.data.status === 'ready' ? 'completed' : 'failed';

  await updateJobStatus(jobId, 'migration.video.progress', {
    video: {
      id: sourceVideoId,
      status,
      progress: 100,
    },
  });

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}
