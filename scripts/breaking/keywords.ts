// P0: Immediate push, any single match
export const P0_KEYWORDS: string[] = [
  // War and military
  "declares war", "declaration of war", "nuclear strike", "nuclear attack",
  "nuclear launch", "invades ", "invasion of", "bombs ", "bombing of",
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
  "strait of hormuz closed", "suez canal blocked",
  "fed emergency", "emergency rate cut", "emergency rate hike",

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
  { keyword: "collapses", context: ["building", "bridge", "dam", "mine", "government", "bank"] },
  { keyword: "pandemic", context: ["WHO", "emergency", "outbreak", "lockdown", "quarantine"] },
  { keyword: "default", context: ["sovereign", "debt", "bonds", "government", "country"] },
  { keyword: "hostage", context: ["killed", "embassy", "rescue", "crisis", "kidnap"] },

  // Markets & economy
  { keyword: "crash", context: ["stock market", "dow", "nasdaq", "s&p", "index", "plunge", "circuit breaker", "recession", "wall street", "nikkei", "ftse"] },
  { keyword: "plunge", context: ["stock", "market", "index", "oil", "crude", "dow", "nasdaq", "shares", "currency", "ringgit"] },
  { keyword: "surge", context: ["oil price", "crude oil", "gold price", "inflation", "bond yield", "interest rate"] },
  { keyword: "soar", context: ["oil", "gold", "inflation", "commodity", "price"] },
  { keyword: "rate cut", context: ["fed", "ecb", "bank of japan", "central bank", "emergency", "basis points", "surprise"] },
  { keyword: "rate hike", context: ["fed", "ecb", "bank of japan", "central bank", "emergency", "basis points", "surprise"] },
  { keyword: "tariff", context: ["new", "impose", "retaliat", "trade war", "china", "europe", "25%", "50%", "100%"] },
  { keyword: "recession", context: ["official", "confirm", "enter", "gdp", "contract", "quarter", "economy"] },
  { keyword: "bailout", context: ["bank", "government", "billion", "trillion", "financial", "rescue"] },
  { keyword: "bankrupt", context: ["bank", "airline", "company", "billion", "giant", "major", "largest"] },
  { keyword: "layoff", context: ["thousand", "10,000", "20,000", "50,000", "mass", "google", "meta", "amazon", "microsoft", "apple"] },
  { keyword: "oil price", context: ["surge", "plunge", "crash", "record", "spike", "barrel", "jump", "drop"] },
  { keyword: "gold price", context: ["record", "surge", "all-time", "high", "spike"] },
  { keyword: "inflation", context: ["record", "highest", "spike", "surge", "unexpected", "cpi"] },
  { keyword: "embargo", context: ["oil", "trade", "export", "import", "ban", "energy"] },
  { keyword: "trade war", context: ["china", "us", "europe", "tariff", "retaliat", "escalat"] },

  // Supply chain / energy
  { keyword: "shutdown", context: ["pipeline", "refinery", "port", "shipping", "supply chain", "grid", "power"] },
  { keyword: "disruption", context: ["supply chain", "shipping", "oil", "gas", "semiconductor", "chip", "global"] },
];

// P2: Need 3+ sources reporting the same story
export const P2_KEYWORDS: string[] = [
  "breaking:", "breaking news", "just in", "urgent",
  "developing:", "alert:", "flash:",
];

