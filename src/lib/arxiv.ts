/**
 * Arxiv API client
 * Uses the Atom feed at export.arxiv.org
 */

import type { ArxivEntry } from "../types.ts";

const ARXIV_API = "https://export.arxiv.org/api/query";

/**
 * Search arxiv for papers matching a query
 */
export async function searchArxiv(opts: {
  query: string;
  maxResults?: number;
  since?: Date;
}): Promise<ArxivEntry[]> {
  const maxResults = opts.maxResults || 50;

  // Build search query — search in title and abstract
  // Note: We construct the URL manually because URLSearchParams
  // double-encodes the + in AND operators, which arxiv rejects.
  const searchQuery = `all:${opts.query.replace(/\s+/g, "+AND+all:")}`;

  const url = `${ARXIV_API}?search_query=${searchQuery}&start=0&max_results=${maxResults}&sortBy=submittedDate&sortOrder=descending`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Arxiv API error: ${response.status} ${response.statusText}`);
  }

  const xml = await response.text();
  const entries = parseAtomFeed(xml);

  // Filter by date if requested
  if (opts.since) {
    const sinceTime = opts.since.getTime();
    return entries.filter((e) => new Date(e.published).getTime() >= sinceTime);
  }

  return entries;
}

/**
 * Fetch a single paper by arxiv ID
 */
export async function fetchPaperById(arxivId: string): Promise<ArxivEntry | null> {
  const cleanId = normalizeArxivId(arxivId);
  const url = `${ARXIV_API}?id_list=${cleanId}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Arxiv API error: ${response.status} ${response.statusText}`);
  }

  const xml = await response.text();
  const entries = parseAtomFeed(xml);
  return entries.length > 0 ? entries[0] : null;
}

/**
 * Normalize an arxiv ID or URL to just the ID
 */
export function normalizeArxivId(ref: string): string {
  // Handle full URLs
  const urlMatch = ref.match(/arxiv\.org\/(?:abs|pdf)\/(\d{4}\.\d{4,5}(?:v\d+)?)/);
  if (urlMatch) return urlMatch[1];

  // Handle bare IDs
  const idMatch = ref.match(/^(\d{4}\.\d{4,5}(?:v\d+)?)$/);
  if (idMatch) return idMatch[1];

  // Handle old-style IDs like hep-ph/9905221
  const oldMatch = ref.match(/(?:arxiv\.org\/(?:abs|pdf)\/)?([\w-]+\/\d{7}(?:v\d+)?)/);
  if (oldMatch) return oldMatch[1];

  return ref; // Return as-is, let API handle validation
}

/**
 * Parse Atom XML feed from arxiv API
 * Simple regex-based parser (no XML lib needed)
 */
function parseAtomFeed(xml: string): ArxivEntry[] {
  const entries: ArxivEntry[] = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;

  for (const match of xml.matchAll(entryRegex)) {
    const entry = match[1];

    const id = extractTag(entry, "id");
    if (!id) continue;

    // Skip the feed metadata entry
    if (id.includes("api.arxiv.org")) continue;

    const arxivId = normalizeArxivId(id);
    const title = extractTag(entry, "title")?.replace(/\s+/g, " ").trim() || "";
    const abstract = extractTag(entry, "summary")?.replace(/\s+/g, " ").trim() || "";
    const published = extractTag(entry, "published") || "";
    const updated = extractTag(entry, "updated") || "";

    // Extract authors
    const authorRegex = /<author>\s*<name>(.*?)<\/name>/g;
    const authors = [...entry.matchAll(authorRegex)].map((m) => m[1].trim());

    // Extract categories
    const catRegex = /<category[^>]*term="([^"]+)"/g;
    const categories = [...entry.matchAll(catRegex)].map((m) => m[1]);

    // Extract PDF link
    const pdfMatch = entry.match(/<link[^>]*title="pdf"[^>]*href="([^"]+)"/);
    const pdfUrl = pdfMatch ? pdfMatch[1] : "";

    const url = `https://arxiv.org/abs/${arxivId}`;

    entries.push({
      arxiv_id: arxivId,
      title,
      abstract,
      authors,
      categories,
      published,
      updated,
      url,
      pdf_url: pdfUrl,
    });
  }

  return entries;
}

function extractTag(xml: string, tag: string): string | undefined {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`);
  const match = xml.match(regex);
  return match ? match[1] : undefined;
}
