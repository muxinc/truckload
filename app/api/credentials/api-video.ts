import { PRODUCTION_ENDPOINT, SANDBOX_ENDPOINT } from '@/inngest/providers/api-video/api-video';
import type { PlatformCredentials } from '@/utils/store';

export default async function validate(data: PlatformCredentials) {
  const endpoint = data.additionalMetadata?.environment === 'sandbox' ? SANDBOX_ENDPOINT : PRODUCTION_ENDPOINT;

  try {
    const response = await fetch(`${endpoint}/videos`, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${btoa(data.secretKey as string)}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    if (result.data) {
      return new Response('ok', { status: 200 });
    } else {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }
  } catch (error) {
    console.error('Error:', error); // Catching and logging any errors
    return Response.json({ error: 'Invalid credentials' }, { status: 401 });
  }
}
