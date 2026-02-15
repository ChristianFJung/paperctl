// Shared types for paperctl

export interface Paper {
  id: number;
  arxiv_id: string;
  title: string;
  abstract: string;
  authors: string;
  categories: string;
  published: string;
  updated: string;
  url: string;
  pdf_url: string;
  fetched_at: string;
  summary: string | null;
  summarized_at: string | null;
  summary_model: string | null;
}

export interface Topic {
  id: number;
  name: string;
  created_at: string;
}

export interface PaperTopic {
  paper_id: number;
  topic_id: number;
}

export interface Config {
  model: string;
  maxFetchPerTopic: number;
  defaultSinceDays: number;
}

export interface ArxivEntry {
  arxiv_id: string;
  title: string;
  abstract: string;
  authors: string[];
  categories: string[];
  published: string;
  updated: string;
  url: string;
  pdf_url: string;
}

export interface OutputOptions {
  json: boolean;
  quiet: boolean;
  verbose: boolean;
  noColor: boolean;
}
