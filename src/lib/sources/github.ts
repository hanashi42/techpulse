import { categorize } from "../categorize";
import type { NewsItem } from "../types";

const TRENDING_URL = "https://api.github.com/search/repositories";

export async function fetchGitHubTrending(limit = 15): Promise<NewsItem[]> {
  // Search for repos created or pushed to in the last 24 hours with high stars
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const query = `created:>${since} stars:>20`;

  const res = await fetch(
    `${TRENDING_URL}?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=${limit}`,
    {
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "TechPulse/1.0",
      },
    }
  );

  if (!res.ok) {
    console.error(`GitHub API error: ${res.status}`);
    return [];
  }

  const data = await res.json();
  const now = new Date().toISOString();

  return (data.items ?? []).slice(0, limit).map((repo: Record<string, unknown>) => ({
    id: `gh-${repo.id}`,
    source: "github" as const,
    title: `${repo.full_name}: ${repo.description ?? ""}`.slice(0, 200),
    url: repo.html_url as string,
    score: repo.stargazers_count as number,
    category: categorize(
      `${repo.full_name} ${repo.description ?? ""}`,
      repo.language as string | undefined
    ),
    description: (repo.description as string) ?? "",
    extra: {
      language: (repo.language as string) ?? "Unknown",
      stars: repo.stargazers_count as number,
      forks: repo.forks_count as number,
    },
    fetchedAt: now,
  }));
}
