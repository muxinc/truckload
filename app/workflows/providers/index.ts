import * as ApiVideo from './api-video/api-video';
import * as CloudflareStream from './cloudflare-stream/cloudflare-stream';
import * as Mux from './mux/mux';
import * as S3 from './s3/s3';
import * as Vimeo from './vimeo/vimeo';
import * as Wistia from './wistia/wistia';

const providerFns = {
  'api-video': ApiVideo,
  'cloudflare-stream': CloudflareStream,
  vimeo: Vimeo,
  wistia: Wistia,
  mux: Mux,
  s3: S3,
};

export default providerFns;
