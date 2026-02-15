import type { Command } from "commander";
import { fetchPaperById, normalizeArxivId } from "../lib/arxiv.ts";
import { getPaper, saveSummary, upsertPaper } from "../lib/db.ts";
import { summarizePaper } from "../lib/llm.ts";
import { bold, error, info, output, success } from "../lib/output.ts";

export function registerSummarizeCommand(program: Command): void {
  program
    .command("summarize")
    .description("Generate an LLM summary for a paper")
    .argument("<ref>", "Arxiv ID or URL")
    .option("--refresh", "Re-generate summary even if cached")
    .option("--model <model>", "Override LLM model")
    .action(async (ref: string, opts, cmd) => {
      const globalOpts = cmd.optsWithGlobals();
      const arxivId = normalizeArxivId(ref);

      // Check if paper exists locally
      let paper = getPaper(arxivId);

      if (!paper) {
        if (!globalOpts.quiet && !globalOpts.json) {
          info("Paper not in library. Fetching from arxiv...");
        }

        const entry = await fetchPaperById(arxivId);
        if (!entry) {
          error(`Paper not found: ${arxivId}`);
          process.exit(1);
        }

        const { paper: newPaper } = upsertPaper({
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
        paper = newPaper;
      }

      // Return cached summary if available
      if (paper.summary && !opts.refresh) {
        if (globalOpts.json) {
          output({
            arxiv_id: paper.arxiv_id,
            title: paper.title,
            summary: paper.summary,
            model: paper.summary_model,
            cached: true,
          });
        } else {
          output(bold(paper.title));
          output("");
          output(paper.summary);
        }
        return;
      }

      if (!globalOpts.quiet && !globalOpts.json) {
        info(`Summarizing: ${bold(paper.title)}...`);
      }

      try {
        const summary = await summarizePaper(paper, opts.model);
        saveSummary(paper.arxiv_id, summary, opts.model || "default");

        if (globalOpts.json) {
          output({
            arxiv_id: paper.arxiv_id,
            title: paper.title,
            summary,
            cached: false,
          });
        } else {
          output("");
          output(bold(paper.title));
          output("");
          output(summary);
          output("");
          success("Summary saved.");
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        error(`Failed to summarize: ${msg}`);
        process.exit(3);
      }
    });
}
