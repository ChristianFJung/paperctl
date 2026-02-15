# Changelog

## [0.1.0] - 2026-02-15
### Added
- Initial release
- 10 commands: track, untrack, topics, fetch, search, summarize, list, show, digest, export
- SQLite storage via better-sqlite3
- Arxiv API integration
- OpenAI integration for summarize and digest
- Global flags: --json, --no-color, -q/--quiet, -v/--verbose
- docs/CLI-SPEC.md and docs/CONTEXT.md

### Fixed
- URLSearchParams double-encoding arxiv query operators
