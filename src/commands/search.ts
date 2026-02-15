import type { Command } from "commander";
import { getTopicsForPaper, searchPapers } from "../lib/db.ts";
import { bold, cyan, dim, error, formatDate, output, truncate } from "../lib/output.ts";

export function registerSearchCommand(program: Command): void {
  program
    .command("search")
    .description("Search your local paper library")
    .argument("<query>", "Search string")
    .option("--limit <n>", "Max results", "20")
    .action((query: string, opts, cmd) => {
      const globalOpts = cmd.optsWithGlobals();
      const limit = Number.parseInt(opts.limit, 10);
      const papers = searchPapers(query.trim(), limit);

      if (globalOpts.json) {
        const results = papers.map((p) => ({
          arxiv_id: p.arxiv_id,
          title: p.title,
          authors: p.authors,
          published: p.published,
          url: p.url,
          has_summary: !!p.summary,
          topics: getTopicsForPaper(p.id).map((t) => t.name),
        }));
        output(results);
        return;
      }

      if (papers.length === 0) {
        error(`No papers found matching "${query}".`);
        return;
      }

      output(bold(`Found ${papers.length} paper(s):\n`));
      for (const p of papers) {
        const topics = getTopicsForPaper(p.id)
          .map((t) => t.name)
          .join(", ");
        const summaryBadge = p.summary ? " ★" : "";
        output(`  ${cyan(p.arxiv_id)}  ${truncate(p.title, 60)}${dim(summaryBadge)}`);
        output(
          `  ${dim(`Published: ${formatDate(p.published)}`)}${topics ? dim(` | Topics: ${topics}`) : ""}`,
        );
        output("");
      }
    });
}
