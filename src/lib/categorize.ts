import type { Category } from "./types";

const AI_KEYWORDS = [
  "llm", "gpt", "llama", "mistral", "claude", "gemini", "deepseek",
  "transformer", "diffusion", "stable diffusion", "midjourney",
  "fine-tune", "finetune", "fine tune", "lora", "qlora", "gguf", "ggml",
  "ollama", "vllm", "mlx", "whisper", "tts", "stt",
  "machine learning", "deep learning", "neural", "ai model",
  "langchain", "rag", "vector", "embedding", "tokenizer",
  "chatbot", "copilot", "agent", "agentic",
  "open-source model", "open source model", "local model",
  "inference", "quantiz", "benchmark",
  "comfyui", "automatic1111", "imagen", "sora", "flux",
];

const TOOL_KEYWORDS = [
  "cli", "terminal", "editor", "ide", "vscode", "neovim", "vim",
  "docker", "kubernetes", "k8s", "devops", "ci/cd",
  "database", "postgres", "sqlite", "redis",
  "api", "sdk", "framework", "library",
  "rust", "go ", "golang", "typescript", "python",
  "performance", "benchmark", "profil",
  "shell", "bash", "zsh",
  "debug", "test", "lint",
];

const PRODUCT_KEYWORDS = [
  "launch", "product hunt", "saas", "startup",
  "app", "platform", "service", "pricing",
  "beta", "waitlist", "early access",
];

function matchesKeywords(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  return keywords.filter((kw) => lower.includes(kw)).length;
}

export function categorize(title: string, description?: string): Category {
  const text = `${title} ${description ?? ""}`;

  const scores: Record<Category, number> = {
    ai: matchesKeywords(text, AI_KEYWORDS),
    tools: matchesKeywords(text, TOOL_KEYWORDS),
    product: matchesKeywords(text, PRODUCT_KEYWORDS),
    opensource: 0,
  };

  // GitHub source items with "star" or "open source" lean opensource
  if (/open.?source|github|repo/i.test(text)) {
    scores.opensource += 2;
  }

  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  if (best[1] === 0) return "tools"; // default category
  return best[0] as Category;
}
