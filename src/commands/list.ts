import type { Command } from "commander";
import { loadConfig, parseSince } from "../lib/config.ts";
import { getTopicsForPaper, listPapers } from "../lib/db.ts";
import { bold, cyan, dim, formatDate, output, truncate, yellow } from "../lib/output.ts";

export function registerListCommand(program: Command): void {
  program
    .command("list")
    .description("List papers in your library")
    .option("--topic <topic>", "Filter by topic")
    .option("--since <duration>", "Filter by date (e.g., 7d, 30d)")
    .option("--limit <n>", "Max results", "20")
    .option("--sort <field>", "Sort by: published, fetched, title", "published")
    .action((opts, cmd) => {
      const globalOpts = cmd.optsWithGlobals();
      const limit = Number.parseInt(opts.limit, 10);
      const since = opts.since ? parseSince(opts.since) : undefined;

      const papers = listPapers({
        topicName: opts.topic,
        since,
        limit,
        sort: opts.sort,
      });

      if (globalOpts.json) {
        const results = papers.map((p) => ({
          arxiv_id: p.arxiv_id,
          title: p.title,
          authors: p.authors,
          published: p.published,
          url: p.url,
          has_summary: !!p.summary,
          abstractLength: p.abstract.length,
          topics: getTopicsForPaper(p.id).map((t) => t.name),
        }));
        output(results);
        if (results.length === 0) {
          process.exit(2);
        }
        return;
      }

      if (papers.length === 0) {
        output("No papers in library. Use `paperctl fetch` to get papers from arxiv.");
        process.exit(2);
      }

      const header = opts.topic
        ? `Papers — ${opts.topic}`
        : `Papers (${papers.length} most recent)`;
      output(`${bold(header)}\n`);

      for (const p of papers) {
        const summaryBadge = p.summary ? yellow(" ★ summarized") : "";
        const topics = getTopicsForPaper(p.id)
          .map((t) => t.name)
          .join(", ");

        output(
          `  ${cyan(p.arxiv_id)}  ${truncate(p.title, 55)}  ${dim(formatDate(p.published))}${summaryBadge}`,
        );
        if (topics) {
          output(`  ${dim(`Topics: ${topics}`)}`);
        }
        output("");
      }
    });
}
