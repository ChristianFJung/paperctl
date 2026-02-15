import type { Command } from "commander";
import { parseSince } from "../lib/config.ts";
import { getTopicsForPaper, listPapers } from "../lib/db.ts";
import { error, formatDate, output } from "../lib/output.ts";

export function registerExportCommand(program: Command): void {
  program
    .command("export")
    .description("Export your paper library")
    .option("--format <fmt>", "Output format: md, json", "md")
    .option("--topic <topic>", "Filter by topic")
    .option("--since <duration>", "Filter by date")
    .action((opts, cmd) => {
      const globalOpts = cmd.optsWithGlobals();
      const since = opts.since ? parseSince(opts.since) : undefined;

      const papers = listPapers({
        topicName: opts.topic,
        since,
        limit: 10000, // effectively unlimited for export
        sort: "published",
      });

      if (papers.length === 0) {
        error("No papers to export.");
        process.exit(1);
      }

      const fmt = globalOpts.json ? "json" : opts.format;

      if (fmt === "json") {
        const data = papers.map((p) => ({
          arxiv_id: p.arxiv_id,
          title: p.title,
          authors: p.authors,
          abstract: p.abstract,
          categories: p.categories,
          published: p.published,
          url: p.url,
          pdf_url: p.pdf_url,
          summary: p.summary,
          topics: getTopicsForPaper(p.id).map((t) => t.name),
        }));
        output(data);
      } else {
        // Markdown format
        const lines: string[] = [];
        lines.push("# Paper Library Export");
        lines.push("");
        lines.push(
          `> ${papers.length} papers exported on ${new Date().toISOString().split("T")[0]}`,
        );
        lines.push("");

        for (const p of papers) {
          const topics = getTopicsForPaper(p.id)
            .map((t) => t.name)
            .join(", ");

          lines.push(`## ${p.title}`);
          lines.push("");
          lines.push(`- **Arxiv ID:** ${p.arxiv_id}`);
          lines.push(`- **Authors:** ${p.authors}`);
          lines.push(`- **Published:** ${formatDate(p.published)}`);
          lines.push(`- **Categories:** ${p.categories}`);
          lines.push(`- **URL:** ${p.url}`);
          if (topics) {
            lines.push(`- **Topics:** ${topics}`);
          }
          lines.push("");
          lines.push("### Abstract");
          lines.push("");
          lines.push(p.abstract);
          lines.push("");

          if (p.summary) {
            lines.push("### Summary");
            lines.push("");
            lines.push(p.summary);
            lines.push("");
          }

          lines.push("---");
          lines.push("");
        }

        output(lines.join("\n"));
      }
    });
}
