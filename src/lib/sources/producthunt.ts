import { categorize } from "../categorize";
import type { NewsItem } from "../types";

// Product Hunt's GraphQL API requires authentication.
// Use their public RSS feed via unofficial endpoint.
const PH_RSS_URL = "https://www.producthunt.com/feed?category=undefined";
// Fallback: scrape the homepage
const PH_HOME_URL = "https://www.producthunt.com";

export async function fetchProductHunt(limit = 5): Promise<NewsItem[]> {
  const now = new Date().toISOString();

  try {
    // Try the JSON endpoint that their website uses
    const today = new Date().toISOString().split("T")[0];
    const res = await fetch(
      `https://www.producthunt.com/frontend/graphql`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
          Origin: "https://www.producthunt.com",
          Referer: "https://www.producthunt.com/",
        },
        body: JSON.stringify({
          operationName: "DailyPage",
          variables: { date: today },
          query: `query DailyPage($date: DateTime) {
            posts(order: RANKING, postedAfter: $date, first: ${limit}) {
              edges {
                node {
                  id
                  name
                  tagline
                  url
                  votesCount
                  website
                  commentsCount
                }
              }
            }
          }`,
        }),
      }
    );

    if (!res.ok) {
      console.error(`Product Hunt API error: ${res.status}`);
      return [];
    }

    const data = await res.json();
    const edges = data?.data?.posts?.edges ?? [];

    return edges.slice(0, limit).map((edge: { node: Record<string, unknown> }) => {
      const n = edge.node;
      return {
        id: `ph-${n.id}`,
        source: "producthunt" as const,
        title: `${n.name} - ${n.tagline}`,
        url: (n.website as string) || (n.url as string),
        score: n.votesCount as number,
        comments: n.commentsCount as number,
        commentsUrl: n.url as string,
        category: categorize(n.name as string, n.tagline as string),
        description: n.tagline as string,
        fetchedAt: now,
      };
    });
  } catch (err) {
    console.error("Product Hunt fetch failed:", err);
    return [];
  }
}
