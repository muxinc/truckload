import { ListBucketsCommand, S3Client } from '@aws-sdk/client-s3';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const { data } = await request.json();

  switch (data.platformId) {
    case 's3':
      const client = new S3Client({
        credentials: {
          accessKeyId: data.publicKey as string,
          secretAccessKey: data.secretKey as string,
        },
        region: data.region,
      });

      const command = new ListBucketsCommand({});

      try {
        await client.send(command);
        return new Response('ok', { status: 200 });
      } catch (error) {
        console.error(error);
        return Response.json({ error: 'Invalid credentials' }, { status: 401 });
      }
    case 'mux':
      // Do something with Mux
      return Response.json({ error: 'This provider is not yet supported' }, { status: 501 });
    default:
      return Response.json({ error: 'Invalid platform provided' }, { status: 404 });
  }
}
