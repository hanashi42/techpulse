import type { NewsItem, Category } from "../src/lib/types";

const API_URL = "https://api.siliconflow.com/v1/chat/completions";
const MODEL = "deepseek-ai/DeepSeek-V3";
const BATCH_SIZE = 15;
const MAX_CONCURRENT = 3;

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface SummaryResult {
  id: string;
  summary: string;
}

async function callSiliconFlow(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.SILICONFLOW_API_KEY;
  if (!apiKey) throw new Error("SILICONFLOW_API_KEY not set");

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.3,
      max_tokens: 2048,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SiliconFlow API ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

async function summarizeBatch(items: NewsItem[]): Promise<SummaryResult[]> {
  const numbered = items
    .map((item, i) => `[${i + 1}] ${item.title}${item.description ? ` — ${item.description}` : ""}`)
    .join("\n");

  const content = await callSiliconFlow([
    {
      role: "system",
      content:
        "你是新闻摘要助手。用中文为每条新闻写1-2句简洁摘要，帮助读者快速理解要点。直接输出摘要，不要加多余解释。",
    },
    {
      role: "user",
      content: `为以下${items.length}条新闻各写一句中文摘要。格式：每行 [编号] 摘要\n\n${numbered}`,
    },
  ]);

  const results: SummaryResult[] = [];
  const lines = content.split("\n").filter((l) => l.trim());

  for (const line of lines) {
    const match = line.match(/^\[(\d+)\]\s*(.+)/);
    if (match) {
      const idx = parseInt(match[1]) - 1;
      if (idx >= 0 && idx < items.length) {
        results.push({ id: items[idx].id, summary: match[2].trim() });
      }
    }
  }

  return results;
}

export async function summarizeAll(
  items: NewsItem[]
): Promise<Map<string, string>> {
  const summaryMap = new Map<string, string>();
  if (!process.env.SILICONFLOW_API_KEY) return summaryMap;

  // Split into batches
  const batches: NewsItem[][] = [];
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    batches.push(items.slice(i, i + BATCH_SIZE));
  }

  console.log(
    `  Summarizing ${items.length} items in ${batches.length} batches...`
  );

  // Process batches with concurrency limit
  for (let i = 0; i < batches.length; i += MAX_CONCURRENT) {
    const chunk = batches.slice(i, i + MAX_CONCURRENT);
    const results = await Promise.allSettled(chunk.map(summarizeBatch));

    for (const r of results) {
      if (r.status === "fulfilled") {
        for (const { id, summary } of r.value) {
          summaryMap.set(id, summary);
        }
      } else {
        console.error("  Batch failed:", r.reason);
      }
    }
  }

  console.log(`  Got ${summaryMap.size}/${items.length} summaries`);
  return summaryMap;
}

export async function generateBriefing(
  items: NewsItem[]
): Promise<string | undefined> {
  if (!process.env.SILICONFLOW_API_KEY) return undefined;

  const categories: Category[] = ["tech", "malaysia", "world", "money", "life", "forme"];
  const categoryLabels: Record<Category, string> = {
    tech: "科技",
    malaysia: "马来西亚",
    world: "国际",
    money: "财经",
    life: "生活",
    forme: "与我相关",
  };

  // Top 5 per category by score
  const topItems: string[] = [];
  for (const cat of categories) {
    const catItems = items
      .filter((i) => i.category === cat)
      .slice(0, 5);
    if (catItems.length > 0) {
      topItems.push(
        `【${categoryLabels[cat]}】\n${catItems.map((i) => `- ${i.title}`).join("\n")}`
      );
    }
  }

  if (topItems.length === 0) return undefined;

  console.log("  Generating daily briefing...");

  try {
    const briefing = await callSiliconFlow([
      {
        role: "system",
        content:
          "你是每日新闻简报助手。用中文写一段150字左右的今日要点总结，涵盖所有类别的重要趋势和事件。语气简洁有力，像给朋友快速概括今天发生了什么。",
      },
      {
        role: "user",
        content: `根据以下今日头条新闻，写一段"今日要点"简报：\n\n${topItems.join("\n\n")}`,
      },
    ]);

    console.log("  Briefing generated");
    return briefing.trim();
  } catch (err) {
    console.error("  Briefing generation failed:", err);
    return undefined;
  }
}
