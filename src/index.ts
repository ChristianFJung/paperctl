#!/usr/bin/env node

import { Command } from "commander";
import { setNoColor } from "./lib/output.ts";
import { closeDb } from "./lib/db.ts";
import { registerTrackCommand } from "./commands/track.ts";
import { registerFetchCommand } from "./commands/fetch.ts";
import { registerSearchCommand } from "./commands/search.ts";
import { registerSummarizeCommand } from "./commands/summarize.ts";
import { registerListCommand } from "./commands/list.ts";
import { registerShowCommand } from "./commands/show.ts";
import { registerDigestCommand } from "./commands/digest.ts";
import { registerExportCommand } from "./commands/export.ts";

const program = new Command();

program
  .name("paperctl")
  .description(
    "AI-native research paper pipeline for the terminal.\n\n" +
      "Fetch papers from arxiv, generate summaries using LLMs, and build\n" +
      "a personal research knowledge base. Like Zotero but for the terminal.\n\n" +
      "Examples:\n" +
      '  $ paperctl track "retrieval augmented generation"\n' +
      "  $ paperctl fetch --since 7d\n" +
      "  $ paperctl list\n" +
      "  $ paperctl summarize 2401.12345\n" +
      "  $ paperctl digest --since 30d"
  )
  .version("0.1.0", "--version", "Print version")
  .option("--json", "Output as JSON (machine-readable)")
  .option("--no-color", "Disable color output")
  .option("-q, --quiet", "Suppress non-essential output")
  .option("-v, --verbose", "Show debug/diagnostic info")
  .hook("preAction", (thisCommand) => {
    const opts = thisCommand.optsWithGlobals();
    // Commander's --no-color sets opts.color = false
    if (opts.color === false || opts.json) {
      setNoColor(true);
    }
  });

// Register all subcommands
registerTrackCommand(program);
registerFetchCommand(program);
registerSearchCommand(program);
registerSummarizeCommand(program);
registerListCommand(program);
registerShowCommand(program);
registerDigestCommand(program);
registerExportCommand(program);

// Graceful cleanup
const cleanup = () => {
  closeDb();
  process.exit(0);
};

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

// Parse and execute
program.parseAsync(process.argv).catch((err) => {
  console.error(`Error: ${err.message}`);
  closeDb();
  process.exit(1);
});
