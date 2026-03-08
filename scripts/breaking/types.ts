export type Priority = "P0" | "P1" | "P2";

export interface BreakingItem {
  id: string;
  title: string;
  url: string;
  source: string;
  priority: Priority;
  matchedKeywords: string[];
  firstSeen: string;
  pushedAt?: string;
}

export interface BreakingData {
  items: BreakingItem[];
  updatedAt: string;
}
