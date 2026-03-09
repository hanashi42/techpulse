import { createHash } from "crypto";
import { XMLParser } from "fast-xml-parser";
import { categorize } from "../categorize";
import type { Category, NewsItem, Source } from "../types";

export interface RSSFeedConfig {
  url: string;
  source: Source;
  defaultCategory: Category;
  limit?: number;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
});

function stripHTML(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&mdash;/g, "\u2014")
    .replace(/&ndash;/g, "\u2013")
    .replace(/&hellip;/g, "\u2026")
    .replace(/\s+/g, " ")
    .trim();
}

function extractText(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return stripHTML(value);
  if (typeof value === "object" && value !== null && "#text" in value) {
    return stripHTML(String((value as Record<string, unknown>)["#text"]));
  }
  return stripHTML(String(value));
}

function extractItems(parsed: Record<string, unknown>): Record<string, unknown>[] {
  // RSS 2.0
  const rss = parsed.rss as Record<string, unknown> | undefined;
  if (rss) {
    const channel = rss.channel as Record<string, unknown>;
    const items = channel?.item;
    if (Array.isArray(items)) return items;
    if (items) return [items as Record<string, unknown>];
  }

  // Atom
  const feed = parsed.feed as Record<string, unknown> | undefined;
  if (feed) {
    const entries = feed.entry;
    if (Array.isArray(entries)) return entries;
    if (entries) return [entries as Record<string, unknown>];
  }

  return [];
}

function getLink(item: Record<string, unknown>): string {
  // RSS 2.0
  if (item.link && typeof item.link === "string") return item.link;

  // Atom: link can be object or array
  const link = item.link;
  if (Array.isArray(link)) {
    const alt = link.find(
      (l: Record<string, unknown>) => l["@_rel"] === "alternate" || !l["@_rel"],
    );
    return (alt?.["@_href"] as string) ?? (link[0]?.["@_href"] as string) ?? "";
  }
  if (typeof link === "object" && link !== null) {
    return ((link as Record<string, unknown>)["@_href"] as string) ?? "";
  }

  return "";
}

export async function fetchRSSFeed(config: RSSFeedConfig): Promise<NewsItem[]> {
  const { url, source, defaultCategory, limit = 5 } = config;
  const now = new Date().toISOString();

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        Accept: "application/rss+xml, application/xml, text/xml, application/atom+xml",
      },
    });

    if (!res.ok) {
      console.error(`RSS ${source} ${url} → ${res.status}`);
      return [];
    }

    const xml = await res.text();
    const parsed = parser.parse(xml);
    const rawItems = extractItems(parsed);

    const cutoff = Date.now() - 48 * 60 * 60 * 1000; // 48 hours ago

    return rawItems.slice(0, limit).map((item, idx) => {
      const title = extractText(item.title);
      const description = extractText(item.description ?? item.summary ?? item.content);
      const link = getLink(item);
      const pubDateStr = (item.pubDate ?? item.published ?? item.updated) as string | undefined;
      const pubDate = pubDateStr ? new Date(pubDateStr).getTime() : NaN;

      return {
        id: `${source}-${createHash("sha256").update(link || title).digest("hex").slice(0, 12)}`,
        source,
        title,
        url: link,
        score: limit - idx, // position-based: first = highest
        category: categorize(title, description, defaultCategory),
        description: description.slice(0, 200) || undefined,
        fetchedAt: now,
        _pubDate: pubDate,
      };
    }).filter((item) => {
      // Drop articles with a valid pubDate older than 48h
      if (!isNaN(item._pubDate) && item._pubDate < cutoff) return false;
      return true;
    }).map(({ _pubDate, ...item }) => item);
  } catch (err) {
    console.error(`RSS ${source} ${url} failed:`, err);
    return [];
  }
}

export async function fetchMultipleRSS(configs: RSSFeedConfig[]): Promise<NewsItem[]> {
  const results = await Promise.allSettled(configs.map((c) => fetchRSSFeed(c)));

  return results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
}
