# Breaking News Alerts Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Push breaking world news to hanashi's phone via ntfy within 2-8 minutes of first reports.

**Architecture:** Node.js script on Hetzner VPS, cron every 5 min. Fetches wire service RSS + Reddit rising, filters through P0/P1/P2 keyword system, deduplicates against SQLite, pushes via ntfy.sh, commits breaking.json to git for Polaris web UI.

**Tech Stack:** Node.js 20, TypeScript, fast-xml-parser (existing), better-sqlite3, ntfy.sh REST API, cron

---

### Task 1: Project scaffolding for breaking module

**Files:**
- Create: `scripts/breaking/keywords.ts`
- Create: `scripts/breaking/types.ts`

**Step 1: Create types**

```typescript
// scripts/breaking/types.ts

export type Priority = "P0" | "P1" | "P2";

export interface BreakingItem {
  id: string; // sha256 hash of url
  title: string;
  url: string;
  source: string;
  priority: Priority;
  matchedKeywords: string[];
  firstSeen: string; // ISO timestamp
  pushedAt?: string; // ISO timestamp, set when ntfy push sent
}

export interface BreakingData {
  items: BreakingItem[];
  updatedAt: string;
}

export interface SeenRow {
  url_hash: string;
  title: string;
  priority: string;
  pushed_at: string;
  created_at: string;
}
```

**Step 2: Create keyword lists**

```typescript
// scripts/breaking/keywords.ts

// P0: any single match -> immediate push
export const P0_KEYWORDS: string[] = [
  // War and military
  "declares war", "declaration of war", "nuclear strike", "nuclear attack",
  "nuclear launch", "invades ", "invasion of", "bombs ", "bombing of",
  "airstrikes on", "air strikes on", "missile strike", "missiles launched",
  "ground offensive", "troops enter", "shots fired at",
  "opens fire on",

  // Peace / diplomacy
  "ceasefire declared", "ceasefire agreement", "peace deal signed",
  "surrender", "unconditional surrender", "capitulates",
  "war ends", "conflict ends", "truce declared",
  "peace treaty", "armistice signed",

  // WMD / nuclear
  "nuclear detonation", "nuclear test", "mushroom cloud",
  "chemical attack", "chemical weapons", "biological attack",
  "dirty bomb", "radiation leak", "meltdown at",

  // Political crisis
  "coup d'etat", "coup attempt", "military coup", "martial law declared",
  "state of emergency declared", "assassination of", "assassinated",
  "president killed", "prime minister killed", "leader killed",
  "government overthrown", "parliament stormed", "capitol stormed",

  // Natural disasters
  "tsunami warning", "tsunami hits", "tsunami strikes",
  "magnitude 7", "magnitude 8", "magnitude 9",
  "volcanic eruption", "supervolcano",
  "category 5 hurricane", "category 5 typhoon", "super typhoon",

  // Terror
  "terrorist attack", "terror attack", "mass shooting",

  // Malaysia specific
  "darurat", "perintah berkurung", "banjir besar",
  "emergency declared in malaysia", "flood emergency malaysia",
  "malaysia earthquake", "tsunami malaysia",
];

// P1: keyword + context word -> push
export const P1_RULES: { keyword: string; context: string[] }[] = [
  { keyword: "attack", context: ["military", "civilian", "embassy", "base", "killed", "casualties", "airstrike"] },
  { keyword: "earthquake", context: ["magnitude", "killed", "casualties", "collapsed", "devastat", "richter"] },
  { keyword: "explosion", context: ["killed", "casualties", "downtown", "embassy", "airport", "government", "bomb"] },
  { keyword: "crash", context: ["stock market", "dow", "nasdaq", "s&p", "index", "plunge", "circuit breaker", "recession"] },
  { keyword: "sanctions", context: ["war", "nuclear", "invasion", "unprecedented", "sweeping"] },
  { keyword: "evacuate", context: ["embassy", "war zone", "citizens", "nationals", "malaysia"] },
  { keyword: "shot down", context: ["aircraft", "plane", "jet", "helicopter", "drone", "missile"] },
  { keyword: "sinks", context: ["warship", "submarine", "navy", "vessel", "destroyer"] },
  { keyword: "seize", context: ["territory", "city", "capital", "port", "airport", "government"] },
  { keyword: "blockade", context: ["naval", "port", "strait", "shipping", "oil"] },
  { keyword: "collapses", context: ["building", "bridge", "dam", "mine", "government", "bank"] },
  { keyword: "pandemic", context: ["WHO", "emergency", "outbreak", "lockdown", "quarantine"] },
  { keyword: "default", context: ["sovereign", "debt", "bonds", "government", "country"] },
  { keyword: "hostage", context: ["killed", "embassy", "rescue", "crisis", "kidnap"] },
];

// P2: need 3+ sources within 15 min reporting same topic
export const P2_KEYWORDS: string[] = [
  "breaking:", "breaking news", "just in", "urgent",
  "developing:", "alert:", "flash:",
];
```

**Step 3: Commit**

```bash
git add scripts/breaking/
git commit -m "feat(breaking): add types and keyword scoring lists"
```

---

### Task 2: Breaking news sources - fetch functions

**Files:**
- Create: `scripts/breaking/sources.ts`

**Step 1: Write source fetchers**

The breaking script runs standalone on VPS, so it has its own lightweight RSS fetch (no Next.js deps).

```typescript
// scripts/breaking/sources.ts
import { XMLParser } from "fast-xml-parser";

export interface RawArticle {
  title: string;
  url: string;
  source: string;
}

const FEEDS: { source: string; url: string }[] = [
  { source: "reuters", url: "https://www.reutersagency.com/feed/" },
  { source: "ap", url: "https://rsshub.app/apnews/topics/world-news" },
  { source: "bbc", url: "https://feeds.bbci.co.uk/news/world/rss.xml" },
  { source: "aljazeera", url: "https://www.aljazeera.com/xml/rss/all.xml" },
  { source: "bernama", url: "https://www.bernama.com/en/rss/news.xml" },
];

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
});

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, "").replace(/&[a-z]+;/gi, " ").trim();
}

async function fetchRSS(source: string, url: string): Promise<RawArticle[]> {
  try {
    const resp = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Polaris/1.0)" },
      signal: AbortSignal.timeout(15000),
    });
    if (!resp.ok) return [];
    const xml = await resp.text();
    const parsed = parser.parse(xml);

    // RSS 2.0
    const rssItems = parsed?.rss?.channel?.item;
    if (rssItems) {
      const items = Array.isArray(rssItems) ? rssItems : [rssItems];
      return items.slice(0, 15).map((item: any) => ({
        title: stripHtml(String(item.title || "")),
        url: String(item.link || ""),
        source,
      }));
    }

    // Atom
    const atomEntries = parsed?.feed?.entry;
    if (atomEntries) {
      const entries = Array.isArray(atomEntries) ? atomEntries : [atomEntries];
      return entries.slice(0, 15).map((entry: any) => ({
        title: stripHtml(String(entry.title?.["#text"] || entry.title || "")),
        url: String(entry.link?.["@_href"] || entry.link || ""),
        source,
      }));
    }

    return [];
  } catch {
    return [];
  }
}

async function fetchRedditRising(): Promise<RawArticle[]> {
  try {
    const resp = await fetch("https://www.reddit.com/r/worldnews/rising.json?limit=20", {
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" },
      signal: AbortSignal.timeout(15000),
    });
    if (!resp.ok) return [];
    const data = await resp.json();
    return (data?.data?.children || []).map((c: any) => ({
      title: c.data?.title || "",
      url: `https://reddit.com${c.data?.permalink || ""}`,
      source: "reddit",
    }));
  } catch {
    return [];
  }
}

async function fetchUSGS(): Promise<RawArticle[]> {
  try {
    const resp = await fetch(
      "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_month.geojson",
      { signal: AbortSignal.timeout(15000) }
    );
    if (!resp.ok) return [];
    const data = await resp.json();
    return (data?.features || []).slice(0, 10).map((f: any) => ({
      title: `Earthquake magnitude ${f.properties?.mag} - ${f.properties?.place}`,
      url: f.properties?.url || "",
      source: "usgs",
    }));
  } catch {
    return [];
  }
}

export async function fetchAllSources(): Promise<RawArticle[]> {
  const results = await Promise.allSettled([
    ...FEEDS.map((f) => fetchRSS(f.source, f.url)),
    fetchRedditRising(),
    fetchUSGS(),
  ]);

  return results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
}
```

**Step 2: Commit**

```bash
git add scripts/breaking/sources.ts
git commit -m "feat(breaking): add RSS/Reddit/USGS source fetchers"
```

---

### Task 3: Keyword matcher

**Files:**
- Create: `scripts/breaking/matcher.ts`
- Create: `scripts/breaking/__tests__/matcher.test.ts`

**Step 1: Write tests**

```typescript
// scripts/breaking/__tests__/matcher.test.ts
import { describe, it, expect } from "vitest";
import { matchKeywords } from "../matcher";

describe("matchKeywords", () => {
  // P0
  it("matches P0 exact phrase", () => {
    const result = matchKeywords("Iran declares war on Israel");
    expect(result.priority).toBe("P0");
    expect(result.matched).toContain("declares war");
  });

  it("matches P0 case-insensitive", () => {
    const result = matchKeywords("TSUNAMI WARNING issued for Pacific coast");
    expect(result.priority).toBe("P0");
  });

  it("matches P0 ceasefire", () => {
    const result = matchKeywords("Ceasefire declared in Gaza after 6 months of war");
    expect(result.priority).toBe("P0");
    expect(result.matched).toContain("ceasefire declared");
  });

  // P1
  it("matches P1 keyword + context", () => {
    const result = matchKeywords("Massive explosion in downtown Beirut, 50 killed");
    expect(result.priority).toBe("P1");
    expect(result.matched.length).toBeGreaterThan(0);
  });

  it("does NOT match P1 keyword without context", () => {
    const result = matchKeywords("Stock market crash landing for SpaceX fans");
    expect(result.priority).toBeNull();
  });

  // P2
  it("matches P2 generic breaking language", () => {
    const result = matchKeywords("BREAKING: Major announcement expected");
    expect(result.priority).toBe("P2");
  });

  // No match
  it("returns null for normal news", () => {
    const result = matchKeywords("Malaysia PM visits new highway in Penang");
    expect(result.priority).toBeNull();
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
npx vitest run scripts/breaking/__tests__/matcher.test.ts
```

Expected: FAIL - `matchKeywords` not found.

**Step 3: Implement matcher**

```typescript
// scripts/breaking/matcher.ts
import { P0_KEYWORDS, P1_RULES, P2_KEYWORDS } from "./keywords";
import type { Priority } from "./types";

interface MatchResult {
  priority: Priority | null;
  matched: string[];
}

export function matchKeywords(title: string): MatchResult {
  const lower = title.toLowerCase();

  // P0: any single phrase match
  const p0Hits = P0_KEYWORDS.filter((kw) => lower.includes(kw.toLowerCase()));
  if (p0Hits.length > 0) {
    return { priority: "P0", matched: p0Hits };
  }

  // P1: keyword + context
  const p1Hits: string[] = [];
  for (const rule of P1_RULES) {
    if (lower.includes(rule.keyword.toLowerCase())) {
      const contextHit = rule.context.find((ctx) => lower.includes(ctx.toLowerCase()));
      if (contextHit) {
        p1Hits.push(`${rule.keyword} + ${contextHit}`);
      }
    }
  }
  if (p1Hits.length > 0) {
    return { priority: "P1", matched: p1Hits };
  }

  // P2: generic breaking language
  const p2Hits = P2_KEYWORDS.filter((kw) => lower.includes(kw.toLowerCase()));
  if (p2Hits.length > 0) {
    return { priority: "P2", matched: p2Hits };
  }

  return { priority: null, matched: [] };
}
```

**Step 4: Run tests to verify they pass**

```bash
npx vitest run scripts/breaking/__tests__/matcher.test.ts
```

Expected: PASS (all 7 tests).

**Step 5: Commit**

```bash
git add scripts/breaking/matcher.ts scripts/breaking/__tests__/
git commit -m "feat(breaking): keyword matcher with P0/P1/P2 scoring + tests"
```

---

### Task 4: SQLite dedup store

**Files:**
- Create: `scripts/breaking/store.ts`

**Step 1: Install better-sqlite3**

```bash
npm install better-sqlite3
npm install -D @types/better-sqlite3
```

**Step 2: Write the store**

```typescript
// scripts/breaking/store.ts
import Database from "better-sqlite3";
import { createHash } from "crypto";
import path from "path";

const DB_PATH = path.join(__dirname, "../../data/breaking.db");

export function hashUrl(url: string): string {
  return createHash("sha256").update(url).digest("hex").slice(0, 16);
}

export class BreakingStore {
  private db: Database.Database;

  constructor(dbPath = DB_PATH) {
    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS seen (
        url_hash TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        priority TEXT,
        pushed_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS p2_candidates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        url_hash TEXT NOT NULL,
        source TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
  }

  /** Returns true if URL has NOT been seen before */
  isNew(urlHash: string): boolean {
    const row = this.db.prepare("SELECT 1 FROM seen WHERE url_hash = ?").get(urlHash);
    return !row;
  }

  markSeen(urlHash: string, title: string, priority: string | null): void {
    this.db.prepare(
      "INSERT OR IGNORE INTO seen (url_hash, title, priority) VALUES (?, ?, ?)"
    ).run(urlHash, title, priority);
  }

  markPushed(urlHash: string): void {
    this.db.prepare(
      "UPDATE seen SET pushed_at = datetime('now') WHERE url_hash = ?"
    ).run(urlHash);
  }

  /** Check if same event was pushed recently (fuzzy title match within 2 hours) */
  isDuplicateEvent(title: string): boolean {
    const recentPushed = this.db.prepare(
      "SELECT title FROM seen WHERE pushed_at IS NOT NULL AND pushed_at > datetime('now', '-2 hours')"
    ).all() as { title: string }[];

    const words = significantWords(title);
    for (const row of recentPushed) {
      const existingWords = significantWords(row.title);
      const overlap = words.filter((w) => existingWords.includes(w));
      if (overlap.length >= 3) return true;
    }
    return false;
  }

  /** Add P2 candidate and return count of unique sources for this topic in last 15 min */
  addP2Candidate(urlHash: string, title: string, source: string): number {
    this.db.prepare(
      "INSERT INTO p2_candidates (url_hash, title, source, created_at) VALUES (?, ?, ?, datetime('now'))"
    ).run(urlHash, title, source);

    // Count distinct sources with similar titles in last 15 min
    const recent = this.db.prepare(
      "SELECT DISTINCT source, title FROM p2_candidates WHERE created_at > datetime('now', '-15 minutes')"
    ).all() as { source: string; title: string }[];

    const words = significantWords(title);
    const matchingSources = new Set<string>();
    for (const row of recent) {
      const rowWords = significantWords(row.title);
      const overlap = words.filter((w) => rowWords.includes(w));
      if (overlap.length >= 2) matchingSources.add(row.source);
    }
    return matchingSources.size;
  }

  /** Cleanup entries older than 30 days */
  cleanup(): void {
    this.db.prepare("DELETE FROM seen WHERE created_at < datetime('now', '-30 days')").run();
    this.db.prepare("DELETE FROM p2_candidates WHERE created_at < datetime('now', '-1 day')").run();
  }

  close(): void {
    this.db.close();
  }
}

const STOP_WORDS = new Set([
  "the", "a", "an", "in", "on", "at", "to", "for", "of", "and", "or", "is",
  "are", "was", "were", "be", "been", "has", "have", "had", "do", "does",
  "did", "will", "would", "could", "should", "may", "might", "shall",
  "with", "by", "from", "as", "into", "that", "this", "it", "its",
  "after", "before", "over", "under", "says", "said", "new", "more",
]);

function significantWords(title: string): string[] {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}
```

**Step 3: Commit**

```bash
npm install better-sqlite3 && npm install -D @types/better-sqlite3
git add scripts/breaking/store.ts package.json package-lock.json
git commit -m "feat(breaking): SQLite dedup store with P2 multi-source tracking"
```

---

### Task 5: ntfy push function

**Files:**
- Create: `scripts/breaking/notify.ts`

**Step 1: Write the notifier**

```typescript
// scripts/breaking/notify.ts
import type { Priority } from "./types";

const NTFY_TOPIC = process.env.NTFY_TOPIC || "polaris-breaking";
const NTFY_URL = `https://ntfy.sh/${NTFY_TOPIC}`;

const PRIORITY_MAP: Record<Priority, string> = {
  P0: "urgent",  // makes phone ring
  P1: "high",    // vibration
  P2: "default", // silent notification
};

const TAG_MAP: Record<Priority, string> = {
  P0: "rotating_light",
  P1: "warning",
  P2: "newspaper",
};

export async function pushNotification(
  title: string,
  url: string,
  source: string,
  priority: Priority,
  matchedKeywords: string[],
  sourceCount?: number
): Promise<boolean> {
  const body = [
    `${source}${sourceCount && sourceCount > 1 ? ` | ${sourceCount} sources reporting` : ""}`,
    url,
    `Matched: ${matchedKeywords.join(", ")}`,
  ].join("\n");

  try {
    const resp = await fetch(NTFY_URL, {
      method: "POST",
      headers: {
        Title: `[${priority}] ${title}`.slice(0, 256),
        Priority: PRIORITY_MAP[priority],
        Tags: TAG_MAP[priority],
        Click: url,
      },
      body,
    });
    return resp.ok;
  } catch {
    console.error(`Failed to push notification: ${title}`);
    return false;
  }
}
```

**Step 2: Commit**

```bash
git add scripts/breaking/notify.ts
git commit -m "feat(breaking): ntfy push notifications with priority levels"
```

---

### Task 6: Main orchestrator script

**Files:**
- Create: `scripts/breaking/index.ts`

**Step 1: Write the main script**

```typescript
// scripts/breaking/index.ts
import { fetchAllSources } from "./sources";
import { matchKeywords } from "./matcher";
import { BreakingStore, hashUrl } from "./store";
import { pushNotification } from "./notify";
import type { BreakingItem, BreakingData } from "./types";
import fs from "fs";
import path from "path";

const BREAKING_JSON = path.join(__dirname, "../../data/breaking.json");

async function main() {
  const store = new BreakingStore();
  const pushed: BreakingItem[] = [];

  try {
    console.log(`[${new Date().toISOString()}] Fetching sources...`);
    const articles = await fetchAllSources();
    console.log(`Fetched ${articles.length} articles`);

    for (const article of articles) {
      const urlHash = hashUrl(article.url);

      // Skip if already seen
      if (!store.isNew(urlHash)) continue;

      const match = matchKeywords(article.title);
      store.markSeen(urlHash, article.title, match.priority);

      if (!match.priority) continue;

      // P2: need multi-source confirmation
      if (match.priority === "P2") {
        const sourceCount = store.addP2Candidate(urlHash, article.title, article.source);
        if (sourceCount < 3) continue; // not enough sources yet
      }

      // Skip if same event already pushed recently
      if (store.isDuplicateEvent(article.title)) {
        console.log(`Skipped duplicate event: ${article.title}`);
        continue;
      }

      // Push notification
      console.log(`[${match.priority}] ${article.title}`);
      const ok = await pushNotification(
        article.title,
        article.url,
        article.source,
        match.priority,
        match.matched
      );

      if (ok) {
        store.markPushed(urlHash);
        pushed.push({
          id: urlHash,
          title: article.title,
          url: article.url,
          source: article.source,
          priority: match.priority,
          matchedKeywords: match.matched,
          firstSeen: new Date().toISOString(),
          pushedAt: new Date().toISOString(),
        });
      }
    }

    // Update breaking.json (merge with existing, keep last 24h)
    if (pushed.length > 0) {
      const existing = loadBreakingJson();
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const merged = [...pushed, ...existing.items.filter((i) => i.firstSeen > cutoff)];
      const data: BreakingData = { items: merged, updatedAt: new Date().toISOString() };
      fs.writeFileSync(BREAKING_JSON, JSON.stringify(data, null, 2));
      console.log(`Updated breaking.json with ${pushed.length} new items`);
    }

    // Cleanup old entries
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
```

**Step 2: Commit**

```bash
git add scripts/breaking/index.ts
git commit -m "feat(breaking): main orchestrator - fetch, match, dedup, push"
```

---

### Task 7: Git push + Vercel deploy from VPS

**Files:**
- Create: `scripts/breaking/push-updates.sh`

**Step 1: Write the push script**

```bash
#!/bin/bash
# scripts/breaking/push-updates.sh
# Called by cron after fetch-breaking to push changes to GitHub

cd "$(dirname "$0")/../.."

if git diff --quiet data/breaking.json 2>/dev/null; then
  exit 0  # no changes
fi

git add data/breaking.json
git commit -m "breaking: update $(date -u +%Y-%m-%dT%H:%M)"
git push origin main

# Trigger Vercel deploy
if [ -n "$VERCEL_DEPLOY_HOOK" ]; then
  curl -s -X POST "$VERCEL_DEPLOY_HOOK" > /dev/null
fi
```

**Step 2: Make executable and commit**

```bash
chmod +x scripts/breaking/push-updates.sh
git add scripts/breaking/push-updates.sh
git commit -m "feat(breaking): git push + Vercel deploy trigger script"
```

---

### Task 8: Dashboard breaking bar UI

**Files:**
- Modify: `src/lib/types.ts` (add BreakingItem type)
- Modify: `src/app/page.tsx` (load breaking.json)
- Modify: `src/app/dashboard.tsx` (add breaking bar)

**Step 1: Add types to `src/lib/types.ts`**

Append:

```typescript
export interface BreakingNewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  priority: "P0" | "P1" | "P2";
  matchedKeywords: string[];
  firstSeen: string;
  pushedAt?: string;
}

export interface BreakingData {
  items: BreakingNewsItem[];
  updatedAt: string;
}
```

**Step 2: Load breaking.json in `src/app/page.tsx`**

Alongside existing data loading, add:

```typescript
import type { BreakingData } from "@/lib/types";

// Load breaking news
let breakingData: BreakingData = { items: [], updatedAt: "" };
try {
  const breakingPath = path.join(process.cwd(), "data", "breaking.json");
  breakingData = JSON.parse(fs.readFileSync(breakingPath, "utf-8"));
} catch {}
```

Pass `breakingData` to `<Dashboard>`.

**Step 3: Add breaking bar to `src/app/dashboard.tsx`**

At the top of the dashboard, before widgets:

```tsx
{breakingData.items.length > 0 && (
  <div className="mb-4 rounded-lg border border-red-500/30 bg-red-950/20 p-3">
    <div className="mb-2 flex items-center gap-2 text-sm font-bold text-red-400">
      <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-red-500" />
      BREAKING
    </div>
    <div className="space-y-1">
      {breakingData.items.slice(0, 5).map((item) => (
        <a
          key={item.id}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-sm text-red-200 hover:text-white transition-colors"
        >
          <span className="text-red-500/60 text-xs mr-1">[{item.priority}]</span>
          {item.title}
          <span className="text-red-500/40 text-xs ml-2">{item.source}</span>
        </a>
      ))}
    </div>
  </div>
)}
```

**Step 4: Commit**

```bash
git add src/lib/types.ts src/app/page.tsx src/app/dashboard.tsx
git commit -m "feat(breaking): red breaking bar on Polaris dashboard"
```

---

### Task 9: Gitignore + initial data

**Files:**
- Modify: `.gitignore`
- Create: `data/breaking.json`

**Step 1: Add SQLite to .gitignore**

Append to `.gitignore`:

```
# Breaking news SQLite (VPS only)
data/breaking.db
data/breaking.db-wal
data/breaking.db-shm
```

**Step 2: Create initial breaking.json**

```json
{"items":[],"updatedAt":""}
```

**Step 3: Commit**

```bash
git add .gitignore data/breaking.json
git commit -m "feat(breaking): gitignore SQLite, add initial breaking.json"
```

---

### Task 10: VPS setup (manual)

**Step 1: Provision Hetzner CX22**

- Go to console.hetzner.cloud
- Create project "polaris"
- Create server: CX22, Ubuntu 24.04, Helsinki or Falkenstein
- Add SSH key
- Note IP address

**Step 2: Server setup**

```bash
ssh root@<IP>

# Basic setup
apt update && apt upgrade -y

# Install Node 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs git sqlite3

# Clone repo
git clone https://github.com/hanashi42/techpulse.git /opt/polaris
cd /opt/polaris
npm ci

# Set up environment
cat > /opt/polaris/.env << 'ENVEOF'
NTFY_TOPIC=polaris-breaking-hanashi
VERCEL_DEPLOY_HOOK=<your-hook-url>
ENVEOF

# Set up git credentials for pushing
git config user.name "polaris-vps"
git config user.email "polaris@hoshi"
# Add GitHub deploy key or PAT for pushing
```

**Step 3: Set up cron**

```bash
crontab -e
```

Add:

```
*/5 * * * * cd /opt/polaris && /usr/bin/npx tsx scripts/breaking/index.ts >> /var/log/polaris-breaking.log 2>&1 && bash scripts/breaking/push-updates.sh >> /var/log/polaris-breaking.log 2>&1
```

**Step 4: Install ntfy app on phone**

- iOS: App Store -> "ntfy"
- Subscribe to topic: `polaris-breaking-hanashi`
- Enable notifications, set P0/urgent to override Do Not Disturb

**Step 5: Test with a manual run**

```bash
cd /opt/polaris
NTFY_TOPIC=polaris-breaking-hanashi npx tsx scripts/breaking/index.ts
```

Verify: notification appears on phone.

---

## Task Summary

| Task | What | Est. |
|------|------|------|
| 1 | Types + keywords | 5 min |
| 2 | Source fetchers | 5 min |
| 3 | Keyword matcher + tests | 10 min |
| 4 | SQLite dedup store | 5 min |
| 5 | ntfy push function | 3 min |
| 6 | Main orchestrator | 5 min |
| 7 | Git push script | 3 min |
| 8 | Dashboard breaking bar | 10 min |
| 9 | Gitignore + initial data | 2 min |
| 10 | VPS setup (manual) | 30 min |

**Total coding: ~45 min, VPS setup: ~30 min**
