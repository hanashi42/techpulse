import Database from "better-sqlite3";
import { createHash } from "crypto";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
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

  addP2Candidate(urlHash: string, title: string, source: string): number {
    this.db.prepare(
      "INSERT INTO p2_candidates (url_hash, title, source, created_at) VALUES (?, ?, ?, datetime('now'))"
    ).run(urlHash, title, source);

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
