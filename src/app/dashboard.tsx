"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import type { DailyData, Category, NewsItem, Source, BreakingNewsData } from "@/lib/types";

const FORME_SOURCES: Set<Source> = new Set([
  "soyacincau", "imoney", "vulcanpost", "ringgitplus",
  "everydayonsales", "mypromo", "fintechmy", "luno", "coindesk",
]);

const CATEGORIES: { key: Category | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "malaysia", label: "Malaysia" },
  { key: "world", label: "World" },
  { key: "money", label: "Money" },
  { key: "tech", label: "Tech" },
  { key: "life", label: "Life" },
  { key: "forme", label: "For Me" },
];

const SOURCE_META: Record<Source, { label: string; fullName: string; dot: string }> = {
  hackernews: { label: "HN", fullName: "Hacker News", dot: "bg-hn" },
  github: { label: "GH", fullName: "GitHub Trending", dot: "bg-gh" },
  reddit: { label: "RD", fullName: "Reddit", dot: "bg-reddit" },
  producthunt: { label: "PH", fullName: "Product Hunt", dot: "bg-ph" },
  thestar: { label: "Star", fullName: "The Star", dot: "bg-thestar" },
  malaymail: { label: "MM", fullName: "Malay Mail", dot: "bg-malaymail" },
  fmt: { label: "FMT", fullName: "Free Malaysia Today", dot: "bg-fmt" },
  malaysiakini: { label: "MK", fullName: "Malaysiakini", dot: "bg-malaysiakini" },
  bernama: { label: "BN", fullName: "Bernama", dot: "bg-bernama" },
  sinchew: { label: "SC", fullName: "Sin Chew Daily", dot: "bg-sinchew" },
  bbc: { label: "BBC", fullName: "BBC News", dot: "bg-bbc" },
  scmp: { label: "SCMP", fullName: "South China Morning Post", dot: "bg-scmp" },
  mrstingy: { label: "MS", fullName: "Mr Stingy", dot: "bg-mrstingy" },
  ringgitoh: { label: "RO", fullName: "Ringgit Oh Ringgit", dot: "bg-ringgitoh" },
  soyacincau: { label: "SC", fullName: "SoyaCincau", dot: "bg-soyacincau" },
  imoney: { label: "iM", fullName: "iMoney", dot: "bg-imoney" },
  vulcanpost: { label: "VP", fullName: "Vulcan Post", dot: "bg-vulcanpost" },
  ringgitplus: { label: "R+", fullName: "RinggitPlus", dot: "bg-ringgitplus" },
  everydayonsales: { label: "EOS", fullName: "EverydayOnSales", dot: "bg-eos" },
  mypromo: { label: "MP", fullName: "MyPromo", dot: "bg-mypromo" },
  fintechmy: { label: "FT", fullName: "FintechNews MY", dot: "bg-fintechmy" },
  luno: { label: "LN", fullName: "Luno", dot: "bg-luno" },
  coindesk: { label: "CD", fullName: "CoinDesk", dot: "bg-coindesk" },
  reminder: { label: "!", fullName: "Reminder", dot: "bg-reminder" },
};

function formatScore(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

// RSS items have position-based scores (1-5), don't show upvote icon for those
const LOW_SCORE_THRESHOLD = 10;

function ReminderCard({ item }: { item: NewsItem }) {
  // Extract days left from description like "(还有12天)" or "(今天)"
  const daysMatch = item.description?.match(/还有(\d+)天/);
  const isToday = item.description?.includes("(今天)");
  const daysLeft = daysMatch ? parseInt(daysMatch[1]) : isToday ? 0 : null;
  const cleanDesc = item.description?.replace(/\s*\(还有\d+天\)|\s*\(今天\)/, "");

  const tag = daysLeft === 0 ? "今天" : daysLeft !== null ? `还有${daysLeft}天` : null;

  return (
    <div className="group block rounded-xl border-l-4 border-l-reminder border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="shrink-0 mt-0.5 text-base">&#9200;</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {tag && (
              <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                daysLeft === 0
                  ? "bg-red-100 text-red-700"
                  : daysLeft !== null && daysLeft <= 3
                    ? "bg-orange-100 text-orange-700"
                    : "bg-yellow-100 text-yellow-700"
              }`}>
                {tag}
              </span>
            )}
            <h3 className="text-sm font-medium leading-snug text-foreground">
              {item.title}
            </h3>
          </div>
          {cleanDesc && (
            <p className="mt-1 text-xs leading-relaxed text-muted">
              {cleanDesc}
            </p>
          )}
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-xs text-accent hover:underline"
            >
              &rarr; {new URL(item.url).hostname}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function NewsCard({ item }: { item: NewsItem }) {
  if (item.source === "reminder") return <ReminderCard item={item} />;

  const meta = SOURCE_META[item.source];
  const showScore = item.score >= LOW_SCORE_THRESHOLD;

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
          {item.summary ? (
            <p className="mt-1 text-xs leading-relaxed text-accent/70 line-clamp-2">
              {item.summary}
            </p>
          ) : item.description && item.source !== "hackernews" ? (
            <p className="mt-1 text-xs leading-relaxed text-muted line-clamp-2">
              {item.description}
            </p>
          ) : null}
          <div className="mt-2 flex items-center gap-3 text-xs text-muted">
            {showScore && (
              <span className="flex items-center gap-1">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                </svg>
                {formatScore(item.score)}
              </span>
            )}
            {!showScore && (
              <span className="text-muted/60">{meta.label}</span>
            )}
            {item.comments !== undefined && (
              <span
                className="flex items-center gap-1 hover:text-foreground cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.open(item.commentsUrl || item.url, "_blank");
                }}
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {item.comments}
              </span>
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

const FX_ORDER: [string, string][] = [
  ["USD", "\u{1F1FA}\u{1F1F8}"],
  ["SGD", "\u{1F1F8}\u{1F1EC}"],
  ["JPY", "\u{1F1EF}\u{1F1F5}"],
  ["CNY", "\u{1F1E8}\u{1F1F3}"],
  ["GBP", "\u{1F1EC}\u{1F1E7}"],
  ["EUR", "\u{1F1EA}\u{1F1FA}"],
  ["AUD", "\u{1F1E6}\u{1F1FA}"],
  ["KRW", "\u{1F1F0}\u{1F1F7}"],
  ["THB", "\u{1F1F9}\u{1F1ED}"],
  ["TWD", "\u{1F1F9}\u{1F1FC}"],
];

function Sparkline({ points, width = 120, height = 40 }: { points: number[]; width?: number; height?: number }) {
  if (points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const pad = 2;
  const w = width - pad * 2;
  const h = height - pad * 2;

  const coords = points.map((v, i) => ({
    x: pad + (i / (points.length - 1)) * w,
    y: pad + h - ((v - min) / range) * h,
  }));
  const d = coords.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const last = coords[coords.length - 1];
  const trend = points[points.length - 1] >= points[0];

  return (
    <svg width={width} height={height} className="block">
      <path d={d} fill="none" stroke={trend ? "#22c55e" : "#ef4444"} strokeWidth={1.5} />
      <circle cx={last.x} cy={last.y} r={2.5} fill={trend ? "#22c55e" : "#ef4444"} />
    </svg>
  );
}

const FX_MULTIPLIER: Record<string, number> = { JPY: 100, KRW: 1000, THB: 100 };

function formatMyr(v: number): string {
  if (v >= 100) return v.toFixed(0);
  if (v >= 10) return v.toFixed(2);
  return v.toFixed(3);
}

function FxItem({ code, flag, rate, history }: { code: string; flag: string; rate: number; history?: Record<string, Record<string, number>> }) {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  const mult = FX_MULTIPLIER[code] || 1;
  const invRate = mult / rate;
  const points = history
    ? Object.keys(history).sort().map((d) => history[d][code]).filter((v) => v != null).map((v) => mult / v)
    : [];

  const pctChange = points.length >= 2
    ? ((points[points.length - 1] - points[0]) / points[0]) * 100
    : null;

  return (
    <span
      ref={ref}
      className="relative cursor-default"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span className="text-muted">{flag}{mult > 1 ? `${mult}` : ""}{code}</span>{" "}
      <span className="font-medium">{formatMyr(invRate)}</span>
      {show && points.length >= 2 && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 rounded-lg border border-border bg-card shadow-lg p-2 whitespace-nowrap">
          <span className="flex items-center gap-2">
            <Sparkline points={points} />
            <span className="flex flex-col text-[10px] leading-tight">
              <span className="text-muted">30d</span>
              <span className={pctChange! >= 0 ? "text-green-500" : "text-red-500"}>
                {pctChange! >= 0 ? "+" : ""}{pctChange!.toFixed(2)}%
              </span>
            </span>
          </span>
        </span>
      )}
    </span>
  );
}

function WidgetBar({ data }: { data: DailyData }) {
  const fuel = data.widgets?.fuel;
  const fx = data.widgets?.fx;
  if (!fuel && !fx) return null;

  const formatChange = (val?: number) => {
    if (val === undefined || val === null) return null;
    if (val > 0) return <span className="text-red-500">&#8593;{val.toFixed(2)}</span>;
    if (val < 0) return <span className="text-green-500">&#8595;{Math.abs(val).toFixed(2)}</span>;
    return <span className="text-muted">&mdash;</span>;
  };

  const formatFxDate = (dateStr: string) => {
    const d = new Date(dateStr + "T12:00:00Z");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  };

  return (
    <div className="mb-4 space-y-2">
      {fuel && (
        <div className="rounded-xl border border-border bg-card p-3 text-sm">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="font-medium">RON95 RM{fuel.ron95.toFixed(2)} {formatChange(fuel.ron95Change)}</span>
              <span className="font-medium">RON97 RM{fuel.ron97.toFixed(2)} {formatChange(fuel.ron97Change)}</span>
              <span className="font-medium">Diesel RM{fuel.diesel.toFixed(2)} {formatChange(fuel.dieselChange)}</span>
            </div>
            <span className="text-xs text-muted shrink-0 ml-2">{formatFxDate(fuel.date)}</span>
          </div>
        </div>
      )}
      {fx && (
        <div className="rounded-xl border border-border bg-card p-3 text-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted">1 foreign &rarr; MYR</span>
            <span className="text-xs text-muted">{formatFxDate(fx.date)}</span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs">
            {FX_ORDER.filter(([code]) => code in fx.rates).map(([code, flag]) => (
              <FxItem key={code} code={code} flag={flag} rate={fx.rates[code]} history={fx.history} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Dashboard({
  data,
  dates,
  currentDate,
  breakingData,
}: {
  data: DailyData | null;
  dates: string[];
  currentDate: string;
  breakingData: BreakingNewsData;
}) {
  const [category, setCategory] = useState<Category | "all">("forme");
  const router = useRouter();

  const items = data?.items ?? [];
  const filtered = category === "all"
    ? items
    : category === "forme"
      ? items.filter((i) => i.category === "forme" || FORME_SOURCES.has(i.source))
      : items.filter((i) => i.category === category);

  const currentIdx = dates.indexOf(currentDate);
  const prevDate = currentIdx < dates.length - 1 ? dates[currentIdx + 1] : null;
  const nextDate = currentIdx > 0 ? dates[currentIdx - 1] : null;

  const navigateDate = (date: string) => {
    router.push(`/?date=${date}`);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T12:00:00Z");
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
  };

  const categoryCount = (cat: Category) =>
    cat === "forme"
      ? items.filter((i) => i.category === "forme" || FORME_SOURCES.has(i.source)).length
      : items.filter((i) => i.category === cat).length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              <span className="text-accent">Pol</span>aris
            </h1>
            <p className="mt-1 text-sm text-muted">Your daily information compass</p>
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

        {/* Category stats */}
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          {(["malaysia", "world", "money", "tech", "life", "forme"] as Category[]).map((cat) => {
            const count = categoryCount(cat);
            if (count === 0) return null;
            const label = CATEGORIES.find((c) => c.key === cat)!.label;
            return (
              <span key={cat}>
                {label} {count}
              </span>
            );
          })}
          <span className="ml-auto">{items.length} total</span>
        </div>
      </header>

      {/* Breaking news bar */}
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

      {/* Widgets: fuel + fx */}
      {data && (category === "all" || category === "forme" || category === "money") && (
        <WidgetBar data={data} />
      )}

      {/* Briefing: overall or per-category */}
      {category === "all" && data?.briefing && (
        <div className="mb-6 rounded-xl border border-accent/20 bg-accent/5 p-4">
          <h2 className="mb-2 text-sm font-semibold text-accent">
            今日要点
          </h2>
          <p className="text-sm leading-relaxed text-foreground/85">
            {data.briefing}
          </p>
        </div>
      )}
      {category !== "all" && data?.categoryBriefings?.[category] && (
        <div className="mb-6 rounded-xl border border-accent/20 bg-accent/5 p-4">
          <h2 className="mb-2 text-sm font-semibold text-accent">
            {CATEGORIES.find((c) => c.key === category)?.label} 要点
          </h2>
          <p className="text-sm leading-relaxed text-foreground/85">
            {data.categoryBriefings[category]}
          </p>
        </div>
      )}

      {/* Category tabs */}
      <nav className="mb-6 flex gap-1 rounded-xl border border-border bg-card p-1">
        {CATEGORIES.map((cat) => {
          const count =
            cat.key === "all"
              ? items.length
              : categoryCount(cat.key as Category);
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
        Polaris &middot; Auto-updated daily from 21 sources across 6 domains
      </footer>
    </div>
  );
}
