import Image from 'next/image';

import { GetObjectCommand, ListBucketsCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { sriracha } from '@/_fonts';

import SourcePlatformCredentialsForm from './components/platforms/credentials-form';
import DestinationPlatformList from './components/platforms/destination-platform-list';
import ListBuckets from './components/platforms/s3/list-buckets';
import SourcePlatformList from './components/platforms/source-platform-list';
import SourcePlatformProvider from './context/source-platform';

const client = new S3Client({
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.S3_SECRET_ACCESS as string,
  },
  region: 'us-east-1',
});

export default async function Page() {
  const listObjects = new ListObjectsV2Command({ Bucket: 'dk-videos-bucket' });
  const r2 = await client.send(listObjects);

  const object = new GetObjectCommand({ Bucket: 'dk-videos-bucket', Key: 'hackweek-mux-video-ad-final.mp4' });
  const url = await getSignedUrl(client, object, { expiresIn: 3600 });

  return (
    <SourcePlatformProvider>
      <div className="border-b-8 border-double mb-8 border-primary">
        <Image src="/in-n-out-video.png" alt="In-n-out Video" width={200} height={100} className="mb-4" />
      </div>

      {/* <h1 className={`text-primary font-bold text-3xl uppercase`}>In-n-out Video</h1> */}

      <div className="grid grid-cols-2">
        <div>
          <SourcePlatformList />
          <SourcePlatformCredentialsForm />
        </div>

        <div>
          <DestinationPlatformList />
          <SourcePlatformCredentialsForm />
        </div>
      </div>

      <div className="flex justify-end absolute right-0 bottom-0">
        <button className="text-2xl bg-primary text-white py-2 px-5 font-semibold">Place order</button>
      </div>

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
    </SourcePlatformProvider>
  );
}
