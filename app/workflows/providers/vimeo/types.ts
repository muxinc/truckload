export interface ListVideosRoot {
  total: number;
  page: number;
  per_page: number;
  paging: {
    next: string | null;
    previous: string | null;
    first: string;
    last: string;
  };
  data: VimeoVideo[];
}

export type VideoStatus =
  | 'available'
  | 'failed'
  | 'processing'
  | 'quota_exceeded'
  | 'total_cap_exceeded'
  | 'transcode_starting'
  | 'transcoding'
  | 'transcoding_error'
  | 'unavailable'
  | 'uploading'
  | 'uploading_error';

export interface VimeoVideo {
  uri: string;
  name: string;
  description: string | null;
  type: string;
  link: string;
  duration: number;
  width: number;
  language: string;
  height: number;
  created_time: string;
  modified_time: string;
  release_time: string;
  content_rating: string[];
  license: string | null;
  status: VideoStatus;
  privacy: {
    view: string;
    embed: string;
    download: boolean;
    add: boolean;
    comments: string;
  };
  pictures: {
    uri: string;
    active: boolean;
    type: string;
    base_link: string;
    sizes: {
      width: number;
      height: number;
      link: string;
      link_with_play_button: string;
    }[];
    resource_key: string;
    default_picture: boolean;
  };
  stats: {
    plays: number | null;
  };
  metadata: {
    connections: {
      comments: {
        uri: string;
        total: number;
      };
      likes: {
        uri: string;
        total: number;
      };
      pictures: {
        uri: string;
        total: number;
      };
      texttracks: {
        uri: string;
        total: number;
      };
    };
  };
  user: {
    uri: string;
    name: string;
    link: string;
    location: string | null;
    pictures: {
      uri: string;
      active: boolean;
      type: string;
      base_link: string;
      sizes: {
        width: number;
        height: number;
        link: string;
        link_with_play_button?: string;
      }[];
      resource_key: string;
      default_picture: boolean;
    };
    account: string;
  };
  download?: {
    quality: string;
    type: string;
    width: number;
    height: number;
    expires: string;
    link: string;
    rendition: string;
    created_time: string;
  }[];
  files?: {
    quality: string;
    type: string;
    width: number;
    height: number;
    link: string;
    size: number;
    created_time: string;
    fps?: number;
  }[];
}
