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
  | "ringgitoh"
  | "soyacincau"
  | "imoney"
  | "vulcanpost"
  | "ringgitplus"
  | "reminder";

export type Category = "tech" | "malaysia" | "world" | "money" | "life" | "forme";

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
  summary?: string;
  extra?: Record<string, string | number>;
  fetchedAt: string;
}

export interface ReminderItem {
  id: string;
  title: string;
  description: string;
  date: string;
  daysBeforeAlert: number;
  category: "forme";
  tags: string[];
  url?: string;
}

export interface DailyData {
  date: string;
  briefing?: string;
  items: NewsItem[];
  reminders?: ReminderItem[];
}
