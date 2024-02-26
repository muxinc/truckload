import { serve } from 'inngest/next';

import { inngest } from '@/inngest/client';
import { fetchPage, fetchVideo, initiateMigration, processVideo, transferVideo } from '@/inngest/functions';

// Create an API that serves zero functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [initiateMigration, fetchPage, fetchVideo, processVideo, transferVideo],
});
