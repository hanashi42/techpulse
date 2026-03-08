import { XMLParser } from "fast-xml-parser";

export interface RawArticle {
  title: string;
  url: string;
  source: string;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
});

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const TIMEOUT_MS = 15_000;

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
  if (item.link && typeof item.link === "string") return item.link;

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

interface RSSSource {
  url: string;
  name: string;
}

const RSS_SOURCES: RSSSource[] = [
  { url: "https://www.reutersagency.com/feed/", name: "Reuters" },
  { url: "https://rsshub.app/apnews/topics/world-news", name: "AP" },
  { url: "https://feeds.bbci.co.uk/news/world/rss.xml", name: "BBC" },
  { url: "https://www.aljazeera.com/xml/rss/all.xml", name: "Al Jazeera" },
  { url: "https://www.bernama.com/en/rss/news.xml", name: "Bernama" },
];

const USGS_URL =
  "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_month.geojson";

const REDDIT_URL = "https://www.reddit.com/r/worldnews/rising.json?limit=20";

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchRSS(source: RSSSource): Promise<RawArticle[]> {
  try {
    const res = await fetchWithTimeout(source.url, {
      headers: {
        "User-Agent": UA,
        Accept: "application/rss+xml, application/xml, text/xml, application/atom+xml",
      },
    });

    if (!res.ok) {
      console.error(`[breaking] RSS ${source.name} ${source.url} -> ${res.status}`);
      return [];
    }

    const xml = await res.text();
    const parsed = parser.parse(xml);
    const items = extractItems(parsed);

    return items.slice(0, 15).map((item) => ({
      title: extractText(item.title),
      url: getLink(item),
      source: source.name,
    })).filter((a) => a.title && a.url);
  } catch (err) {
    console.error(`[breaking] RSS ${source.name} failed:`, (err as Error).message);
    return [];
  }
}

async function fetchReddit(): Promise<RawArticle[]> {
  try {
    const res = await fetchWithTimeout(REDDIT_URL, {
      headers: {
        "User-Agent": UA,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      console.error(`[breaking] Reddit r/worldnews -> ${res.status}`);
      return [];
    }

    const data = (await res.json()) as {
      data: { children: Array<{ data: { title: string; url: string; permalink: string } }> };
    };

    return data.data.children.map((child) => ({
      title: child.data.title,
      url: child.data.url || `https://www.reddit.com${child.data.permalink}`,
      source: "Reddit r/worldnews",
    }));
  } catch (err) {
    console.error(`[breaking] Reddit failed:`, (err as Error).message);
    return [];
  }
}

async function fetchUSGS(): Promise<RawArticle[]> {
  try {
    const res = await fetchWithTimeout(USGS_URL, {
      headers: { "User-Agent": UA },
    });

    if (!res.ok) {
      console.error(`[breaking] USGS -> ${res.status}`);
      return [];
    }

    const data = (await res.json()) as {
      features: Array<{
        properties: { title: string; url: string };
      }>;
    };

    return data.features.map((f) => ({
      title: f.properties.title,
      url: f.properties.url,
      source: "USGS",
    }));
  } catch (err) {
    console.error(`[breaking] USGS failed:`, (err as Error).message);
    return [];
  }
}

export async function fetchAllSources(): Promise<RawArticle[]> {
  const results = await Promise.allSettled([
    ...RSS_SOURCES.map((s) => fetchRSS(s)),
    fetchReddit(),
    fetchUSGS(),
  ]);

  const articles: RawArticle[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      articles.push(...result.value);
    }
  }

  console.log(`[breaking] Fetched ${articles.length} articles total`);
  return articles;
}
