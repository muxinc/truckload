'use client';

import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';

import Image from 'next/image';

// import { GetObjectCommand, ListBucketsCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
// import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import PlatformCredentialsForm from './components/platforms/credentials-form';
import PlatformList from './components/platforms/platform-list';
import VideoFilter from './components/platforms/video-filter';
import ImportSettings from './components/shared/import-settings';
import MigrationStatus from './components/shared/migration-status';
import Review from './components/shared/review';
import Sidebar from './components/sidebar';
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
  const job = useMigrationStore((state) => state.job);
  const currentStep = useMigrationStore((state) => state.currentStep);

  // determine what the current step should be on initial load
  useEffect(() => {
    if (!sourcePlatform) {
      useMigrationStore.setState({ currentStep: 'select-source' });
    } else if (!sourcePlatform?.credentials) {
      useMigrationStore.setState({ currentStep: 'set-source-credentials' });
    } else if (sourcePlatform?.credentials && !useMigrationStore.getState().assetFilter) {
      useMigrationStore.setState({ currentStep: 'set-video-filter' });
    } else if (!destinationPlatform) {
      useMigrationStore.setState({ currentStep: 'select-destination' });
    } else if (!destinationPlatform?.credentials) {
      useMigrationStore.setState({ currentStep: 'set-destination-credentials' });
    } else if (destinationPlatform?.credentials && !destinationPlatform?.config) {
      useMigrationStore.setState({ currentStep: 'set-import-settings' });
    } else if (!job) {
      useMigrationStore.setState({ currentStep: 'review' });
    } else {
      useMigrationStore.setState({ currentStep: 'migration-status' });
    }
  }, [sourcePlatform, destinationPlatform, job]);

  return (
    <>
      <div className="border-b-8 border-double mb-8 border-primary">
        <Image src="/in-n-out-video.png" alt="In-n-out Video" width={200} height={100} className="mb-4" />
      </div>

      <div className="grid grid-cols-2 gap-10" style={{ gridTemplateColumns: `320px 1fr` }}>
        <Sidebar />

        <div>
          {currentStep === 'select-source' && <PlatformList type="source" />}
          {currentStep === 'set-source-credentials' && sourcePlatform && <PlatformCredentialsForm />}
          {currentStep === 'set-video-filter' && <VideoFilter />}
          {currentStep === 'select-destination' && <PlatformList type="destination" />}
          {currentStep === 'set-destination-credentials' && destinationPlatform && <PlatformCredentialsForm />}
          {currentStep === 'set-import-settings' && <ImportSettings />}
          {currentStep === 'review' && <Review />}
          {currentStep === 'migration-status' && <MigrationStatus />}
        </div>
      </div>

      <div
        className="flex justify-end absolute right-0 bottom-0 left-0 bg-repeat-x bg-contain h-12"
        style={{ backgroundImage: 'url(/tree.png)' }}
      ></div>

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
