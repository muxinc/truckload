import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';

import Mux from '@mux/mux-node';

import validateApiVideoCredentials from './api-video';

import type { PlatformCredentials } from '@/utils/store';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const data: PlatformCredentials = await request.json();

  switch (data.additionalMetadata?.platformId) {
    case 'api-video': {
      const result = await validateApiVideoCredentials(data);
      return result;
    }
    case 'cloudflare-stream':
      try {
        const response = await fetch('https://api.cloudflare.com/client/v4/user/tokens/verify', {
          headers: {
            Authorization: `Bearer ${data.secretKey}`,
            'Content-Type': 'application/json',
          },
        });

        const result = await response.json();
        if (result.success) {
          return new Response('ok', { status: 200 });
        } else {
          return Response.json({ error: 'Invalid credentials' }, { status: 401 });
        }
      } catch (error) {
        console.error('Error:', error); // Catching and logging any errors
        return Response.json({ error: 'Invalid credentials' }, { status: 401 });
      }
    case 's3':
      const client = new S3Client({
        credentials: {
          accessKeyId: data.publicKey,
          secretAccessKey: data.secretKey!,
        },
        region: data.additionalMetadata.region,
      });

      const input = {
        Bucket: data.additionalMetadata.bucket,
      };

      const command = new HeadBucketCommand(input);

      try {
        await client.send(command);
        return new Response('ok', { status: 200 });
      } catch (error) {
        console.error(error);
        return Response.json({ error: 'Invalid credentials' }, { status: 401 });
      }
    case 'mux':
      const mux = new Mux({
        tokenId: data.publicKey as string,
        tokenSecret: data.secretKey as string,
      });

      try {
        await mux.video.assets.list();
        return new Response('ok', { status: 200 });
      } catch (error) {
        return Response.json({ error: 'Invalid credentials' }, { status: 401 });
      }
    default:
      return Response.json({ error: 'Invalid platform provided' }, { status: 404 });
  }
}
