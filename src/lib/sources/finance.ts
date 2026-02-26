import { fetchMultipleRSS, type RSSFeedConfig } from "./rss-utils";
import type { NewsItem } from "../types";

const FEEDS: RSSFeedConfig[] = [
  { url: "https://www.mrstingy.com/feed/", source: "mrstingy", defaultCategory: "money", limit: 5 },
  { url: "https://ringgitohringgit.com/feed/", source: "ringgitoh", defaultCategory: "money", limit: 5 },
];

export async function fetchFinance(): Promise<NewsItem[]> {
  console.log("  Fetching finance blogs (2 RSS feeds)...");
  const items = await fetchMultipleRSS(FEEDS);
  console.log(`  Finance: ${items.length} items`);
  return items;
}
