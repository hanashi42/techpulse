import { categorize } from "../categorize";
import type { NewsItem } from "../types";

const HN_TOP_URL = "https://hacker-news.firebaseio.com/v0/topstories.json";
const HN_ITEM_URL = "https://hacker-news.firebaseio.com/v0/item";

interface HNItem {
  id: number;
  title: string;
  url?: string;
  score: number;
  descendants?: number;
  type: string;
}

export async function fetchHackerNews(minScore = 50, limit = 20): Promise<NewsItem[]> {
  const res = await fetch(HN_TOP_URL);
  const ids: number[] = await res.json();

  // Fetch top 60 items in parallel, then filter by score
  const top = ids.slice(0, 60);
  const items = await Promise.all(
    top.map(async (id): Promise<HNItem | null> => {
      try {
        const r = await fetch(`${HN_ITEM_URL}/${id}.json`);
        return await r.json();
      } catch {
        return null;
      }
    })
  );

  const now = new Date().toISOString();

  return items
    .filter((item): item is HNItem => item !== null && item.type === "story" && item.score >= minScore)
    .slice(0, limit)
    .map((item) => ({
      id: `hn-${item.id}`,
      source: "hackernews" as const,
      title: item.title,
      url: item.url ?? `https://news.ycombinator.com/item?id=${item.id}`,
      score: item.score,
      comments: item.descendants ?? 0,
      commentsUrl: `https://news.ycombinator.com/item?id=${item.id}`,
      category: categorize(item.title, undefined, "tech"),
      fetchedAt: now,
    }));
}
