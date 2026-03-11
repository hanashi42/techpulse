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
  | "everydayonsales"
  | "mypromo"
  | "fintechmy"
  | "luno"
  | "coindesk"
  | "reddit-claude"
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

export interface FuelPrice {
  date: string;
  ron95: number;
  ron97: number;
  diesel: number;
  ron95Change?: number;
  ron97Change?: number;
  dieselChange?: number;
}

export interface ExchangeRates {
  date: string;
  base: "MYR";
  rates: Record<string, number>;
  history?: Record<string, Record<string, number>>; // date -> currency -> rate
}

export interface DailyData {
  date: string;
  briefing?: string;
  categoryBriefings?: Partial<Record<Category, string>>;
  items: NewsItem[];
  reminders?: ReminderItem[];
  widgets?: {
    fuel?: FuelPrice;
    fx?: ExchangeRates;
  };
}

export interface BreakingNewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  priority: "P0" | "P1" | "P2";
  matchedKeywords: string[];
  firstSeen: string;
  pushedAt?: string;
}

export interface BreakingNewsData {
  items: BreakingNewsItem[];
  updatedAt: string;
}
