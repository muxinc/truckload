export interface CloudflareVideo {
  uid: string;
  creator: any;
  thumbnail: string;
  thumbnailTimestampPct: number;
  readyToStream: boolean;
  readyToStreamAt: string;
  status: Status;
  meta: Meta;
  created: string;
  modified: string;
  scheduledDeletion: any;
  size: number;
  preview: string;
  allowedOrigins: any[];
  requireSignedURLs: boolean;
  uploaded: string;
  uploadExpiry: any;
  maxSizeBytes: any;
  maxDurationSeconds: any;
  duration: number;
  input: Input;
  playback: Playback;
  watermark: any;
  liveInput: string;
  clippedFrom: any;
  publicDetails: PublicDetails;
}

export interface Status {
  state: string;
  pctComplete: string;
  errorReasonCode: string;
  errorReasonText: string;
}

export interface Meta {
  name: string;
}

export interface Input {
  width: number;
  height: number;
}

export interface Playback {
  hls: string;
  dash: string;
}

export interface PublicDetails {
  title: string;
  share_link: string;
  channel_link: string;
  logo: string;
}
