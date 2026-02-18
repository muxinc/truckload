type AssetType =
  | 'OriginalFile'
  | 'IphoneVideoFile'
  | 'Mp4VideoFile'
  | 'MdMp4VideoFile'
  | 'HdMp4VideoFile'
  | 'StreamCopyMp4AudioFile'
  | 'StillImageFile'
  | 'StoryboardFile';

export interface Thumbnail {
  url: string;
  width: number;
  height: number;
}

export interface Asset {
  width: number;
  height: number;
  type: AssetType;
  file_size: number;
  content_type: string;
  url: string;
}

export interface Folder {
  id: number;
  hashed_id: string;
  name: string;
}

interface Tag {
  name: string;
}

export interface WistiaMedia {
  id: number;
  hashed_id: string;
  progress: number;
  type: 'Video' | 'Audio' | 'Document' | 'Image';
  archived: boolean;
  name: string;
  duration: number;
  created: string;
  updated: string;
  description: string;
  protected: boolean | null;
  status: 'queued' | 'processing' | 'ready' | 'failed';
  thumbnail: Thumbnail;
  section: string | null;
  tags: Tag[];
  assets: Asset[];
  folder: Folder;
}

export type WistiaMediaList = WistiaMedia[];
