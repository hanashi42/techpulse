import { fetchMultipleRSS, type RSSFeedConfig } from "./rss-utils";
import type { NewsItem } from "../types";

const FEEDS: RSSFeedConfig[] = [
  // The Star
  { url: "https://www.thestar.com.my/rss/news/nation", source: "thestar", defaultCategory: "malaysia", limit: 5 },
  { url: "https://www.thestar.com.my/rss/business/business", source: "thestar", defaultCategory: "money", limit: 5 },
  { url: "https://www.thestar.com.my/rss/news/world", source: "thestar", defaultCategory: "world", limit: 5 },

  // Malay Mail
  { url: "https://www.malaymail.com/feed/rss/malaysia", source: "malaymail", defaultCategory: "malaysia", limit: 5 },
  { url: "https://www.malaymail.com/feed/rss/money", source: "malaymail", defaultCategory: "money", limit: 5 },

  // Free Malaysia Today
  { url: "https://www.freemalaysiatoday.com/feed", source: "fmt", defaultCategory: "malaysia", limit: 5 },

  // Malaysiakini
  { url: "https://www.malaysiakini.com/rss/en/news", source: "malaysiakini", defaultCategory: "malaysia", limit: 5 },

  // Bernama (national news agency)
  { url: "https://www.bernama.com/en/rssfeed.php", source: "bernama", defaultCategory: "malaysia", limit: 5 },

  // Sin Chew Daily (Chinese) via Google News RSS
  { url: "https://news.google.com/rss/search?q=site:sinchew.com.my&hl=zh-MY&gl=MY&ceid=MY:zh-Hans", source: "sinchew", defaultCategory: "malaysia", limit: 5 },
];

export async function fetchMalaysiaNews(): Promise<NewsItem[]> {
  console.log("  Fetching Malaysia news (9 RSS feeds)...");
  const items = await fetchMultipleRSS(FEEDS);
  console.log(`  Malaysia news: ${items.length} items`);
  return items;
}
