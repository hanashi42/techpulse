export type Source =
  | "hackernews"
  | "github"
  | "reddit"
  | "producthunt"
  | "thestar"
  | "malaymail"
  | "fmt"
  | "malaysiakini"
  | "bernama"
  | "sinchew"
  | "bbc"
  | "scmp"
  | "mrstingy"
  | "ringgitoh";

export type Category = "tech" | "malaysia" | "world" | "money" | "life";

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
