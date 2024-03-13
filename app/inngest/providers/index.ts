import * as CloudflareStream from './cloudflare-stream/cloudflare-stream';
import * as S3 from './s3/s3';

const providers = {
  'cloudflare-stream': CloudflareStream,
  s3: S3,
};

export default providers;
