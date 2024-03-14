import * as CloudflareStream from './cloudflare-stream/cloudflare-stream';
import * as Mux from './mux/mux';
import * as S3 from './s3/s3';

const providerFns = {
  'cloudflare-stream': CloudflareStream,
  mux: Mux,
  s3: S3,
};

export default providerFns;
