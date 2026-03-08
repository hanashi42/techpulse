import { describe, it, expect } from "vitest";
import { matchKeywords } from "../matcher";

describe("matchKeywords", () => {
  // P0
  it("matches P0 exact phrase", () => {
    const result = matchKeywords("Iran declares war on Israel");
    expect(result.priority).toBe("P0");
    expect(result.matched).toContain("declares war");
  });

  it("matches P0 case-insensitive", () => {
    const result = matchKeywords("TSUNAMI WARNING issued for Pacific coast");
    expect(result.priority).toBe("P0");
  });

  it("matches P0 ceasefire", () => {
    const result = matchKeywords(
      "Ceasefire declared in Gaza after 6 months of war"
    );
    expect(result.priority).toBe("P0");
    expect(result.matched).toContain("ceasefire declared");
  });

  // P1
  it("matches P1 keyword + context", () => {
    const result = matchKeywords(
      "Massive explosion in downtown Beirut, 50 killed"
    );
    expect(result.priority).toBe("P1");
    expect(result.matched.length).toBeGreaterThan(0);
  });

  it("does NOT match P1 keyword without context", () => {
    const result = matchKeywords("App crash landing for SpaceX fans");
    expect(result.priority).toBeNull();
  });

  // P2
  it("matches P2 generic breaking language", () => {
    const result = matchKeywords("BREAKING: Major announcement expected");
    expect(result.priority).toBe("P2");
  });

  // No match
  it("returns null for normal news", () => {
    const result = matchKeywords("Malaysia PM visits new highway in Penang");
    expect(result.priority).toBeNull();
  });
});
