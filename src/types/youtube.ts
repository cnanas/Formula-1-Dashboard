export interface YoutubeVideo {
  videoId: string;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt: string;
  thumbnailUrl: string;
  channelId: string;
  channelTitle: string;
  url: string;
}

export interface YoutubeFeed {
  channelId: string;
  channelTitle: string;
  items: YoutubeVideo[];
  lastFetched: string;
}
