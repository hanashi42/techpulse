import { categorize } from "../categorize";
import type { NewsItem } from "../types";

const SUBREDDITS = ["LocalLLaMA", "MachineLearning", "selfhosted"];

const BROWSER_UA =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

interface RedditPost {
  data: {
    id: string;
    title: string;
    url: string;
    permalink: string;
    score: number;
    num_comments: number;
    selftext: string;
    subreddit: string;
    is_self: boolean;
  };
}

async function tryFetch(url: string): Promise<Response | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": BROWSER_UA,
        Accept: "application/json",
      },
    });
    if (res.ok) return res;
    console.error(`Reddit ${url} → ${res.status}`);
  } catch (err) {
    console.error(`Reddit ${url} failed:`, err);
  }
  return null;
}

export async function fetchReddit(minScore = 30, limit = 10): Promise<NewsItem[]> {
  const allItems: NewsItem[] = [];
  const now = new Date().toISOString();

  for (const sub of SUBREDDITS) {
    // Try multiple endpoints — Reddit blocks differently by IP/UA
    const res =
      (await tryFetch(`https://www.reddit.com/r/${sub}/hot.json?limit=25&raw_json=1`)) ??
      (await tryFetch(`https://old.reddit.com/r/${sub}/hot.json?limit=25&raw_json=1`));

    if (!res) continue;

    const data = await res.json();
    const posts: RedditPost[] = data?.data?.children ?? [];

    for (const post of posts) {
      const p = post.data;
      if (p.score < minScore) continue;

      allItems.push({
        id: `reddit-${p.id}`,
        source: "reddit",
        title: p.title,
        url: p.is_self ? `https://reddit.com${p.permalink}` : p.url,
        score: p.score,
        comments: p.num_comments,
        commentsUrl: `https://reddit.com${p.permalink}`,
        category: categorize(p.title, p.selftext.slice(0, 300)),
        description: p.selftext.slice(0, 200) || undefined,
        extra: { subreddit: p.subreddit },
        fetchedAt: now,
      });
    }
  }

  return allItems
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
