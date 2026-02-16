![Banner](https://ghrb.waren.build/banner?header=paperctl&subheader=AI-native+research+paper+pipeline&bg=0d1117&color=f0f6fc&support=false)

# paperctl

> Track arxiv papers, generate AI summaries, and build a personal research knowledge base — from your terminal.

## Try it now

```bash
npx -y @christianfjung/paperctl track "retrieval augmented generation"
```

## Install

```bash
# Zero-install (try it instantly)
npx -y @christianfjung/paperctl --help

# Install globally
npm install -g @christianfjung/paperctl

# Or clone and link
git clone <repo-url> && cd paperctl
npm install && npm install -g .
```

## Features

- 📡 **Track topics** — follow arxiv categories and search terms
- 📥 **Auto-fetch** — pull new papers matching your topics from arxiv
- 🔍 **Full-text search** — search titles and abstracts in your local library
- 🤖 **AI summaries** — generate LLM-powered paper summaries (optional, requires `OPENAI_API_KEY`)
- 📰 **Weekly digests** — AI-curated digest of recent papers across your topics
- 📊 **JSON output** — `--json` on every command for scripting and piping
- 📦 **Batch operations** — `show` accepts multiple IDs, `list --json` includes `abstractLength` for prioritization
- 💾 **Offline-first** — SQLite-backed local library, works without internet after fetch
- 📤 **Export** — dump your library as Markdown or JSON

## Quick Start

```bash
# 1. Track topics you care about
paperctl track "retrieval augmented generation"

# 2. Fetch recent papers from arxiv
paperctl fetch --since 7d

# 3. Search your local library
paperctl search "attention mechanism"

# 4. Dive into a paper
paperctl show 2401.12345 --json

# 5. Generate an AI summary (optional, costs tokens)
OPENAI_API_KEY=sk-... paperctl summarize 2401.12345
```

## Commands

### `paperctl track <topic>`

Add a topic to watch. Topics are used by `fetch` to query arxiv.

```bash
paperctl track "retrieval augmented generation"
paperctl track "chain of thought prompting"
```

### `paperctl untrack <topic>`

Remove a tracked topic.

### `paperctl topics`

List all tracked topics. Supports `--json`.

### `paperctl fetch [options]`

Fetch new papers from arxiv matching tracked topics.

```bash
paperctl fetch                           # Default: last 7 days
paperctl fetch --since 30d               # Last 30 days
paperctl fetch --topic "RAG" --limit 50  # Specific topic, max 50
```

Flags: `--since <duration>` (default `7d`), `--topic <topic>`, `--limit <n>` (default `100`).

### `paperctl search <query>`

Full-text search over titles and abstracts in your local library.

```bash
paperctl search "attention mechanism"
paperctl search "RLHF" --json
```

### `paperctl list [options]`

List papers in your library. Supports filtering by topic, date, and sorting.

```bash
paperctl list --topic "RAG" --since 30d --json
```

Flags: `--topic`, `--since`, `--limit` (default `20`), `--sort` (`published`|`fetched`|`title`).

### `paperctl show <ids...>`

Show full details for one or more papers. Supports multiple IDs for batch retrieval.

```bash
paperctl show 2401.12345
paperctl show 2401.12345 2401.67890 2402.11111 --json   # Batch get
```

### `paperctl summarize <arxiv-id|url>`

Generate an LLM summary for a paper. Requires `OPENAI_API_KEY`.

> ⚠️ **Human-only command** — costs API tokens per call. AI agents should use `paperctl show <id> --json` and synthesize from the abstract.

```bash
paperctl summarize 2401.12345
paperctl summarize 2401.12345 --model gpt-4o --refresh
```

### `paperctl digest [options]`

Generate an AI-curated digest of recent papers. Requires `OPENAI_API_KEY`.

> ⚠️ **Human-only command** — costs API tokens. Agents should use `paperctl list --json` and synthesize their own digest.

```bash
paperctl digest --since 7d --topic "RAG"
```

### `paperctl export [options]`

Export your library as Markdown or JSON.

```bash
paperctl export > papers.md
paperctl export --format json | jq .
```

## Global Flags

`--help` / `-h`, `--version`, `--json`, `--no-color`, `--quiet` / `-q`, `--verbose` / `-v`

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | — | Required for `summarize` and `digest` |
| `PAPERCTL_MODEL` | `gpt-4o-mini` | LLM model to use |
| `NO_COLOR` | — | Disables color when set |

### Config File

`~/.paperctl/config.json` — model, maxFetchPerTopic, defaultSinceDays.

**Precedence:** flags > env vars > config file > defaults.

## Data Storage

All data lives in `~/.paperctl/`:
- `paperctl.db` — SQLite database (papers, topics, summaries)
- `config.json` — User preferences

Works offline after initial fetch.

## Development

```bash
npm install                        # Install dependencies
npm run typecheck                  # Type check
npm run lint                       # Lint (biome)
npm run lint:fix                   # Lint + auto-fix
npm test                           # Run tests (vitest)
npm run build                      # Bundle with esbuild
npx tsx src/index.ts --help        # Run directly
```

See [AGENTS.md](AGENTS.md) for coding conventions and architecture details.

## License

MIT
