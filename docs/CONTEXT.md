# CONTEXT.md — paperctl Agent Guide

> For AI coding agents working on this project.

## What This Is

`paperctl` is a TypeScript CLI that fetches papers from arxiv, summarizes them with LLMs, and maintains a local research knowledge base. Think Zotero for the terminal, AI-native.

## Key Architecture Decisions

1. **Fetch ≠ Summarize**: `fetch` stores paper metadata locally (cheap, offline). `summarize` calls the LLM on demand (expensive, per-paper). This avoids burning tokens on papers nobody will read.

2. **SQLite via better-sqlite3**: Synchronous API, no ORM. All queries in `src/lib/db.ts`. Schema created on first run via `initSchema()`.

3. **Arxiv API**: Uses the Atom feed at `export.arxiv.org/api/query`. XML parsed with regex (no XML library). Rate limit: be nice, don't hammer it.

4. **Commander.js**: Standard arg parsing. Each subcommand registers itself on the program in its own file. Global options (`--json`, `--quiet`, etc.) are accessed via `cmd.optsWithGlobals()`.

5. **Output contract**: Human-readable to stdout by default. `--json` for scripts. Diagnostics/progress to stderr. Colors respect `NO_COLOR` and `TERM=dumb`.

6. **Config precedence**: flags > env vars > `~/.paperctl/config.json` > defaults.

## File Map

```
├── AGENTS.md              # Agent instructions (read this first)
├── CLAUDE.md              # Redirects to AGENTS.md
├── CHANGELOG.md           # Version history
├── LICENSE                # MIT
├── biome.json             # Linter/formatter config
├── vitest.config.ts       # Test config
├── .github/workflows/ci.yml  # GitHub Actions CI
├── scripts/
│   ├── lint.sh            # Run linter
│   └── test.sh            # Run tests
├── tests/
│   ├── arxiv.test.ts      # normalizeArxivId tests
│   ├── config.test.ts     # parseSince tests
│   └── cli.test.ts        # Smoke tests (--help, --version)
├── docs/
│   ├── CLI-SPEC.md        # Full CLI specification
│   ├── CONTEXT.md         # This file
│   └── ARCHITECTURE.md    # System architecture overview
src/
├── index.ts           # Entry point, Commander setup, signal handlers
├── types.ts           # Shared TypeScript interfaces
├── commands/          # One file per subcommand
│   ├── track.ts       # track, untrack, topics commands
│   ├── fetch.ts       # Fetch from arxiv
│   ├── search.ts      # Local full-text search
│   ├── summarize.ts   # LLM paper summarization
│   ├── list.ts        # List papers
│   ├── show.ts        # Show paper details
│   ├── digest.ts      # AI digest generation
│   └── export.ts      # Export as MD/JSON
├── lib/
│   ├── db.ts          # SQLite: schema, CRUD, queries
│   ├── arxiv.ts       # Arxiv API client + XML parser
│   ├── llm.ts         # OpenAI integration
│   ├── config.ts      # Config loading, duration parsing
│   └── output.ts      # Colors, TTY detection, formatting
```

## Database Schema

- **topics**: `id`, `name` (unique, case-insensitive), `created_at`
- **papers**: `id`, `arxiv_id` (unique), `title`, `abstract`, `authors`, `categories`, `published`, `updated`, `url`, `pdf_url`, `fetched_at`, `summary`, `summarized_at`, `summary_model`
- **paper_topics**: `paper_id`, `topic_id` (junction table)

## Common Patterns

### Adding a new command

1. Create `src/commands/mycommand.ts`
2. Export `registerMyCommand(program: Command)` function
3. Import and call it in `src/index.ts`
4. Access global opts via `cmd.optsWithGlobals()`
5. Use `output()` for primary data, `info()`/`success()`/`error()` for diagnostics

### Working with the DB

```typescript
import { getDb } from "../lib/db.ts";
const db = getDb(); // singleton, creates if needed
const papers = db.prepare("SELECT * FROM papers WHERE ...").all();
```

### Output patterns

```typescript
// Human-readable vs JSON
if (globalOpts.json) {
  output({ arxiv_id: "...", title: "..." });
} else {
  output(`${bold(paper.title)}`);
}
```

## Environment

- **Runtime**: Node.js 18+ / tsx
- **Package manager**: npm
- **No build step needed**: Run via `npx tsx src/index.ts`
- **Global install**: `npm install -g .` then `paperctl`

## Testing

- **Framework:** vitest (`npm test`)
- **Test files:** `tests/*.test.ts`
- **Smoke test:** `bin/paperctl --help` should exit 0
- `summarize` and `digest` need `OPENAI_API_KEY` set
- Arxiv API doesn't need auth but has rate limits

## Gotchas

- `better-sqlite3` is a native module — needs rebuild if Node version changes
- Arxiv API returns XML, not JSON — we parse with regex, fragile but works
- `--no-color` is handled by Commander as a negated boolean (it sets `color: false`)
- Date handling: arxiv uses ISO 8601, SQLite stores as text
