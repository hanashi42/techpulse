export type Source = "hackernews" | "github" | "reddit" | "producthunt";

export type Category = "ai" | "tools" | "opensource" | "product";

export interface NewsItem {
  id: string;
  source: Source;
  title: string;
  url: string;
  score: number;
  comments?: number;
  commentsUrl?: string;
  category: Category;
  description?: string;
  extra?: Record<string, string | number>;
  fetchedAt: string;
}

export interface DailyData {
  date: string;
  items: NewsItem[];
}
