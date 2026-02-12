import { categorize } from "../categorize";
import type { NewsItem } from "../types";

const SUBREDDITS = ["LocalLLaMA", "MachineLearning", "selfhosted"];

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

export async function fetchReddit(minScore = 30, limit = 10): Promise<NewsItem[]> {
  const allItems: NewsItem[] = [];
  const now = new Date().toISOString();

  for (const sub of SUBREDDITS) {
    try {
      // Use old.reddit.com which is more lenient with API access
      const res = await fetch(`https://old.reddit.com/r/${sub}/hot.json?limit=25&raw_json=1`, {
        headers: {
          "User-Agent": "TechPulse:v1.0 (by /u/techpulse-bot)",
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        console.error(`Reddit r/${sub} error: ${res.status}`);
        continue;
      }

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
    } catch (err) {
      console.error(`Reddit r/${sub} fetch failed:`, err);
    }
  }

  return allItems
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
