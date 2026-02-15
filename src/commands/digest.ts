import type { Command } from "commander";
import { loadConfig, parseSince } from "../lib/config.ts";
import { getPapersForDigest } from "../lib/db.ts";
import { generateDigest } from "../lib/llm.ts";
import { bold, error, info, output, success } from "../lib/output.ts";

export function registerDigestCommand(program: Command): void {
  program
    .command("digest")
    .description("Generate an AI-curated digest of recent papers")
    .option("--since <duration>", "Time window (e.g., 7d, 30d)")
    .option("--topic <topic>", "Focus on specific topic")
    .option("--limit <n>", "Max papers to consider", "50")
    .option("--model <model>", "Override LLM model")
    .action(async (opts, cmd) => {
      const globalOpts = cmd.optsWithGlobals();
      const config = loadConfig();
      const since = opts.since || `${config.defaultSinceDays}d`;
      const sinceDate = parseSince(since);
      const limit = Number.parseInt(opts.limit, 10);

      const papers = getPapersForDigest({
        since: sinceDate,
        topicName: opts.topic,
        limit,
      });

      if (papers.length === 0) {
        if (globalOpts.json) {
          output({ ok: false, error: "No papers found for digest" });
        } else {
          error("No papers found in the given time window. Try `paperctl fetch` first.");
        }
        process.exit(1);
      }

      if (!globalOpts.quiet && !globalOpts.json) {
        info(`Generating digest from ${bold(String(papers.length))} papers (since ${since})...\n`);
      }

      try {
        const digest = await generateDigest(papers, opts.model);

        if (globalOpts.json) {
          output({
            ok: true,
            paper_count: papers.length,
            since,
            digest,
          });
        } else {
          output(digest);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        error(`Failed to generate digest: ${msg}`);
        process.exit(3);
      }
    });
}
