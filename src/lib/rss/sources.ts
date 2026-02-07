import type { RSSSource } from "@/types/rss";

export const RSS_SOURCES: RSSSource[] = [
  {
    name: "Formula 1",
    url: "https://www.formula1.com/en/latest/all.xml",
    key: "formula1",
  },
  {
    name: "Autosport",
    url: "https://www.autosport.com/rss/feed/f1",
    key: "autosport",
  },
  {
    name: "Motorsport.com",
    url: "https://www.motorsport.com/rss/f1/news/",
    key: "motorsport",
  },
  {
    name: "The Race",
    url: "https://the-race.com/feed/",
    key: "therace",
  },
  {
    name: "RaceFans",
    url: "https://www.racefans.net/feed/",
    key: "racefans",
  },
];
