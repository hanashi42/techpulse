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
      max_tokens: 4096,
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
        "你是新闻摘要助手。用中文写摘要，核心原则：提供标题之外的信息增量。\n\n规则：\n- 提取标题没说的关键细节：具体数字、涉及方、时间、原因、影响范围\n- 如果新闻有实际影响（政策变化、价格变动、截止日期），直接点出\n- 标题已经说清楚的事不要重复\n- 不要硬凑「对XX的影响」——没有就不写\n- 一句话能说清就不写两句，最多两句，总共不超过50字",
    },
    {
      role: "user",
      content: `为以下${items.length}条新闻各写摘要。格式：每行 [编号] 摘要\n\n${numbered}`,
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

const CATEGORIES: Category[] = ["tech", "malaysia", "world", "money", "life", "forme"];
const CATEGORY_LABELS: Record<Category, string> = {
  tech: "科技",
  malaysia: "马来西亚",
  world: "国际",
  money: "财经",
  life: "生活",
  forme: "与我相关",
};

function buildCategoryBlock(items: NewsItem[], cat: Category): string | null {
  const catItems = items.filter((i) => i.category === cat).slice(0, 5);
  if (catItems.length === 0) return null;
  return `【${CATEGORY_LABELS[cat]}】\n${catItems.map((i) => `- ${i.title}`).join("\n")}`;
}

export async function generateBriefing(
  items: NewsItem[]
): Promise<{ overall?: string; perCategory: Partial<Record<Category, string>> }> {
  const result: { overall?: string; perCategory: Partial<Record<Category, string>> } = {
    perCategory: {},
  };
  if (!process.env.SILICONFLOW_API_KEY) return result;

  // Build top items per category
  const topItems: string[] = [];
  for (const cat of CATEGORIES) {
    const block = buildCategoryBlock(items, cat);
    if (block) topItems.push(block);
  }

  if (topItems.length === 0) return result;

  console.log("  Generating briefings (overall + per-category)...");

  // Generate overall + per-category in one call
  try {
    const content = await callSiliconFlow([
      {
        role: "system",
        content:
          "你是每日新闻分析助手。\n\n请输出两部分：\n\n第一部分【今日要点】：150字，把今天最值得知道的事串起来讲，像跟朋友聊天。\n\n第二部分：每个板块写2-3句要点（50-80字）。聚焦：\n- 这几条放一起看，说明什么趋势或规律\n- 有实际影响的（政策、价格、截止日期）直接点出\n- 没有明显关联就挑最重要的1-2条讲透\n- 不要硬凑「对XX的影响」\n\n格式：\n【今日要点】\n总结内容\n\n【科技要点】\n分析内容\n\n【马来西亚要点】\n分析内容\n\n（以此类推每个有内容的板块）\n\n语气简洁有力，像给朋友分析今天发生了什么。",
      },
      {
        role: "user",
        content: `根据以下今日新闻，生成要点分析：\n\n${topItems.join("\n\n")}`,
      },
    ]);

    // Parse sections
    const sections = content.split(/【(.+?)】/).filter((s) => s.trim());

    for (let i = 0; i < sections.length - 1; i += 2) {
      const header = sections[i].trim();
      const body = sections[i + 1].trim();

      if (header === "今日要点") {
        result.overall = body;
      } else {
        // Match header to category
        for (const cat of CATEGORIES) {
          if (header.includes(CATEGORY_LABELS[cat])) {
            result.perCategory[cat] = body;
            break;
          }
        }
      }
    }

    const catCount = Object.keys(result.perCategory).length;
    console.log(`  Briefings generated (overall + ${catCount} categories)`);
  } catch (err) {
    console.error("  Briefing generation failed:", err);
  }

  return result;
}
