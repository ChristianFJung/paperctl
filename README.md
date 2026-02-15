# paperctl

> AI-native research paper pipeline for the terminal.

Fetch papers from arxiv, generate summaries using LLMs, and build a personal research knowledge base. Like Zotero but for the terminal and AI-native.

## Install

```bash
# Clone and install globally
git clone <repo-url> && cd paperctl
npm install
npm install -g .

# Or run directly with tsx
npx tsx src/index.ts --help
```

## Quick Start

```bash
# 1. Track topics you care about
paperctl track "retrieval augmented generation"
paperctl track "transformer architecture"

# 2. Fetch recent papers from arxiv
paperctl fetch --since 7d

# 3. Browse your library
paperctl list
paperctl search "attention mechanism"

# 4. Dive into a specific paper
paperctl show 2401.12345

# 5. Generate an AI summary (requires OPENAI_API_KEY)
export OPENAI_API_KEY=sk-...
paperctl summarize 2401.12345

# 6. Get a weekly digest
paperctl digest --since 7d
```

## Commands

### `paperctl track <topic>`

Add a topic to watch. Topics are used by `fetch` to query arxiv.

```bash
paperctl track "retrieval augmented generation"
# ✓ Now tracking: retrieval augmented generation

paperctl track "chain of thought prompting"
```

### `paperctl untrack <topic>`

Remove a tracked topic.

```bash
paperctl untrack "chain of thought prompting"
# ✓ Stopped tracking: chain of thought prompting
```

### `paperctl topics`

List all tracked topics.

```bash
paperctl topics
# Tracked Topics:
#   1. retrieval augmented generation (since 2024-01-15)
#   2. transformer architecture (since 2024-01-20)

paperctl topics --json
# [{"id":1,"name":"retrieval augmented generation","created_at":"..."},...]
```

### `paperctl fetch [options]`

Fetch new papers from arxiv matching tracked topics.

```bash
paperctl fetch                           # Default: last 7 days
paperctl fetch --since 30d               # Last 30 days
paperctl fetch --topic "RAG" --limit 50  # Specific topic, max 50
```

| Flag | Default | Description |
|------|---------|-------------|
| `--since <duration>` | `7d` | How far back (e.g., `1d`, `7d`, `30d`) |
| `--topic <topic>` | all | Fetch for one topic |
| `--limit <n>` | `100` | Max papers per topic |

### `paperctl search <query>`

Full-text search over titles and abstracts in your local library.

```bash
paperctl search "attention mechanism"
paperctl search "RLHF" --limit 10
paperctl search "diffusion" --json
```

### `paperctl summarize <arxiv-id|url>`

Generate an LLM summary for a paper. Requires `OPENAI_API_KEY`.

> **Note:** This is a human convenience command — it costs API tokens per call. If you're an AI agent, use `paperctl show <id> --json` and synthesize from the abstract yourself.

```bash
paperctl summarize 2401.12345
paperctl summarize https://arxiv.org/abs/2401.12345
paperctl summarize 2401.12345 --refresh        # Re-generate
paperctl summarize 2401.12345 --model gpt-4o   # Use a different model
```

Papers not yet in your library are fetched automatically.

### `paperctl list [options]`

List papers in your library.

```bash
paperctl list                            # Most recent 20
paperctl list --topic "RAG" --since 30d  # Filter by topic + date
paperctl list --sort title --limit 50    # Sort by title
paperctl list --json                     # Machine-readable
```

| Flag | Default | Description |
|------|---------|-------------|
| `--topic <topic>` | all | Filter by topic |
| `--since <duration>` | — | Filter by date |
| `--limit <n>` | `20` | Max results |
| `--sort <field>` | `published` | `published`, `fetched`, `title` |

### `paperctl show <id>`

Show full details for a paper including abstract and summary.

```bash
paperctl show 2401.12345
paperctl show 2401.12345 --json
```

### `paperctl digest [options]`

Generate an AI-curated digest of recent papers. Requires `OPENAI_API_KEY`.

> **Note:** Like `summarize`, this is a human convenience command that costs API tokens. Agents should use `paperctl list --json` and synthesize their own digest.

```bash
paperctl digest                  # Last 7 days
paperctl digest --since 30d     # Last month
paperctl digest --topic "RAG"   # Focus on one topic
```

### `paperctl export [options]`

Export your library as Markdown or JSON.

```bash
paperctl export > papers.md                          # Markdown (default)
paperctl export --format json > papers.json          # JSON
paperctl export --format json --topic "RAG" | jq .   # Filter + pipe
```

## Global Flags

| Flag | Description |
|------|-------------|
| `--help`, `-h` | Show help |
| `--version` | Print version |
| `--json` | Machine-readable JSON output |
| `--no-color` | Disable color output |
| `-q`, `--quiet` | Suppress non-essential output |
| `-v`, `--verbose` | Show debug/diagnostic info |

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | — | Required for `summarize` and `digest` |
| `PAPERCTL_MODEL` | `gpt-4o-mini` | LLM model to use |
| `NO_COLOR` | — | Disables color when set |

### Config File

`~/.paperctl/config.json`:

```json
{
  "model": "gpt-4o-mini",
  "maxFetchPerTopic": 100,
  "defaultSinceDays": 7
}
```

### Precedence

```
flags > environment variables > config file > defaults
```

## Data Storage

All data lives in `~/.paperctl/`:
- `paperctl.db` — SQLite database (papers, topics, summaries)
- `config.json` — User preferences

Works offline after initial fetch. Papers are stored locally.

## Architecture

- **Language:** TypeScript
- **Storage:** SQLite via better-sqlite3
- **Arxiv:** REST API at export.arxiv.org (no auth)
- **LLM:** OpenAI API for summaries and digests
- **Arg parsing:** Commander.js

## Why This Exists

Keeping up with AI research is overwhelming. arxiv gets hundreds of papers daily. This tool lets you:

1. **Track** topics you care about
2. **Fetch** papers automatically
3. **Search** your personal library offline
4. **Summarize** papers with AI when you need it (not wastefully on every paper)
5. **Digest** recent work into a cohesive summary

It's a terminal-native, AI-augmented research workflow.

## License

MIT

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

See [AGENTS.md](AGENTS.md) for coding conventions and architecture.
