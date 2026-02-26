import { fetchMultipleRSS, type RSSFeedConfig } from "./rss-utils";
import type { NewsItem } from "../types";

const FEEDS: RSSFeedConfig[] = [
  { url: "https://feeds.bbci.co.uk/news/world/rss.xml", source: "bbc", defaultCategory: "world", limit: 5 },
  { url: "https://feeds.bbci.co.uk/news/world/asia/rss.xml", source: "bbc", defaultCategory: "world", limit: 5 },
  { url: "https://www.scmp.com/rss/5/feed", source: "scmp", defaultCategory: "world", limit: 5 },
];

export async function fetchWorldNews(): Promise<NewsItem[]> {
  console.log("  Fetching world news (3 RSS feeds)...");
  const items = await fetchMultipleRSS(FEEDS);

  // Deduplicate BBC overlap (world feed may include asia items)
  const seen = new Set<string>();
  const deduped = items.filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });

  console.log(`  World news: ${deduped.length} items`);
  return deduped;
}
