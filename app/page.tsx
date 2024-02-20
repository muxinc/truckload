'use client';

import { Toaster } from 'react-hot-toast';

import Image from 'next/image';

// import { GetObjectCommand, ListBucketsCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
// import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import PlatformCredentialsForm from './components/platforms/credentials-form';
import PlatformList from './components/platforms/platform-list';
import useMigrationStore from './utils/store';

// const client = new S3Client({
//   credentials: {
//     accessKeyId: process.env.S3_ACCESS_KEY_ID as string,
//     secretAccessKey: process.env.S3_SECRET_ACCESS as string,
//   },
//   region: 'us-east-1',
// });

export default function Page() {
  // const listObjects = new ListObjectsV2Command({ Bucket: 'dk-videos-bucket' });
  // const r2 = await client.send(listObjects);

  // const object = new GetObjectCommand({ Bucket: 'dk-videos-bucket', Key: 'hackweek-mux-video-ad-final.mp4' });
  // const url = await getSignedUrl(client, object, { expiresIn: 3600 });

  const sourcePlatform = useMigrationStore((state) => state.sourcePlatform);
  const destinationPlatform = useMigrationStore((state) => state.destinationPlatform);

  return (
    <>
      <div className="border-b-8 border-double mb-8 border-primary">
        <Image src="/in-n-out-video.png" alt="In-n-out Video" width={200} height={100} className="mb-4" />
      </div>

      <div className="grid grid-cols-2">
        <div>
          <PlatformList type="source" />
          {sourcePlatform && <PlatformCredentialsForm platformId={sourcePlatform.id} />}
        </div>

        <div>
          <PlatformList type="destination" />
          {destinationPlatform && <PlatformCredentialsForm platformId={destinationPlatform.id} />}
        </div>
      </div>

      <div
        className="flex justify-end absolute right-0 bottom-0 left-0 bg-repeat-x bg-contain"
        style={{ backgroundImage: 'url(/tree.png)' }}
      >
        <button className="text-2xl bg-primary text-white py-2 px-5 font-semibold">Place order</button>
      </div>

      <Toaster />

      {/* <p>Select a bucket</p>
      <ListBuckets />

      <h2>Objects</h2>
      {r2.KeyCount} result
      {r2.IsTruncated ? "Truncated" : "Not Truncated"}

      {r2.Contents?.map((object) => (
        <>
          <h3>{object.Key}</h3>
          <p>{object.Size}</p>
        </>
      ))} */}
    </>
  );
}
