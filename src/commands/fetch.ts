import type { Command } from "commander";
import { searchArxiv } from "../lib/arxiv.ts";
import { loadConfig, parseSince } from "../lib/config.ts";
import { getTopicByName, linkPaperTopic, listTopics, upsertPaper } from "../lib/db.ts";
import { bold, error, info, output, success } from "../lib/output.ts";

export function registerFetchCommand(program: Command): void {
  program
    .command("fetch")
    .description("Fetch new papers from arxiv for tracked topics")
    .option("--since <duration>", "How far back to search (e.g., 7d, 30d)")
    .option("--topic <topic>", "Fetch for a specific topic only")
    .option("--limit <n>", "Max papers per topic", "100")
    .action(async (opts, cmd) => {
      const globalOpts = cmd.optsWithGlobals();
      const config = loadConfig();
      const since = opts.since || `${config.defaultSinceDays}d`;
      const sinceDate = parseSince(since);
      const limit = Number.parseInt(opts.limit, 10);

      let topics = listTopics();
      if (opts.topic) {
        const t = getTopicByName(opts.topic);
        if (!t) {
          error(`Topic not found: "${opts.topic}". Use \`paperctl topics\` to see tracked topics.`);
          process.exit(1);
        }
        topics = [t];
      }

      if (topics.length === 0) {
        if (globalOpts.json) {
          output({ ok: false, error: "No topics tracked" });
        } else {
          error("No topics tracked. Use `paperctl track <topic>` to add one first.");
        }
        process.exit(1);
      }

      if (!globalOpts.quiet && !globalOpts.json) {
        info(`Fetching papers for ${bold(String(topics.length))} topic(s) since ${since}...\n`);
      }

      let totalAdded = 0;
      let totalSkipped = 0;
      const results: Array<{
        topic: string;
        added: number;
        skipped: number;
      }> = [];

      for (const topic of topics) {
        try {
          const entries = await searchArxiv({
            query: topic.name,
            maxResults: limit,
            since: sinceDate,
          });

          let added = 0;
          let skipped = 0;

          for (const entry of entries) {
            const { created, paper } = upsertPaper({
              arxiv_id: entry.arxiv_id,
              title: entry.title,
              abstract: entry.abstract,
              authors: entry.authors.join(", "),
              categories: entry.categories.join(", "),
              published: entry.published,
              updated: entry.updated,
              url: entry.url,
              pdf_url: entry.pdf_url,
            });

            linkPaperTopic(paper.id, topic.id);

            if (created) {
              added++;
            } else {
              skipped++;
            }
          }

          totalAdded += added;
          totalSkipped += skipped;
          results.push({ topic: topic.name, added, skipped });

          if (!globalOpts.quiet && !globalOpts.json) {
            info(`  ${topic.name}: ${added} new papers (${skipped} existing)`);
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          error(`Failed to fetch for "${topic.name}": ${msg}`);
          results.push({ topic: topic.name, added: 0, skipped: 0 });
        }
      }

      if (globalOpts.json) {
        output({
          ok: true,
          added: totalAdded,
          skipped: totalSkipped,
          topics: results,
        });
      } else if (!globalOpts.quiet) {
        console.log("");
        success(`${totalAdded} papers added (${totalSkipped} duplicates skipped)`);
      }
    });
}
