"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DailyData, Category, NewsItem, Source } from "@/lib/types";

const CATEGORIES: { key: Category | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "ai", label: "AI / LLM" },
  { key: "opensource", label: "Open Source" },
  { key: "tools", label: "Dev Tools" },
  { key: "product", label: "Products" },
];

const SOURCE_META: Record<Source, { label: string; fullName: string; dot: string }> = {
  hackernews: { label: "HN", fullName: "Hacker News", dot: "bg-hn" },
  github: { label: "GH", fullName: "GitHub Trending", dot: "bg-gh" },
  reddit: { label: "RD", fullName: "Reddit", dot: "bg-reddit" },
  producthunt: { label: "PH", fullName: "Product Hunt", dot: "bg-ph" },
};

function formatScore(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function NewsCard({ item }: { item: NewsItem }) {
  const meta = SOURCE_META[item.source];

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-xl border border-border bg-card p-4 shadow-sm hover:shadow-md hover:border-accent/30"
    >
      <div className="flex items-start gap-3">
        <span
          className={`shrink-0 mt-1.5 h-2.5 w-2.5 rounded-full ${meta.dot}`}
          title={meta.fullName}
        />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-medium leading-snug text-foreground group-hover:text-accent">
            {item.title}
          </h3>
          {item.description && item.source !== "hackernews" && (
            <p className="mt-1 text-xs leading-relaxed text-muted line-clamp-2">
              {item.description}
            </p>
          )}
          <div className="mt-2 flex items-center gap-3 text-xs text-muted">
            <span className="flex items-center gap-1">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
              </svg>
              {formatScore(item.score)}
            </span>
            {item.comments !== undefined && (
              <a
                href={item.commentsUrl || item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-foreground"
                onClick={(e) => e.stopPropagation()}
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {item.comments}
              </a>
            )}
            {item.extra?.language && (
              <span className="text-accent/60">{item.extra.language}</span>
            )}
            {item.extra?.subreddit && (
              <span className="text-muted">r/{item.extra.subreddit}</span>
            )}
          </div>
        </div>
      </div>
    </a>
  );
}

export default function Dashboard({
  data,
  dates,
  currentDate,
}: {
  data: DailyData | null;
  dates: string[];
  currentDate: string;
}) {
  const [category, setCategory] = useState<Category | "all">("all");
  const router = useRouter();

  const items = data?.items ?? [];
  const filtered = category === "all" ? items : items.filter((i) => i.category === category);

  const currentIdx = dates.indexOf(currentDate);
  const prevDate = currentIdx < dates.length - 1 ? dates[currentIdx + 1] : null;
  const nextDate = currentIdx > 0 ? dates[currentIdx - 1] : null;

  const navigateDate = (date: string) => {
    router.push(`/?date=${date}`);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const sourceCount = (source: Source) => items.filter((i) => i.source === source).length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              <span className="text-accent">Tech</span>Pulse
            </h1>
            <p className="mt-1 text-sm text-muted">Daily curated tech news</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted">
            {prevDate && (
              <button
                onClick={() => navigateDate(prevDate)}
                className="rounded-lg px-2 py-1 hover:bg-card hover:text-foreground"
              >
                &larr;
              </button>
            )}
            <span className="font-mono text-foreground">{formatDate(currentDate)}</span>
            {nextDate && (
              <button
                onClick={() => navigateDate(nextDate)}
                className="rounded-lg px-2 py-1 hover:bg-card hover:text-foreground"
              >
                &rarr;
              </button>
            )}
          </div>
        </div>

        {/* Source stats */}
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          {(["hackernews", "github", "reddit", "producthunt"] as Source[]).map((s) => {
            const count = sourceCount(s);
            if (count === 0) return null;
            const meta = SOURCE_META[s];
            return (
              <span key={s} className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                {meta.fullName} {count}
              </span>
            );
          })}
          <span className="ml-auto">{items.length} total</span>
        </div>
      </header>

      {/* Category tabs */}
      <nav className="mb-6 flex gap-1 rounded-xl border border-border bg-card p-1">
        {CATEGORIES.map((cat) => {
          const count =
            cat.key === "all"
              ? items.length
              : items.filter((i) => i.category === cat.key).length;
          return (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key)}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                category === cat.key
                  ? "bg-accent-dim text-white"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {cat.label}
              <span className="ml-1.5 text-xs opacity-60">{count}</span>
            </button>
          );
        })}
      </nav>

      {/* News items */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center text-muted">
          <p className="text-lg">No items yet</p>
          <p className="mt-1 text-sm">Check back later or try another category</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => (
            <NewsCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* Footer */}
      <footer className="mt-12 border-t border-border pt-4 text-center text-xs text-muted">
        TechPulse &middot; Auto-updated daily from HN, GitHub, Reddit
      </footer>
    </div>
  );
}
