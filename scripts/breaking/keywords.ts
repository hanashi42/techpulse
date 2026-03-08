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
  { keyword: "attack", context: ["military", "civilian", "embassy", "base", "killed", "casualties", "airstrike"] },
  { keyword: "earthquake", context: ["magnitude", "killed", "casualties", "collapsed", "devastat", "richter"] },
  { keyword: "explosion", context: ["killed", "casualties", "downtown", "embassy", "airport", "government", "bomb"] },
  { keyword: "crash", context: ["stock market", "dow", "nasdaq", "s&p", "index", "plunge", "circuit breaker", "recession"] },
  { keyword: "sanctions", context: ["war", "nuclear", "invasion", "unprecedented", "sweeping"] },
  { keyword: "evacuate", context: ["embassy", "war zone", "citizens", "nationals", "malaysia"] },
  { keyword: "shot down", context: ["aircraft", "plane", "jet", "helicopter", "drone", "missile"] },
  { keyword: "sinks", context: ["warship", "submarine", "navy", "vessel", "destroyer"] },
  { keyword: "seize", context: ["territory", "city", "capital", "port", "airport", "government"] },
  { keyword: "blockade", context: ["naval", "port", "strait", "shipping", "oil"] },
  { keyword: "collapses", context: ["building", "bridge", "dam", "mine", "government", "bank"] },
  { keyword: "pandemic", context: ["WHO", "emergency", "outbreak", "lockdown", "quarantine"] },
  { keyword: "default", context: ["sovereign", "debt", "bonds", "government", "country"] },
  { keyword: "hostage", context: ["killed", "embassy", "rescue", "crisis", "kidnap"] },
];

// P2: Need 3+ sources reporting the same story
export const P2_KEYWORDS: string[] = [
  "breaking:", "breaking news", "just in", "urgent",
  "developing:", "alert:", "flash:",
];

