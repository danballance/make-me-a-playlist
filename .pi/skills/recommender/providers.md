# Search Providers

The recommender has four search providers and one metadata enricher. Each provider is an independent module under `recommender/sources/providers/`. They all expose the same async interface and normalise results into the shared `VideoResult` type.

## Common interface

Every search provider implements:

```python
async def search(query: str, count: int = 20) -> list[VideoResult]
```

Every provider also exposes:

```python
def parse_response(data: dict) -> list[VideoResult]   # or parse_results for Exa
```

`parse_response` / `parse_results` takes the raw API response dict (or list of SDK objects for Exa) and returns filtered, normalised `VideoResult` objects. It is the unit-tested surface — `search` is the thin async HTTP wrapper around it.

Filtering applied by every provider before returning:
- URLs matching `youtube.com/shorts/` are dropped (via `extract_video_id`)
- Results where `duration_secs < 120` are dropped (via `VideoResult.is_short()`)
- Non-YouTube URLs are dropped (no valid video ID extracted)

---

## Serper

**File:** `recommender/sources/providers/serper.py`
**What it is:** Google Video SERP results via [serper.dev](https://serper.dev). Returns what Google shows in its Videos tab — heavily YouTube-weighted.

**Endpoint:** `POST https://google.serper.dev/videos`
**Auth:** `X-API-KEY` header (`SERPER_API_KEY`)

**Raw response shape:**
```json
{
  "videos": [
    {
      "title": "...",
      "link": "https://www.youtube.com/watch?v=...",
      "channel": "Channel Name",
      "duration": "45:12",
      "views": "1,234,567 views",
      "date": "3 years ago",
      "imageUrl": "https://..."
    }
  ]
}
```

**Field notes:**
- `duration` is a `MM:SS` or `H:MM:SS` string — parsed to seconds by `parse_duration_to_secs`
- `views` is a human-formatted string like `"1,234,567 views"` — digits are extracted with a regex
- `date` is relative text like `"3 years ago"` — stored as-is in `published_at`

**Characteristics:** Fast (1–2s), cheap ($1/1K queries), strong for popular/trending YouTube content. Reflects Google's own ranking, so tends toward high-view mainstream results.

---

## SerpAPI (YouTube engine)

**File:** `recommender/sources/providers/serpapi.py`
**What it is:** [SerpAPI](https://serpapi.com) with `engine=youtube`, which searches *within YouTube's own index* rather than Google's Video tab. Returns different results from Serper despite both being Google-adjacent.

**Endpoint:** `GET https://serpapi.com/search`
**Params:** `engine=youtube`, `search_query`, `api_key`, `num`
**Auth:** `api_key` query param (`SERP_API_KEY`)

**Raw response shape:**
```json
{
  "video_results": [
    {
      "title": "...",
      "link": "https://www.youtube.com/watch?v=...",
      "channel": { "name": "Channel Name", "link": "https://..." },
      "views": 87432,
      "length": "1:02:14",
      "published_date": "2 years ago",
      "thumbnail": { "static": "https://..." }
    }
  ]
}
```

**Field notes:**
- `length` is a `H:MM:SS` / `MM:SS` string
- `views` is an integer (unlike Serper's string)
- `channel` is a nested object — `channel.name` is extracted
- `thumbnail.static` gives the thumbnail URL

**Characteristics:** Up to 20 results per call. Slower than Serper (~3–5s). Reflects YouTube's own search ranking rather than Google's, which surfaces somewhat different content — useful for comparison.

---

## Brave

**File:** `recommender/sources/providers/brave.py`
**What it is:** [Brave Search](https://api.search.brave.com) video endpoint, which queries Brave's independent index (not Google). The most interesting source for finding non-mainstream content.

**Endpoint:** `GET https://api.search.brave.com/res/v1/videos/search`
**Params:** `q`, `count` (max 50)
**Auth:** `X-Subscription-Token` header (`BRAVE_API_KEY`)

**Raw response shape:**
```json
{
  "results": [
    {
      "title": "...",
      "url": "https://www.youtube.com/watch?v=...",
      "duration": "PT52M30S",
      "view_count": 45200,
      "author": "Channel Name",
      "published": "2019-06-01T00:00:00Z",
      "thumbnail": { "src": "https://..." }
    }
  ]
}
```

**Field notes:**
- `duration` is ISO 8601 (`PT1H10M25S`) but may also arrive as an integer seconds value — `parse_duration_to_secs` handles both
- `published` is a full ISO 8601 datetime string — the most precise date of any provider
- `view_count` is an integer
- `author` maps to channel name

**Characteristics:** Independent index means genuinely different results from Serper/SerpAPI. Good at surfacing older and less-viewed content. Up to 50 results per call. Returns view counts and precise publish dates which are useful for filtering.

---

## Exa

**File:** `recommender/sources/providers/exa.py`
**What it is:** [Exa](https://exa.ai) neural/embedding-based search, restricted to `youtube.com`. Finds videos by semantic meaning rather than keyword matching — can surface content that traditional search would miss entirely.

**SDK:** `exa-py`
**Auth:** SDK init with `EXA_API_KEY`

**Call pattern:**
```python
_client.search(
    query,
    include_domains=["youtube.com"],
    num_results=count,
    type="neural",
)
```

The SDK is synchronous — the `search` coroutine wraps it in `asyncio.get_event_loop().run_in_executor` to avoid blocking.

**Filtering:** Exa returns any `youtube.com` URL (channel pages, playlists, Shorts). Only `youtube.com/watch?v=` URLs with a valid video ID are kept.

**Field notes:**
- `duration_secs` is always `None` — Exa does not return video duration
- `view_count` is always `None` — Exa does not return view counts
- `thumbnail_url` is always `None`
- `author` (mapped to channel) and `published_date` are available but sparse on some results

**Enrichment:** Because Exa results lack duration, they are the primary target for Supadata enrichment after deduplication. Results that turn out to be Shorts (duration < 120s) are dropped at that stage.

**Characteristics:** The semantic wildcard — finds videos that are conceptually relevant but wouldn't match keyword searches. Metadata sparsity is a known limitation; the URLs themselves are the valuable output.

---

## Supadata (enricher)

**File:** `recommender/sources/providers/supadata.py`
**What it is:** [Supadata](https://supadata.ai) YouTube metadata API. Not a search provider — it enriches existing `VideoResult` objects that are missing `duration_secs` or `view_count`, primarily Exa results.

**Endpoint:** `GET https://api.supadata.ai/v1/youtube/video`
**Params:** `videoId`
**Auth:** `x-api-key` header (`SUPADATA_API_KEY`)

**Interface:**

```python
async def enrich(results: list[VideoResult]) -> list[VideoResult]
```

Called by the runner after deduplication. Only calls the API for results where `duration_secs is None`. Failures are silently swallowed — enrichment is best-effort and a single API error does not affect the rest of the run.

After enrichment, a final Shorts filter is applied: any result where the now-known `duration_secs < 120` is dropped.

**What it returns:** The enriched Supadata response fills `duration_secs` (from `data["duration"]`, integer seconds) and `view_count` (from `data["views"]`, integer) where missing.

---

## VideoResult model

All providers normalise to this dataclass (`recommender/sources/models.py`):

```python
@dataclass
class VideoResult:
    video_id: str           # YouTube video ID, e.g. "dQw4w9WgXcQ"
    url: str                # canonical https://www.youtube.com/watch?v=<id>
    title: str
    channel: str
    source: Source          # SERPER | SERPAPI | BRAVE | EXA
    duration_secs: int | None
    view_count: int | None
    published_at: str | None   # provider-formatted; no standard format across providers
    thumbnail_url: str | None
```

**`Source` enum values:** `"serper"`, `"serpapi"`, `"brave"`, `"exa"`

**Helper functions:**

`extract_video_id(url: str) -> str | None`
Extracts the video ID from `youtube.com/watch?v=`, `youtu.be/`, and standard watch URLs. Returns `None` for Shorts, channel pages, playlists, and non-YouTube URLs.

`parse_duration_to_secs(value: str | int | None) -> int | None`
Accepts `"MM:SS"`, `"H:MM:SS"`, ISO 8601 `"PT1H10M25S"`, or a raw integer. Returns total seconds or `None`.

---

## Duration field coverage by provider

| Provider | Duration returned? | Format |
|----------|-------------------|--------|
| Serper | Yes (usually) | `"MM:SS"` string |
| SerpAPI | Yes (usually) | `"H:MM:SS"` string |
| Brave | Yes | ISO 8601 or integer seconds |
| Exa | No | Always `None` → enriched via Supadata |
| Supadata | Yes | Integer seconds |
