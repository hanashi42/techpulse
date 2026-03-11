import type { Category } from "./types";

const TECH_KEYWORDS = [
  "llm", "gpt", "llama", "mistral", "claude", "gemini", "deepseek",
  "transformer", "diffusion", "stable diffusion", "midjourney",
  "fine-tune", "finetune", "lora", "qlora", "gguf", "ggml",
  "ollama", "vllm", "mlx", "whisper", "tts", "stt",
  "machine learning", "deep learning", "neural", "ai model",
  "langchain", "rag", "vector", "embedding", "tokenizer",
  "chatbot", "copilot", "agent", "agentic",
  "open-source model", "open source model", "local model",
  "inference", "quantiz", "benchmark",
  "comfyui", "automatic1111", "imagen", "sora", "flux",
  "cli", "terminal", "editor", " ide ", "vscode", "neovim", "vim",
  "docker", "kubernetes", "k8s", "devops", "ci/cd",
  "database", "postgres", "sqlite", "redis",
  "api", "sdk", "framework", "library",
  "rust", "golang", "typescript", "python",
  "shell", "bash", "zsh", "debug", "test", "lint",
  "open source", "github", "repo", "saas", "startup",
  "product hunt", "launch", "developer",
];

const MALAYSIA_KEYWORDS = [
  "malaysia", "malaysian", "kuala lumpur", "kl", "putrajaya",
  "anwar", "pm ", "prime minister", "parliament", "dewan rakyat",
  "ringgit", "myr", "bnm", "bank negara",
  "penang", "johor", "sabah", "sarawak", "selangor",
  "malay", "bumiputera", "umno", "pas ", "dap ", "pkr",
  "madani", "unity government",
  "proton", "petronas", "maybank", "tnb",
  "spm", "stpm", "muet", "matriculation",
];

const WORLD_KEYWORDS = [
  "ukraine", "russia", "china", "taiwan", "gaza", "israel",
  "trump", "biden", "eu ", "nato", "un ",
  "war", "conflict", "sanction", "diplomacy", "summit",
  "geopolit", "foreign policy", "trade war",
  "asean", "southeast asia", "indo-pacific",
  "climate", "cop2", "emission",
  "election", "referendum", "protest",
  "north korea", "iran", "saudi",
];

const MONEY_KEYWORDS = [
  "invest", "stock", "bond", "etf", "mutual fund",
  "property", "real estate", "mortgage", "housing",
  "inflation", "interest rate", "gdp", "recession",
  "crypto", "bitcoin", "ethereum",
  "bank", "loan", "credit", "debt",
  "retire", "epf", "kwsp", "dividend",
  "budget", "tax", "income tax", "gst", "sst",
  "financial", "economy", "fiscal",
  "savings", "personal finance", "money",
  "fintech", "payment", "ewallet",
];

const LIFE_KEYWORDS = [
  "health", "mental health", "wellness", "fitness", "exercise",
  "food", "recipe", "restaurant", "cafe", "cuisine",
  "travel", "vacation", "tourism", "hotel",
  "book", "reading", "podcast", "documentary",
  "culture", "art", "music", "film", "movie",
  "lifestyle", "productivity", "habit",
  "relationship", "family", "parenting",
  "fashion", "design", "architecture",
];

const FORME_KEYWORDS = [
  // 税务
  "lhdn", "income tax", "cukai", "e-filing", "tax deadline", "tax relief",
  "form be", "form b", "pcb",
  // 社保/公积金
  "epf", "kwsp", "socso", "perkeso", "i-saraan", "i-suri",
  // 生活成本
  "tariff", "utility bill", "electricity rate", "water rate",
  "toll", "petrol price", "ron95", "ron97", "diesel",
  "minimum wage", "gaji minimum",
  // 政策法规
  "new regulation", "peraturan baru", "prepaid", "sim card registration",
  "driving license", "road tax", "jpj", "immigration",
  // 诈骗
  "scam", "penipuan", "phishing", "fraud", "love scam", "macau scam",
  // 自由职业
  "freelance", "gig economy", "remote work", "work from home",
  "self-employed", "sole proprietor",
  // 政府援助
  "bantuan", "subsidi", "stkm", "bkm", "rahmah", "madani",
  // 交通/假期
  "public holiday", "cuti umum", "balik kampung", "traffic jam",
  // 优惠促销
  "promo code", "voucher code", "free delivery", "cashback",
  "warehouse sale", "clearance sale", "buy 1 free 1",
  "shopee sale", "lazada sale",
  // 诈骗补充
  "online scam", "scam alert", "investment scam", "job scam",
  "parcel scam", "phone scam",
  // 流浪猫/动物
  "stray cat", "stray dog", "tnr", "trap neuter",
  "animal shelter", "pet adoption", "spca",
  // 日语/翻译
  "japanese translator", "translation job", "jlpt",
  "japanese language", "nihongo",
  // 加密货币
  "luno", "cryptocurrency malaysia", "digital asset",
  "securities commission crypto",
  // 天气预警
  "flood warning", "amaran banjir", "severe weather",
  "weather warning", "metmalaysia", "thunderstorm warning",
  "heavy rain", "landslide", "hujan lebat",
  // 机票/旅行
  "flight deal", "airasia promo", "cheap flight",
  "travel deal", "free seat",
  // Claude/Anthropic 优惠
  "claude pro", "claude max", "claude free", "claude trial",
  "claude pricing", "claude plan", "claude credit",
  "anthropic credit", "anthropic discount", "anthropic pricing",
  "free credits", "free tier", "student discount",
  "price drop", "price cut", "price increase",
  "50% off", "half price", "limited time offer",
  "usage credit", "bonus credit", "free usage", "api credit",
  // 加密货币补充
  "polymarket", "prediction market", "binance",
  "token", "defi", "nft", "web3", "stablecoin",
  "crypto regulation", "digital asset exchange",
  // 流浪动物补充
  "free spay", "free neuter", "vaccination drive",
  "animal rescue", "animal abuse", "pet abandonment",
  "low cost vet", "affordable vet",
  // 诈骗补充
  "data breach", "data leak", "identity theft",
  "ransomware", "cybersecurity", "cyber attack",
  "bank fraud", "atm scam", "qr scam",
];

function matchesKeywords(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  return keywords.filter((kw) => lower.includes(kw)).length;
}

export function categorize(
  title: string,
  description?: string,
  defaultCategory: Category = "tech",
): Category {
  const text = `${title} ${description ?? ""}`;

  const scores: Record<Category, number> = {
    tech: matchesKeywords(text, TECH_KEYWORDS),
    malaysia: matchesKeywords(text, MALAYSIA_KEYWORDS),
    world: matchesKeywords(text, WORLD_KEYWORDS),
    money: matchesKeywords(text, MONEY_KEYWORDS),
    life: matchesKeywords(text, LIFE_KEYWORDS),
    forme: matchesKeywords(text, FORME_KEYWORDS),
  };

  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];

  // Only override source hint when keyword signal is strong (>= 3 matches)
  if (best[1] >= 3) return best[0] as Category;
  if (best[1] === 0) return defaultCategory;

  // Weak signal (1-2 matches): prefer source hint if it also scored
  if (scores[defaultCategory] > 0) return defaultCategory;
  return best[0] as Category;
}
