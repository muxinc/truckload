import { serve } from 'inngest/next';

import { inngest } from '@/inngest/client';
import { initiateMigration, processVideo } from '@/inngest/functions';
import providerFns from '@/inngest/providers';

// pull all of the exports out of the providerFns object and create an array of them
const allProviderFns = Object.values(providerFns).reduce((acc, provider) => {
  const providerFns = Object.values(provider);
  return [...acc, ...providerFns];
}, [] as any[]);

// Create an API that serves zero functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [initiateMigration, processVideo, ...allProviderFns],
});
