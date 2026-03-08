// P0: Immediate push, any single match
export const P0_KEYWORDS: string[] = [
  // War and military
  "declares war", "declaration of war", "nuclear strike", "nuclear attack",
  "nuclear launch", "invades ", "invasion of", "bombs", "bombing of",
  "airstrikes on", "air strikes on", "missile strike", "missiles launched",
  "ground offensive", "troops enter", "shots fired at",
  "opens fire on",

  // Peace / diplomacy
  "ceasefire declared", "ceasefire agreement", "peace deal signed",
  "surrender", "unconditional surrender", "capitulates",
  "war ends", "conflict ends", "truce declared",
  "peace treaty", "armistice signed",

  // WMD / nuclear
  "nuclear detonation", "nuclear test", "mushroom cloud",
  "chemical attack", "chemical weapons", "biological attack",
  "dirty bomb", "radiation leak", "meltdown at",

  // Political crisis
  "coup d'etat", "coup attempt", "military coup", "martial law declared",
  "state of emergency declared", "assassination of", "assassinated",
  "president killed", "prime minister killed", "leader killed",
  "government overthrown", "parliament stormed", "capitol stormed",

  // Natural disasters
  "tsunami warning", "tsunami hits", "tsunami strikes",
  "magnitude 7", "magnitude 8", "magnitude 9",
  "volcanic eruption", "supervolcano",
  "category 5 hurricane", "category 5 typhoon", "super typhoon",

  // Terror
  "terrorist attack", "terror attack", "mass shooting",

  // Markets & economy — immediate impact
  "circuit breaker", "trading halted", "market halted",
  "flash crash", "black monday", "black swan",
  "currency crisis", "bank run", "bank collapse",
  "lehman moment", "sovereign default",
  "oil embargo", "opec emergency", "oil shock",
  "suez canal blocked",
  "fed emergency", "emergency rate cut", "emergency rate hike",

  // China / Chinese language
  "宣战", "开战", "核打击", "核试验",
  "导弹袭击", "空袭", "入侵",
  "停火", "停战", "投降",
  "政变", "戒严", "暗杀",
  "海啸预警", "海啸", "超强台风",
  "熔断", "暴跌", "崩盘", "股灾",
  "银行挤兑", "主权违约",
  "紧急降息", "紧急加息",
  "制裁", "禁运", "贸易战",

  // Malaysia specific
  "darurat", "perintah berkurung", "banjir besar",
  "emergency declared in malaysia", "flood emergency malaysia",
  "malaysia earthquake", "tsunami malaysia",
];

// P1: Keyword + context word required
export interface P1Rule {
  keyword: string;
  context: string[];
}

export const P1_RULES: P1Rule[] = [
  // Geopolitical
  { keyword: "attack", context: ["military", "civilian", "embassy", "base", "killed", "casualties", "airstrike"] },
  { keyword: "earthquake", context: ["magnitude", "killed", "casualties", "collapsed", "devastat", "richter"] },
  { keyword: "explosion", context: ["killed", "casualties", "downtown", "embassy", "airport", "government", "bomb"] },
  { keyword: "sanctions", context: ["war", "nuclear", "invasion", "unprecedented", "sweeping", "oil", "iran", "russia", "china"] },
  { keyword: "evacuate", context: ["embassy", "war zone", "citizens", "nationals", "malaysia"] },
  { keyword: "shot down", context: ["aircraft", "plane", "jet", "helicopter", "drone", "missile"] },
  { keyword: "sinks", context: ["warship", "submarine", "navy", "vessel", "destroyer"] },
  { keyword: "seize", context: ["territory", "city", "capital", "port", "airport", "government"] },
  { keyword: "blockade", context: ["naval", "port", "strait", "shipping", "oil", "hormuz", "taiwan"] },
  { keyword: "hormuz", context: ["closed", "blocked", "attacked", "mined", "threat", "shutdown", "disruption", "naval"] },
  { keyword: "collapses", context: ["building", "bridge", "dam", "mine", "government", "bank"] },
  { keyword: "pandemic", context: ["WHO", "emergency", "outbreak", "lockdown", "quarantine"] },
  { keyword: "default", context: ["sovereign", "debt", "bonds", "government", "country"] },
  { keyword: "hostage", context: ["killed", "embassy", "rescue", "crisis", "kidnap"] },

  // Markets & economy — price moves
  { keyword: "crash", context: ["stock market", "dow", "nasdaq", "s&p", "index", "plunge", "circuit breaker", "recession", "wall street", "nikkei", "ftse"] },
  { keyword: "plunge", context: ["stock", "market", "index", "oil", "crude", "dow", "nasdaq", "shares", "currency", "ringgit", "bitcoin", "crypto"] },
  { keyword: "surge", context: ["oil", "crude", "gold", "inflation", "bond yield", "interest rate", "price", "dollar", "bitcoin"] },
  { keyword: "soar", context: ["oil", "gold", "inflation", "commodity", "price", "yield", "dollar"] },
  { keyword: "tumble", context: ["stock", "market", "shares", "index", "oil", "crypto", "currency"] },
  { keyword: "rally", context: ["stock", "market", "gold", "oil", "dollar", "bitcoin", "record"] },
  { keyword: "record high", context: ["gold", "oil", "stock", "index", "dow", "s&p", "bitcoin", "inflation", "yield"] },
  { keyword: "record low", context: ["currency", "ringgit", "yuan", "yen", "euro", "pound", "stock"] },
  { keyword: "all-time high", context: ["gold", "bitcoin", "stock", "index", "oil", "s&p", "dow"] },

  // Central banks & rates
  { keyword: "rate cut", context: ["fed", "ecb", "bank of japan", "central bank", "basis points", "surprise", "bnm", "pboc"] },
  { keyword: "rate hike", context: ["fed", "ecb", "bank of japan", "central bank", "basis points", "surprise", "bnm", "pboc"] },
  { keyword: "fed", context: ["rate", "cut", "hike", "pause", "pivot", "signal", "hawkish", "dovish", "taper", "qe", "qt"] },
  { keyword: "interest rate", context: ["cut", "hike", "hold", "surprise", "change", "decision", "unchanged"] },
  { keyword: "quantitative", context: ["easing", "tightening"] },

  // Trade & policy
  { keyword: "tariff", context: ["new", "impose", "retaliat", "trade war", "china", "europe", "25%", "50%", "100%", "trump", "raise"] },
  { keyword: "trade war", context: ["china", "us", "europe", "tariff", "retaliat", "escalat"] },
  { keyword: "embargo", context: ["oil", "trade", "export", "import", "ban", "energy"] },
  { keyword: "ban export", context: ["chip", "semiconductor", "rare earth", "oil", "gas", "mineral", "technology"] },
  { keyword: "restrict", context: ["export", "rare earth", "chip", "semiconductor", "technology", "china"] },
  { keyword: "opec", context: ["cut", "production", "output", "supply", "quota", "meeting", "agree", "barrel"] },

  // Economy
  { keyword: "recession", context: ["official", "confirm", "enter", "gdp", "contract", "quarter", "economy", "warning", "risk"] },
  { keyword: "inflation", context: ["record", "highest", "spike", "surge", "unexpected", "cpi", "rise", "fall", "slow", "accelerat"] },
  { keyword: "gdp", context: ["contract", "shrink", "growth", "slow", "surprise", "quarter", "negative"] },
  { keyword: "unemployment", context: ["surge", "rise", "spike", "record", "jump", "unexpected"] },
  { keyword: "bailout", context: ["bank", "government", "billion", "trillion", "financial", "rescue"] },
  { keyword: "bankrupt", context: ["bank", "airline", "company", "billion", "giant", "major", "largest"] },
  { keyword: "default", context: ["sovereign", "debt", "bonds", "government", "country"] },

  // Commodities & currencies
  { keyword: "oil price", context: ["surge", "plunge", "crash", "record", "spike", "barrel", "jump", "drop", "rise", "fall"] },
  { keyword: "gold price", context: ["record", "surge", "all-time", "high", "spike", "rise"] },
  { keyword: "bitcoin", context: ["crash", "surge", "plunge", "record", "all-time", "halving", "etf", "sec", "ban", "regulate"] },
  { keyword: "crypto", context: ["ban", "regulat", "crackdown", "sec", "lawsuit", "fraud", "collapse", "crash", "surge"] },
  { keyword: "stablecoin", context: ["depeg", "collapse", "crash", "regulat", "ban", "tether", "usdc"] },
  { keyword: "tether", context: ["depeg", "collapse", "redeem", "fraud", "audit", "reserve"] },
  { keyword: "ringgit", context: ["fall", "drop", "plunge", "record", "low", "weak", "surge", "strengthen"] },
  { keyword: "dollar", context: ["surge", "plunge", "record", "index", "weaken", "strengthen", "crisis"] },

  // Malaysia market
  { keyword: "bursa", context: ["crash", "plunge", "surge", "record", "halt", "circuit breaker", "tumble", "rally"] },
  { keyword: "klci", context: ["crash", "plunge", "surge", "record", "drop", "tumble", "rally", "low"] },
  { keyword: "ringgit", context: ["fall", "drop", "plunge", "record", "low", "weak", "surge", "strengthen", "crisis"] },
  { keyword: "bnm", context: ["rate", "cut", "hike", "hold", "surprise", "emergency", "decision", "opr"] },
  { keyword: "epf", context: ["withdraw", "dividend", "cut", "record", "change", "reform"] },

  // Tech & corporate
  { keyword: "layoff", context: ["thousand", "10,000", "20,000", "50,000", "mass", "google", "meta", "amazon", "microsoft", "apple", "tesla"] },
  { keyword: "antitrust", context: ["google", "meta", "apple", "amazon", "microsoft", "fine", "billion", "break up", "ruling"] },
  { keyword: "data breach", context: ["million", "billion", "bank", "government", "hack", "leaked", "exposed"] },

  // Supply chain / energy
  { keyword: "shutdown", context: ["pipeline", "refinery", "port", "shipping", "supply chain", "grid", "power"] },
  { keyword: "disruption", context: ["supply chain", "shipping", "oil", "gas", "semiconductor", "chip", "global"] },
  { keyword: "shortage", context: ["chip", "semiconductor", "oil", "gas", "energy", "food", "water", "global"] },
];

// P2: Need 3+ sources reporting the same story
export const P2_KEYWORDS: string[] = [
  "breaking:", "breaking news", "just in", "urgent",
  "developing:", "alert:", "flash:",
];

