# Architecture

## Command Pattern

Each command lives in `src/commands/<name>.ts` and exports a `register<Name>Command(program: Command)` function. The entry point (`src/index.ts`) imports and calls each registration function. Commands access global options via `cmd.optsWithGlobals()`.

Adding a command:
1. Create `src/commands/foo.ts`
2. Export `registerFooCommand(program)`
3. Import + call in `src/index.ts`

## Library Modules

| Module | Responsibility |
|--------|----------------|
| `arxiv.ts` | Arxiv API client. Builds search URLs, fetches Atom feeds, parses XML with regex. Handles ID normalization (URLs, bare IDs, old-style IDs). |
| `db.ts` | SQLite via better-sqlite3 (synchronous). Schema init, CRUD for papers/topics/paper_topics. Singleton connection. |
| `config.ts` | Loads `~/.paperctl/config.json`, merges with defaults. Duration parsing (`7d` → `Date`). Model resolution (flag > env > config > default). |
| `llm.ts` | OpenAI client wrapper. Builds prompts for summarize and digest. Requires `OPENAI_API_KEY`. |
| `output.ts` | TTY detection, ANSI colors, `output()`/`info()`/`error()` helpers. Respects `NO_COLOR`, `TERM=dumb`, and `--no-color`. |

## Data Flow

```
User tracks topics          →  stored in SQLite (topics table)
paperctl fetch              →  queries arxiv API per topic
                            →  papers stored in SQLite (papers + paper_topics)
paperctl list/search/show   →  reads from local SQLite (offline)
paperctl summarize <id>     →  sends abstract to OpenAI → stores summary in SQLite
paperctl digest             →  aggregates recent papers → sends to OpenAI → stdout
```

## Storage

Everything lives in `~/.paperctl/`:

- **`paperctl.db`** — SQLite database
  - `topics` — tracked search terms
  - `papers` — paper metadata + optional summary
  - `paper_topics` — many-to-many junction
- **`config.json`** — user preferences (model, defaults)

No cloud sync, no accounts. Fully local. Works offline after initial fetch.
