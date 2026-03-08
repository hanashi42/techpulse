# Polaris Breaking News Alerts

## Goal

Get notified about major world events within 2-8 minutes of first reports — faster than most people scrolling social media.

## Architecture

```
Hetzner VPS (~€3.29/mo)
├── cron: */5 * * * *
├── Node.js script: fetch-breaking.ts
├── SQLite: seen URLs + event dedup
├── ntfy.sh: push notifications
└── git push breaking.json → Vercel deploy
```

## Breaking News Sources

Wire services and fast-updating feeds, chosen for speed:

| Source | Feed URL | Why |
|--------|----------|-----|
| Reuters World | `https://www.reutersagency.com/feed/` | Wire service, news origin |
| AP News | `https://rsshub.app/apnews/topics/world-news` | Wire service |
| BBC Breaking | `https://feeds.bbci.co.uk/news/world/rss.xml` | Fast breaking coverage |
| Al Jazeera | `https://www.aljazeera.com/xml/rss/all.xml` | Middle East/global conflicts |
| r/worldnews rising | Reddit JSON API | Crowd-sourced fast signal |
| Bernama | existing source | Malaysia local emergencies |
| USGS Earthquakes | `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_month.geojson` | Authoritative seismic data |

## Keyword Scoring System

Pure rule-based, no AI. Three priority levels:

### P0 — Immediate push (any single match)

These phrases are unambiguous. One match = push immediately.

```
# War & military
"declares war", "declaration of war", "nuclear strike", "nuclear attack",
"nuclear launch", "invades ", "invasion of", "bombs ", "bombing of",
"airstrikes on", "air strikes on", "missile strike", "missiles launched",
"ground offensive", "troops enter", "shots fired at",
"opens fire on", "shells ", "torpedoes ",

# WMD / nuclear
"nuclear detonation", "nuclear test", "mushroom cloud",
"chemical attack", "chemical weapons", "biological attack",
"dirty bomb", "radiation leak", "meltdown at",

# Political crisis
"coup d'état", "coup attempt", "military coup", "martial law declared",
"state of emergency declared", "assassination of", "assassinated",
"president killed", "prime minister killed", "leader killed",
"government overthrown", "parliament stormed", "capitol stormed",

# Natural disasters
"tsunami warning", "tsunami hits", "tsunami strikes",
"earthquake magnitude 7", "earthquake magnitude 8", "earthquake magnitude 9",
"volcanic eruption", "supervolcano",
"category 5 hurricane", "category 5 typhoon", "super typhoon",

# Terror
"terrorist attack", "terror attack", "mass shooting",
"bomb explodes in", "explosion in",

# Malaysia specific
"darurat", "perintah berkurung", "banjir besar",
"emergency declared in malaysia", "flood emergency",
"malaysia earthquake", "tsunami malaysia"
```

### P1 — Combination match (keyword + context = push)

These words alone are too common. Need a second signal.

```
# keyword + must appear with one of context words

"attack":     + [country name, city name, "military", "civilian", "embassy", "base"]
"earthquake": + ["magnitude", "killed", "casualties", "collapsed", "devastat"]
"explosion":  + ["killed", "casualties", "downtown", "embassy", "airport", "government"]
"crash":      + ["stock market", "dow", "nasdaq", "s&p", "index", "plunge", "circuit breaker"]
"sanctions":  + ["war", "nuclear", "invasion", "unprecedented"]
"evacuate":   + ["embassy", "war zone", "citizens", "nationals"]
"shot down":  + ["aircraft", "plane", "jet", "helicopter", "drone"]
"sinks":      + ["warship", "submarine", "navy", "vessel"]
"seize":      + ["territory", "city", "capital", "port", "airport"]
"blockade":   + ["naval", "port", "strait", "shipping"]
"collapses":  + ["building", "bridge", "dam", "mine", "government"]
"pandemic":   + ["WHO", "emergency", "outbreak", "lockdown"]
```

### P2 — Multi-source confirmation (>=3 sources in 15 min = push)

For generic breaking-news language that's too noisy alone:

```
"breaking:", "breaking news", "just in", "urgent",
"developing:", "alert:", "flash:"
```

If 3+ different sources use these about the same topic within 15 minutes, it's real.

### Topic clustering for P2

Simple: extract top 3 non-stopword nouns from headline, if 3+ headlines share 2+ nouns → same topic → push.

## Dedup

- SQLite table: `seen_urls(url_hash TEXT PRIMARY KEY, title TEXT, pushed_at TEXT)`
- Before push: check if same event already pushed (fuzzy title match — share 3+ significant words with any item pushed in last 2 hours → skip)
- Retention: 30 days, auto-cleanup

## Push Format (ntfy)

```
Title: 🔴 [P0] Iran launches missile strikes on Israel
Body:  Reuters · 3 sources reporting
       https://reuters.com/article/...
Tags:  breaking, war
Priority: urgent (P0) / high (P1) / default (P2)
```

ntfy supports priority levels → P0 gets urgent sound, P1 gets normal notification, P2 gets silent.

## Web UI

Polaris dashboard: red "Breaking" bar at top when there are items < 24h old.

```
data/breaking.json
{
  "items": [
    {
      "title": "Iran launches missile strikes on Israel",
      "url": "https://...",
      "sources": ["reuters", "bbc", "aljazeera"],
      "priority": "P0",
      "matchedKeywords": ["missile strike"],
      "firstSeen": "2026-03-07T14:23:00Z",
      "pushedAt": "2026-03-07T14:23:05Z"
    }
  ],
  "updatedAt": "2026-03-07T14:23:05Z"
}
```

VPS pushes to git → triggers Vercel deploy hook.

## VPS Setup

- Hetzner CX22 (€3.29/mo), Falkenstein or Helsinki
- Ubuntu 24.04, Node.js 20 LTS
- systemd timer or cron: `*/5 * * * *`
- SQLite for state (no external DB needed)
- Environment: `NTFY_TOPIC`, `GITHUB_TOKEN` (for pushing breaking.json)

## Cost Estimate

- Hetzner CX22: €3.29/mo
- ntfy.sh: free
- Network: negligible (tiny RSS fetches)
- **Total: ~€3.29/mo (~RM16/mo)**

## Expected Performance

- Source publishes → RSS updates: 1-3 min
- Cron interval: max 5 min
- Processing: < 10 sec
- **Total latency: 2-8 minutes from event to phone notification**
