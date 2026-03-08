import { P0_KEYWORDS, P1_RULES, P2_KEYWORDS } from "./keywords";
import type { Priority } from "./types";

interface MatchResult {
  priority: Priority | null;
  matched: string[];
}

export function matchKeywords(title: string): MatchResult {
  const lower = title.toLowerCase();

  // P0: any single phrase match
  const p0Hits = P0_KEYWORDS.filter((kw) => lower.includes(kw.toLowerCase()));
  if (p0Hits.length > 0) {
    return { priority: "P0", matched: p0Hits };
  }

  // P1: keyword + context
  const p1Hits: string[] = [];
  for (const rule of P1_RULES) {
    if (lower.includes(rule.keyword.toLowerCase())) {
      const contextHit = rule.context.find((ctx) =>
        lower.includes(ctx.toLowerCase())
      );
      if (contextHit) {
        p1Hits.push(`${rule.keyword} + ${contextHit}`);
      }
    }
  }
  if (p1Hits.length > 0) {
    return { priority: "P1", matched: p1Hits };
  }

  // P2: generic breaking language
  const p2Hits = P2_KEYWORDS.filter((kw) => lower.includes(kw.toLowerCase()));
  if (p2Hits.length > 0) {
    return { priority: "P2", matched: p2Hits };
  }

  return { priority: null, matched: [] };
}
