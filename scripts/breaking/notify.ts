import type { BreakingItem, Priority } from "./types";

const NTFY_BASE = "https://ntfy.sh";

const PRIORITY_MAP: Record<Priority, string> = {
  P0: "urgent",
  P1: "high",
  P2: "default",
};

const TAG_MAP: Record<Priority, string> = {
  P0: "rotating_light",
  P1: "warning",
  P2: "newspaper",
};

export async function pushNotification(item: BreakingItem): Promise<boolean> {
  const topic = process.env.NTFY_TOPIC || "polaris-breaking";
  const url = `${NTFY_BASE}/${topic}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Title: `[${item.priority}] ${item.title}`.slice(0, 256),
        Priority: PRIORITY_MAP[item.priority],
        Tags: TAG_MAP[item.priority],
        Click: item.url,
      },
      body: `${item.source} | ${item.matchedKeywords.join(", ")}`,
    });

    if (!res.ok) {
      console.error(`[breaking] ntfy push failed: ${res.status} ${res.statusText}`);
      return false;
    }

    console.log(`[breaking] Pushed ${item.priority}: ${item.title.slice(0, 60)}...`);
    return true;
  } catch (err) {
    console.error(`[breaking] ntfy push error:`, (err as Error).message);
    return false;
  }
}
