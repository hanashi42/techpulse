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
import { fetchForMe } from "../src/lib/sources/forme";
import type { DailyData, NewsItem, ReminderItem } from "../src/lib/types";
import { summarizeAll, generateBriefing } from "./summarize";

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
    fetchForMe(),
  ]);

  const items: NewsItem[] = results.flatMap((r) =>
    r.status === "fulfilled" ? r.value : []
  );

  // Log any failures
  const names = ["HN", "GitHub", "Reddit", "PH", "MY News", "MY Reddit", "World", "Finance", "For Me"];
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

  // Load active reminders from static JSON
  try {
    const remindersPath = join(process.cwd(), "data", "reminders.json");
    if (existsSync(remindersPath)) {
      const allReminders: ReminderItem[] = JSON.parse(readFileSync(remindersPath, "utf-8"));
      const today = new Date(date + "T00:00:00Z");
      const activeReminders = allReminders.filter((r) => {
        const deadline = new Date(r.date + "T00:00:00Z");
        const alertStart = new Date(deadline.getTime() - r.daysBeforeAlert * 86400000);
        return today >= alertStart && today <= deadline;
      });

      // Convert active reminders to NewsItems (pinned at top with high score)
      for (const r of activeReminders) {
        const daysLeft = Math.ceil(
          (new Date(r.date + "T00:00:00Z").getTime() - today.getTime()) / 86400000
        );
        items.push({
          id: `reminder-${r.id}`,
          source: "reminder",
          title: r.title,
          url: r.url || "",
          score: 100,
          category: "forme",
          description: `${r.description}${daysLeft > 0 ? ` (还有${daysLeft}天)` : " (今天)"}`,
          fetchedAt: new Date().toISOString(),
        });
      }

      if (activeReminders.length > 0) {
        console.log(`  Reminders: ${activeReminders.length} active`);
      }
    }
  } catch (err) {
    console.error("  Reminders loading failed (non-fatal):", err);
  }

  // Deduplicate by URL (skip empty URLs from reminders)
  const seen = new Set<string>();
  const deduped = items.filter((item) => {
    if (!item.url) return true;
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });

  // Sort by score descending
  deduped.sort((a, b) => b.score - a.score);

  // AI summaries (non-fatal)
  let briefing: string | undefined;
  let categoryBriefings: DailyData["categoryBriefings"];
  try {
    const [summaryMap, briefingResult] = await Promise.all([
      summarizeAll(deduped),
      generateBriefing(deduped),
    ]);
    for (const item of deduped) {
      const s = summaryMap.get(item.id);
      if (s) item.summary = s;
    }
    briefing = briefingResult.overall;
    if (Object.keys(briefingResult.perCategory).length > 0) {
      categoryBriefings = briefingResult.perCategory;
    }
  } catch (err) {
    console.error("  AI summaries failed (non-fatal):", err);
  }

  const data: DailyData = { date, briefing, categoryBriefings, items: deduped };
  writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`\nWrote ${deduped.length} items to ${filePath}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
