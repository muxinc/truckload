import { ListBucketsCommand, S3Client } from '@aws-sdk/client-s3';

export default async function ListBuckets() {
  const client = new S3Client({
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.S3_SECRET_ACCESS as string,
    },
    region: 'us-east-1',
  });

  const command = new ListBucketsCommand({});
  const response = await client.send(command);

  return (
    <div className="h-20">
      {response.Buckets?.map((bucket) => (
        <div>
          <h3>{bucket.Name}</h3>
          <p>{bucket.CreationDate?.toISOString()}</p>
        </div>
      ))}
    </div>
  );
}
