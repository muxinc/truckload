export interface ListVideosRoot {
  data: ApiVideoVideo[];
  pagination: Pagination;
}

export interface ApiVideoVideo {
  videoId: string;
  title: string;
  description: string;
  public: boolean;
  panoramic: boolean;
  mp4Support: boolean;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
  tags: any[];
  metadata: any[];
  source: Source;
  assets: Assets;
}

export interface Source {
  type: string;
  uri: string;
}

export interface Assets {
  iframe: string;
  player: string;
  hls: string;
  thumbnail: string;
  mp4: string;
}

export interface Pagination {
  currentPage: number;
  currentPageItems: number;
  pageSize: number;
  pagesTotal: number;
  itemsTotal: number;
  links: Link[];
}

export interface Link {
  rel: string;
  uri: string;
}
