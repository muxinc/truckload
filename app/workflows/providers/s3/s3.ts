import { GetObjectCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import type { PlatformCredentials, Video } from '@/utils/store';

export async function fetchPage(credentials: PlatformCredentials) {
  const client = new S3Client({
    credentials: {
      accessKeyId: credentials.publicKey,
      secretAccessKey: credentials.secretKey!,
    },
    region: credentials.additionalMetadata!.region,
  });

  const listObjects = new ListObjectsV2Command({ Bucket: credentials.additionalMetadata!.bucket });
  const results = await client.send(listObjects);

  const isTruncated = results.IsTruncated;
  const cursor = results.NextContinuationToken;
  const videos =
    results.Contents?.map((object) => ({ id: object.Key })).filter(
      (item): item is Video => !!item.id && /\.(mp4|mov|mp3)$/i.test(item.id)
    ) || [];

  return { isTruncated, cursor, videos };
}

export async function fetchVideo(credentials: PlatformCredentials, video: Video) {
  const client = new S3Client({
    credentials: {
      accessKeyId: credentials.publicKey,
      secretAccessKey: credentials.secretKey!,
    },
    region: credentials.additionalMetadata!.region,
  });

  const object = new GetObjectCommand({
    Bucket: credentials.additionalMetadata!.bucket,
    Key: video.id,
  });

  const url = await getSignedUrl(client, object, { expiresIn: 3600 });
  return { id: video.id, url };
}
