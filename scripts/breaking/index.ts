import { fetchAllSources } from "./sources";
import { matchKeywords } from "./matcher";
import { BreakingStore, hashUrl } from "./store";
import { pushNotification } from "./notify";
import type { BreakingItem, BreakingData } from "./types";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BREAKING_JSON = path.join(__dirname, "../../data/breaking.json");

async function main() {
  const store = new BreakingStore();
  const pushed: BreakingItem[] = [];

  try {
    // Pre-populate seen URLs from breaking.json (persists across Actions runs)
    const existing = loadBreakingJson();
    for (const item of existing.items) {
      store.markSeen(item.id, item.title, item.priority);
      if (item.pushedAt) store.markPushed(item.id);
    }
    console.log(`[${new Date().toISOString()}] Loaded ${existing.items.length} existing items, fetching sources...`);

    const articles = await fetchAllSources();
    console.log(`Fetched ${articles.length} articles`);

    for (const article of articles) {
      const urlHash = hashUrl(article.url);

      if (!store.isNew(urlHash)) continue;

      const match = matchKeywords(article.title);
      store.markSeen(urlHash, article.title, match.priority);

      if (!match.priority) continue;

      // P2: need multi-source confirmation
      if (match.priority === "P2") {
        const sourceCount = store.addP2Candidate(urlHash, article.title, article.source);
        if (sourceCount < 3) continue;
      }

      // Skip if same event already pushed recently
      if (store.isDuplicateEvent(article.title)) {
        console.log(`Skipped duplicate event: ${article.title}`);
        continue;
      }

      // Build item and push
      const item: BreakingItem = {
        id: urlHash,
        title: article.title,
        url: article.url,
        source: article.source,
        priority: match.priority,
        matchedKeywords: match.matched,
        firstSeen: new Date().toISOString(),
        pushedAt: new Date().toISOString(),
      };

      console.log(`[${match.priority}] ${article.title}`);
      const ok = await pushNotification(item);

      if (ok) {
        store.markPushed(urlHash);
        pushed.push(item);
      }
    }

    // Update breaking.json (merge with existing, keep last 24h)
    if (pushed.length > 0) {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const merged = [...pushed, ...existing.items.filter((i) => i.firstSeen > cutoff)];
      const data: BreakingData = { items: merged, updatedAt: new Date().toISOString() };
      fs.writeFileSync(BREAKING_JSON, JSON.stringify(data, null, 2));
      console.log(`Updated breaking.json with ${pushed.length} new items`);
    }

    store.cleanup();
    console.log("Done.");
  } finally {
    store.close();
  }
}

function loadBreakingJson(): BreakingData {
  try {
    return JSON.parse(fs.readFileSync(BREAKING_JSON, "utf-8"));
  } catch {
    return { items: [], updatedAt: new Date().toISOString() };
  }
}

main().catch(console.error);
