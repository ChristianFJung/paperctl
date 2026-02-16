import type { Command } from "commander";
import { normalizeArxivId } from "../lib/arxiv.ts";
import { getPaper, getTopicsForPaper } from "../lib/db.ts";
import { bold, cyan, dim, error, formatDate, output, yellow } from "../lib/output.ts";

export function registerShowCommand(program: Command): void {
  program
    .command("show")
    .description("Show full details for one or more papers")
    .argument("<ids...>", "Arxiv ID(s)")
    .action((ids: string[], _opts, cmd) => {
      const globalOpts = cmd.optsWithGlobals();
      const jsonResults: Array<Record<string, unknown>> = [];

      for (const id of ids) {
        const arxivId = normalizeArxivId(id);
        const paper = getPaper(arxivId);

        if (!paper) {
          error(
            `Paper not found: ${arxivId}. Fetch it first or use \`paperctl summarize ${arxivId}\`.`,
          );
          if (ids.length === 1) {
            process.exit(1);
          }
          continue;
        }

        const topics = getTopicsForPaper(paper.id).map((t) => t.name);

        if (globalOpts.json) {
          jsonResults.push({
            ...paper,
            topics,
          });
          continue;
        }

        output("");
        output(`  ${bold(paper.title)}`);
        output(`  ${"═".repeat(Math.min(paper.title.length, 70))}`);
        output("");
        output(`  ${dim("Authors:")}    ${paper.authors}`);
        output(`  ${dim("Published:")}  ${formatDate(paper.published)}`);
        output(`  ${dim("Updated:")}    ${formatDate(paper.updated)}`);
        output(`  ${dim("Categories:")} ${paper.categories}`);
        output(`  ${dim("URL:")}        ${cyan(paper.url)}`);
        output(`  ${dim("PDF:")}        ${cyan(paper.pdf_url)}`);
        if (topics.length > 0) {
          output(`  ${dim("Topics:")}     ${topics.join(", ")}`);
        }
        output("");
        output(`  ${bold("Abstract:")}`);
        output(`  ${paper.abstract}`);
        output("");

        if (paper.summary) {
          output(
            `  ${bold("Summary:")} ${dim(`(${paper.summary_model}, ${formatDate(paper.summarized_at || "")})`)}`,
          );
          output("");
          paper.summary.split("\n").forEach((line) => {
            output(`  ${line}`);
          });
          output("");
        } else {
          output(
            `  ${yellow("No summary yet.")} Run: ${cyan(`paperctl summarize ${paper.arxiv_id}`)}`,
          );
          output("");
        }
      }

      if (globalOpts.json) {
        // Single ID: output the object directly for backwards compatibility
        // Multiple IDs: output array
        if (ids.length === 1) {
          output(jsonResults.length > 0 ? jsonResults[0] : null);
        } else {
          output(jsonResults);
        }
      }
    });
}
