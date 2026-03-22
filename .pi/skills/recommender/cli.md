# CLI

The `recommend` command provides an interactive terminal interface for building playlists locally. It drives the same `RecommendationSession` used by the library API.

**File:** `recommender/cli.py`
**Entry point:** `recommend` (registered in `[project.scripts]`)

---

## Installation

```bash
poetry install
```

After install, `recommend` is available in the Poetry virtualenv:

```bash
poetry run recommend
# or, with the venv activated:
recommend
```

---

## Usage

```
recommend [OPTIONS]

Options:
  --provider  TEXT        LLM provider: anthropic, openai, google, ollama
                          [default: anthropic]
  --model     TEXT        Override model name
                          (e.g. claude-haiku-4-5-20251001)
  --api-key   TEXT        API key — overrides the relevant env var
  --output    [text|json] Output format  [default: text]
  --debug                 Show HTTP request/response details
  --help                  Show this message and exit.
```

---

## Interactive flow

Running `recommend` starts a conversation:

```
╭─────────────────────────────────────────────────────────────────╮
│ Make Me a Playlist                                              │
│ Interactive playlist builder · type 'quit' at any prompt to exit│
╰─────────────────────────────────────────────────────────────────╯

What do you want a playlist about? › history of synthesizers

  · searching YouTube for "history of synthesizers"
  · searching YouTube for "modular synthesis documentary"
  ...

Agent: Are you more interested in the technical history (circuits,
       inventors) or the cultural/musical history?

Your answer › both

  · fetching transcript for video abc123
  ...

╭─ Your Playlist · history of synthesizers ──────────────────────╮
│ Your Playlist · history of synthesizers                        │
╰────────────────────────────────────────────────────────────────╯

...
```

1. You enter a topic.
2. The agent may ask 2–4 clarifying questions — answer each in the terminal.
3. Progress events stream as the agent searches and evaluates videos.
4. The final playlist renders with all 5 videos.

Type `quit` at any prompt to exit cleanly.

---

## Output formats

### `--output text` (default)

Rich-formatted output for each video:

```
 1  The History of Synthesizers
    Documentary Channel · 52:30 · 45,200 views
    https://www.youtube.com/watch?v=moog001

    Why this: [reason comparing it to alternatives]
    What you'll learn: [what_makes_it_interesting]
```

### `--output json`

Prints the full `PlaylistResult` as JSON to stdout — suitable for piping to other tools:

```bash
recommend --output json | jq '.videos[].url'
```

```json
{
  "kind": "result",
  "topic": "history of synthesizers",
  "overall_rationale": "...",
  "videos": [
    {
      "video_id": "moog001",
      "url": "https://www.youtube.com/watch?v=moog001",
      "title": "The History of Synthesizers",
      "channel": "Documentary Channel",
      "duration_secs": 3150,
      "view_count": 45200,
      "reason": "...",
      "what_makes_it_interesting": "..."
    },
    ...
  ]
}
```

---

## Provider options

| `--provider` | Default model | Env var for API key |
|---|---|---|
| `anthropic` (default) | `claude-opus-4-6` | `ANTHROPIC_API_KEY` |
| `openai` | `gpt-4o` | `OPENAI_API_KEY` |
| `google` | `gemini-2.0-flash` | `GEMINI_API_KEY` |
| `ollama` | `llama3.2` | n/a (local) |

**Override the model:**

```bash
recommend --provider anthropic --model claude-haiku-4-5-20251001
recommend --provider openai --model gpt-4o-mini
```

**Pass an API key directly** (instead of using an env var):

```bash
recommend --provider anthropic --api-key sk-ant-...
```

**Use a local Ollama instance** (no API key needed):

```bash
recommend --provider ollama --model mistral
```

---

## Environment variables

The CLI loads `.env` at startup via `python-dotenv`. Place API keys there or export them in your shell:

```bash
# .env
ANTHROPIC_API_KEY=sk-ant-...
SERPER_API_KEY=...
SERP_API_KEY=...
BRAVE_API_KEY=...
EXA_API_KEY=...
SUPADATA_API_KEY=...
```

The search provider keys (`SERPER_API_KEY`, etc.) are always required — the LLM provider key is only required when not using Ollama.

---

## Debug mode

Pass `--debug` to log every HTTP request and response to stderr. This is useful for diagnosing rate-limit errors (429s) or unexpected API behaviour.

```bash
recommend --debug
```

Each HTTP call produces four lines:

```
DEBUG recommender.http_debug → GET https://api.search.brave.com/res/v1/videos/search?q=...
DEBUG recommender.http_debug    x-subscription-token: abc123...
DEBUG recommender.http_debug ← 429 https://api.search.brave.com/... (142ms)
DEBUG recommender.http_debug    retry-after: 60
DEBUG recommender.http_debug    x-ratelimit-remaining: 0
DEBUG recommender.http_debug    body: {"message":"Too many requests"}
```

- Request line: method, full URL
- Request headers: all headers including API keys
- Response line: status code, URL, elapsed time in ms
- Response headers: all headers (rate-limit metadata appears here)
- Response body: printed only on error responses (4xx/5xx), truncated at 2000 characters

Only `recommender.http_debug` logs at DEBUG — other library internals remain silent.

---

## Progress events

While the agent works, progress events are printed in dim text:

| Event kind | What it means |
|---|---|
| `searching` | A search provider query is running |
| `reading_page` | A web page is being fetched and extracted |
| `evaluating` | The agent is reasoning about results |
| `reading_transcript` | A video transcript is being fetched |
