export interface RSSItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
  imageUrl?: string;
}

export interface RSSFeed {
  items: RSSItem[];
  lastFetched: string;
}

export interface RSSSource {
  name: string;
  url: string;
  key: string;
}
