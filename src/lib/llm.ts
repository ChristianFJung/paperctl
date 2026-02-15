/**
 * LLM integration for paper summarization and digest generation
 */

import OpenAI from "openai";
import { resolveModel } from "./config.ts";
import type { Paper } from "../types.ts";

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY environment variable is required.\n" +
        "Set it with: export OPENAI_API_KEY=sk-..."
    );
  }
  return new OpenAI({ apiKey });
}

/**
 * Generate a summary for a single paper
 */
export async function summarizePaper(
  paper: Paper,
  modelFlag?: string
): Promise<string> {
  const client = getClient();
  const model = resolveModel(modelFlag);

  const prompt = `You are a research paper summarizer. Given the following paper, provide a clear, structured summary.

Title: ${paper.title}
Authors: ${paper.authors}
Categories: ${paper.categories}
Published: ${paper.published}

Abstract:
${paper.abstract}

Provide a summary with the following sections:
## Summary
A 2-3 paragraph summary of the paper's main contribution and approach.

## Key Contributions
- Bullet points of the main contributions

## Methodology
Brief description of the approach/methodology.

## Relevance
Why this paper matters and who should read it.

Keep it concise but informative. Write for a technical audience.`;

  const response = await client.chat.completions.create({
    model,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 1000,
  });

  return response.choices[0]?.message?.content || "No summary generated.";
}

/**
 * Generate a digest from multiple papers
 */
export async function generateDigest(
  papers: Paper[],
  modelFlag?: string
): Promise<string> {
  const client = getClient();
  const model = resolveModel(modelFlag);

  const paperList = papers
    .map(
      (p, i) =>
        `${i + 1}. [${p.arxiv_id}] "${p.title}"\n   Authors: ${p.authors}\n   Abstract: ${p.abstract.slice(0, 300)}...`
    )
    .join("\n\n");

  const today = new Date().toISOString().split("T")[0];

  const prompt = `You are a research digest curator. Given the following ${papers.length} recent papers, create an engaging research digest.

Papers:
${paperList}

Create a digest with:
# Research Digest — ${today}

## Highlights
A 1-2 paragraph overview of the most interesting trends and findings.

## Top Papers
Pick the 3-5 most interesting/impactful papers and briefly explain why each matters.
Format: **Paper Title** (arxiv_id) — 1-2 sentence explanation.

## Emerging Trends
What themes or directions are emerging from this batch of papers?

Be concise, insightful, and opinionated about what's interesting.`;

  const response = await client.chat.completions.create({
    model,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.5,
    max_tokens: 2000,
  });

  return response.choices[0]?.message?.content || "No digest generated.";
}
