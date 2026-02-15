# paperctl CLI Specification

> AI-native research paper pipeline for the terminal.

## Global Flags

| Flag | Short | Description |
|------|-------|-------------|
| `--help` | `-h` | Show help text, ignore other args |
| `--version` | | Print version to stdout |
| `--json` | | Machine-readable JSON output |
| `--no-color` | | Disable color output |
| `--quiet` | `-q` | Suppress non-essential output |
| `--verbose` | `-v` | Show debug/diagnostic info on stderr |

### Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | — | Required for `summarize` and `digest` |
| `PAPERCTL_MODEL` | `gpt-4o-mini` | LLM model for summaries |
| `NO_COLOR` | — | Disables color when set (any value) |

### Precedence

```
flags > env vars > ~/.paperctl/config.json > defaults
```

## Data Directory

`~/.paperctl/`
- `paperctl.db` — SQLite database (papers, topics, summaries)
- `config.json` — User preferences

## Subcommands

### `paperctl track <topic>`

Add a topic to watch. Topics are used by `fetch` to query arxiv.

```
$ paperctl track "retrieval augmented generation"
✓ Now tracking: retrieval augmented generation

$ paperctl track "transformer architecture" --json
{"ok":true,"topic":"transformer architecture","action":"added"}
```

**Arguments:**
- `<topic>` — Topic string to track (required)

**Behavior:**
- Idempotent: tracking an already-tracked topic is a no-op with a note
- Stored in SQLite topics table

---

### `paperctl untrack <topic>`

Remove a tracked topic.

```
$ paperctl untrack "transformer architecture"
✓ Stopped tracking: transformer architecture

$ paperctl untrack "nonexistent"
⚠ Topic not found: nonexistent
```

**Arguments:**
- `<topic>` — Topic string to remove (required)

**Exit codes:**
- 0: success or topic not found (idempotent)
- 1: error

---

### `paperctl topics`

List all tracked topics.

```
$ paperctl topics
1. retrieval augmented generation (since 2024-01-15)
2. transformer architecture (since 2024-01-20)

$ paperctl topics --json
[{"id":1,"topic":"retrieval augmented generation","created_at":"2024-01-15T..."},...]
```

**Flags:** None specific.

---

### `paperctl fetch [--since <duration>] [--topic <t>] [--limit <n>]`

Fetch new papers from arxiv matching tracked topics.

```
$ paperctl fetch
Fetching papers for 2 topics...
  retrieval augmented generation: 12 new papers
  transformer architecture: 8 new papers
✓ 20 papers added (3 duplicates skipped)

$ paperctl fetch --since 30d --topic "retrieval augmented generation"
Fetching papers for: retrieval augmented generation (last 30 days)...
✓ 45 papers added
```

**Flags:**
| Flag | Default | Description |
|------|---------|-------------|
| `--since <duration>` | `7d` | How far back to search (e.g., `1d`, `7d`, `30d`) |
| `--topic <t>` | all | Fetch for a specific topic only |
| `--limit <n>` | `100` | Max papers per topic |

**Behavior:**
- Queries arxiv REST API at `export.arxiv.org`
- Deduplicates by arxiv ID
- Stores title, abstract, authors, categories, dates, arxiv URL
- Progress shown on stderr when not `--quiet`

---

### `paperctl search <query>`

Full-text search over local library (titles + abstracts).

```
$ paperctl search "attention mechanism"
Found 5 papers:

  2401.12345  Attention Is Still All You Need
              Published: 2024-01-15 | Topics: transformer architecture
  
  2401.67890  Multi-Head Attention Revisited
              Published: 2024-01-18 | Topics: transformer architecture

$ paperctl search "attention" --json
[{"arxiv_id":"2401.12345","title":"...","published":"..."},...]
```

**Arguments:**
- `<query>` — Search string (required)

**Flags:**
| Flag | Default | Description |
|------|---------|-------------|
| `--limit <n>` | `20` | Max results |

---

### `paperctl summarize <arxiv-id|url>`

Generate an LLM summary for a specific paper.

```
$ paperctl summarize 2401.12345
Summarizing: Attention Is Still All You Need...

## Summary
This paper revisits the transformer architecture and proposes...

## Key Contributions
- Novel attention variant that reduces complexity from O(n²) to O(n log n)
- ...

$ paperctl summarize https://arxiv.org/abs/2401.12345 --json
{"arxiv_id":"2401.12345","title":"...","summary":"..."}
```

**Arguments:**
- `<ref>` — arxiv ID (e.g., `2401.12345`) or full URL

**Behavior:**
- If paper not in local DB, fetches metadata from arxiv first
- Calls OpenAI API with abstract + metadata
- Caches summary in SQLite (subsequent calls return cached unless `--refresh`)
- Requires `OPENAI_API_KEY`

**Flags:**
| Flag | Description |
|------|-------------|
| `--refresh` | Re-generate summary even if cached |
| `--model <m>` | Override LLM model |

---

### `paperctl list [--topic <t>] [--since <duration>]`

List papers in local library.

```
$ paperctl list
Showing 20 most recent papers:

  2401.12345  Attention Is Still All You Need          2024-01-15  ★ summarized
  2401.67890  Multi-Head Attention Revisited            2024-01-18
  ...

$ paperctl list --topic "retrieval augmented generation" --since 30d
```

**Flags:**
| Flag | Default | Description |
|------|---------|-------------|
| `--topic <t>` | all | Filter by topic |
| `--since <duration>` | — | Filter by date |
| `--limit <n>` | `20` | Max results |
| `--sort <field>` | `published` | Sort by: `published`, `fetched`, `title` |

---

### `paperctl show <id>`

Show full details for a paper.

```
$ paperctl show 2401.12345

  Attention Is Still All You Need
  ════════════════════════════════
  
  Authors:  Jane Doe, John Smith
  Published: 2024-01-15
  Categories: cs.CL, cs.AI
  URL: https://arxiv.org/abs/2401.12345
  Topics: transformer architecture
  
  Abstract:
  We revisit the seminal transformer architecture and propose...
  
  Summary:
  (Run `paperctl summarize 2401.12345` to generate)
```

**Arguments:**
- `<id>` — arxiv ID (required)

---

### `paperctl digest [--since <duration>] [--topic <t>]`

Generate an AI-curated digest of recent papers.

```
$ paperctl digest --since 7d
Generating digest from 20 papers...

# Weekly Research Digest (Jan 15-22, 2024)

## Highlights
Three papers this week push the boundaries of efficient attention...

## Notable Papers
1. **Attention Is Still All You Need** (2401.12345)
   A promising new approach to...

2. ...

## Trends
- Growing interest in sub-quadratic attention mechanisms
- ...
```

**Flags:**
| Flag | Default | Description |
|------|---------|-------------|
| `--since <duration>` | `7d` | Time window |
| `--topic <t>` | all | Focus on specific topic |
| `--limit <n>` | `50` | Max papers to consider |
| `--model <m>` | config | Override LLM model |

**Behavior:**
- Sends batch of paper titles + abstracts to LLM
- LLM picks most interesting and writes cohesive summary
- Requires `OPENAI_API_KEY`

---

### `paperctl export [--format <fmt>]`

Export library data.

```
$ paperctl export --format md > papers.md
$ paperctl export --format json > papers.json
$ paperctl export --format json --topic "RAG" | jq '.[] | .title'
```

**Flags:**
| Flag | Default | Description |
|------|---------|-------------|
| `--format <fmt>` | `md` | Output format: `md`, `json` |
| `--topic <t>` | all | Filter by topic |
| `--since <duration>` | — | Filter by date |

---

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Invalid arguments / usage error |
| 3 | Missing configuration (e.g., no API key for summarize) |

## Signal Handling

- `SIGINT` (Ctrl-C): Exit immediately, bounded cleanup (close DB)
- `SIGTERM`: Same as SIGINT

## Color / TTY

- Color enabled by default when stdout is a TTY
- Disabled when: `--no-color` flag, `NO_COLOR` env set, `TERM=dumb`
- `--json` implies no color
