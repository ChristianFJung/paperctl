# AGENTS.md — paperctl

> AI-native research paper pipeline for the terminal. TypeScript, Node.js, commander, better-sqlite3, OpenAI.

## Essential Commands

```bash
npm install                        # Install deps
npx tsx src/index.ts --help        # Run without building
npm run typecheck                  # Type check
npm run lint                       # Lint (biome)
npm run lint:fix                   # Lint + auto-fix
npm test                           # Run tests (vitest)
npm run build                      # Bundle with esbuild
```

## Architecture

```
src/
├── index.ts              # Entry: Commander setup, signal handlers
├── types.ts              # Shared interfaces (Paper, Topic, Config, etc.)
├── commands/             # One file per subcommand
│   ├── track.ts          # track, untrack, topics
│   ├── fetch.ts          # Fetch from arxiv API
│   ├── search.ts         # Local full-text search
│   ├── summarize.ts      # LLM paper summary
│   ├── list.ts           # List papers
│   ├── show.ts           # Show paper details
│   ├── digest.ts         # AI digest of recent papers
│   └── export.ts         # Export as MD/JSON
├── lib/
│   ├── arxiv.ts          # Arxiv API client, XML parsing
│   ├── db.ts             # SQLite: schema, CRUD, queries
│   ├── config.ts         # Config loading, duration parsing
│   ├── llm.ts            # OpenAI integration
│   └── output.ts         # Colors, TTY detection, formatters
docs/
├── CLI-SPEC.md           # Full CLI specification
├── CONTEXT.md            # Agent-oriented project context
└── ARCHITECTURE.md       # System architecture overview
tests/                    # Vitest test suite
scripts/                  # Automation scripts (lint, test)
```

### Data Flow

`track` topics → `fetch` from arxiv → store in SQLite → `summarize` via LLM on demand

### Storage

`~/.paperctl/` — SQLite DB (`paperctl.db`) + `config.json`. Works offline after fetch.

## Coding Conventions

- **TypeScript strict mode** — `strict: true` in tsconfig
- **Functional style** — no classes, export functions
- **One command per file** — each exports `registerXCommand(program)`
- **Output contract** — human-readable to stdout, `--json` for machines, diagnostics to stderr
- **Config precedence** — flags > env vars > config file > defaults
- **Conventional commits** — `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`

## Testing

- **Framework:** vitest
- **Location:** `tests/`
- **Run:** `npm test` or `npx vitest`
- **Naming:** `tests/<module>.test.ts`
- Test pure functions (parsers, normalizers). Mock network + filesystem.
- Smoke test: `bin/paperctl --help` should exit 0.

## Agent-Specific Guidance

⚠️ **Do NOT use `paperctl summarize`** — it burns OpenAI API tokens to generate a human-readable summary. You can synthesize from the abstract yourself.

**Instead:** `paperctl show <id> --json` gives you the title, abstract, authors, and metadata. Read the abstract and synthesize.

**`summarize` and `digest` are human convenience commands, not agent tools.**

**Always prefer `--json`** on all commands for structured, parseable output.
