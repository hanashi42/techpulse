import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { fetchHackerNews } from "../src/lib/sources/hackernews";
import { fetchGitHubTrending } from "../src/lib/sources/github";
import { fetchReddit } from "../src/lib/sources/reddit";
import { fetchProductHunt } from "../src/lib/sources/producthunt";
import { fetchMalaysiaNews } from "../src/lib/sources/malaysia-news";
import { fetchMalaysiaReddit } from "../src/lib/sources/malaysia-reddit";
import { fetchWorldNews } from "../src/lib/sources/world-news";
import { fetchFinance } from "../src/lib/sources/finance";
import type { DailyData, NewsItem } from "../src/lib/types";

async function main() {
  const date = new Date().toISOString().split("T")[0];
  console.log(`Fetching news for ${date}...`);

  const results = await Promise.allSettled([
    fetchHackerNews().then((items) => {
      console.log(`  HN: ${items.length} items`);
      return items;
    }),
    fetchGitHubTrending().then((items) => {
      console.log(`  GitHub: ${items.length} items`);
      return items;
    }),
    fetchReddit().then((items) => {
      console.log(`  Reddit (tech): ${items.length} items`);
      return items;
    }),
    fetchProductHunt().then((items) => {
      console.log(`  PH: ${items.length} items`);
      return items;
    }),
    fetchMalaysiaNews(),
    fetchMalaysiaReddit().then((items) => {
      console.log(`  Reddit (MY): ${items.length} items`);
      return items;
    }),
    fetchWorldNews(),
    fetchFinance(),
  ]);

  const items: NewsItem[] = results.flatMap((r) =>
    r.status === "fulfilled" ? r.value : []
  );

  // Log any failures
  const names = ["HN", "GitHub", "Reddit", "PH", "MY News", "MY Reddit", "World", "Finance"];
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      console.error(`  ${names[i]} FAILED:`, r.reason);
    }
  });

  // Merge with existing data (preserves items from sources that failed this run)
  const dataDir = join(process.cwd(), "data");
  mkdirSync(dataDir, { recursive: true });
  const filePath = join(dataDir, `${date}.json`);

  if (existsSync(filePath)) {
    try {
      const existing: DailyData = JSON.parse(readFileSync(filePath, "utf-8"));
      // Keep old items whose source didn't return anything new
      const newSources = new Set(items.map((i) => i.source));
      const kept = existing.items.filter((i) => !newSources.has(i.source));
      items.push(...kept);
      console.log(`  Merged ${kept.length} existing items from sources that returned 0`);
    } catch {}
  }

  // Deduplicate by URL
  const seen = new Set<string>();
  const deduped = items.filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });

  // Sort by score descending
  deduped.sort((a, b) => b.score - a.score);

  const data: DailyData = { date, items: deduped };
  writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`\nWrote ${deduped.length} items to ${filePath}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
