import { fetchMultipleRSS, type RSSFeedConfig } from "./rss-utils";
import type { NewsItem } from "../types";

const FEEDS: RSSFeedConfig[] = [
  { url: "https://soyacincau.com/feed/", source: "soyacincau", defaultCategory: "forme", limit: 5 },
  { url: "https://www.imoney.my/articles/feed", source: "imoney", defaultCategory: "forme", limit: 5 },
  { url: "https://vulcanpost.com/feed/", source: "vulcanpost", defaultCategory: "forme", limit: 5 },
  { url: "https://ringgitplus.com/en/blog/feed/", source: "ringgitplus", defaultCategory: "forme", limit: 5 },
  { url: "https://www.everydayonsales.com/feed/", source: "everydayonsales", defaultCategory: "forme", limit: 5 },
  { url: "https://mypromo.my/feed/", source: "mypromo", defaultCategory: "forme", limit: 5 },
  { url: "https://fintechnews.my/category/blockchain/feed/", source: "fintechmy", defaultCategory: "forme", limit: 5 },
];

export async function fetchForMe(): Promise<NewsItem[]> {
  console.log("  Fetching For Me sources (7 RSS feeds)...");
  const items = await fetchMultipleRSS(FEEDS);
  console.log(`  For Me: ${items.length} items`);
  return items;
}
