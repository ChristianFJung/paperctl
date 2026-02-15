import Database from "better-sqlite3";
import { join } from "path";
import { getDataDir } from "./config.ts";
import type { Paper, Topic } from "../types.ts";

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;
  const dbPath = join(getDataDir(), "paperctl.db");
  _db = new Database(dbPath);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");
  initSchema(_db);
  return _db;
}

export function closeDb(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}

function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE COLLATE NOCASE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS papers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      arxiv_id TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      abstract TEXT NOT NULL DEFAULT '',
      authors TEXT NOT NULL DEFAULT '',
      categories TEXT NOT NULL DEFAULT '',
      published TEXT NOT NULL DEFAULT '',
      updated TEXT NOT NULL DEFAULT '',
      url TEXT NOT NULL DEFAULT '',
      pdf_url TEXT NOT NULL DEFAULT '',
      fetched_at TEXT NOT NULL DEFAULT (datetime('now')),
      summary TEXT,
      summarized_at TEXT,
      summary_model TEXT
    );

    CREATE TABLE IF NOT EXISTS paper_topics (
      paper_id INTEGER NOT NULL REFERENCES papers(id) ON DELETE CASCADE,
      topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
      PRIMARY KEY (paper_id, topic_id)
    );

    CREATE INDEX IF NOT EXISTS idx_papers_arxiv_id ON papers(arxiv_id);
    CREATE INDEX IF NOT EXISTS idx_papers_published ON papers(published);
  `);
}

// --- Topic operations ---

export function addTopic(name: string): { created: boolean; topic: Topic } {
  const db = getDb();
  const existing = db
    .prepare("SELECT * FROM topics WHERE name = ?")
    .get(name) as Topic | undefined;
  if (existing) {
    return { created: false, topic: existing };
  }
  const result = db
    .prepare("INSERT INTO topics (name) VALUES (?)")
    .run(name);
  const topic = db
    .prepare("SELECT * FROM topics WHERE id = ?")
    .get(result.lastInsertRowid) as Topic;
  return { created: true, topic };
}

export function removeTopic(name: string): boolean {
  const db = getDb();
  const result = db
    .prepare("DELETE FROM topics WHERE name = ?")
    .run(name);
  return result.changes > 0;
}

export function listTopics(): Topic[] {
  const db = getDb();
  return db
    .prepare("SELECT * FROM topics ORDER BY created_at ASC")
    .all() as Topic[];
}

// --- Paper operations ---

export function upsertPaper(paper: {
  arxiv_id: string;
  title: string;
  abstract: string;
  authors: string;
  categories: string;
  published: string;
  updated: string;
  url: string;
  pdf_url: string;
}): { created: boolean; paper: Paper } {
  const db = getDb();
  const existing = db
    .prepare("SELECT * FROM papers WHERE arxiv_id = ?")
    .get(paper.arxiv_id) as Paper | undefined;
  if (existing) {
    return { created: false, paper: existing };
  }
  const result = db
    .prepare(
      `INSERT INTO papers (arxiv_id, title, abstract, authors, categories, published, updated, url, pdf_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      paper.arxiv_id,
      paper.title,
      paper.abstract,
      paper.authors,
      paper.categories,
      paper.published,
      paper.updated,
      paper.url,
      paper.pdf_url
    );
  const created = db
    .prepare("SELECT * FROM papers WHERE id = ?")
    .get(result.lastInsertRowid) as Paper;
  return { created: true, paper: created };
}

export function linkPaperTopic(paperId: number, topicId: number): void {
  const db = getDb();
  db.prepare(
    "INSERT OR IGNORE INTO paper_topics (paper_id, topic_id) VALUES (?, ?)"
  ).run(paperId, topicId);
}

export function getPaper(arxivId: string): Paper | undefined {
  const db = getDb();
  return db
    .prepare("SELECT * FROM papers WHERE arxiv_id = ?")
    .get(arxivId) as Paper | undefined;
}

export function listPapers(opts: {
  topicName?: string;
  since?: Date;
  limit?: number;
  sort?: string;
}): Paper[] {
  const db = getDb();
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  let query = "SELECT DISTINCT p.* FROM papers p";

  if (opts.topicName) {
    query +=
      " JOIN paper_topics pt ON p.id = pt.paper_id JOIN topics t ON pt.topic_id = t.id";
    conditions.push("t.name = ?");
    params.push(opts.topicName);
  }

  if (opts.since) {
    conditions.push("p.published >= ?");
    params.push(opts.since.toISOString());
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  const sortField = opts.sort === "title" ? "p.title" : opts.sort === "fetched" ? "p.fetched_at" : "p.published";
  query += ` ORDER BY ${sortField} DESC`;

  if (opts.limit) {
    query += " LIMIT ?";
    params.push(opts.limit);
  }

  return db.prepare(query).all(...params) as Paper[];
}

export function searchPapers(query: string, limit: number = 20): Paper[] {
  const db = getDb();
  const pattern = `%${query}%`;
  return db
    .prepare(
      `SELECT * FROM papers
       WHERE title LIKE ? OR abstract LIKE ?
       ORDER BY published DESC
       LIMIT ?`
    )
    .all(pattern, pattern, limit) as Paper[];
}

export function getTopicsForPaper(paperId: number): Topic[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT t.* FROM topics t
       JOIN paper_topics pt ON t.id = pt.topic_id
       WHERE pt.paper_id = ?`
    )
    .all(paperId) as Topic[];
}

export function saveSummary(
  arxivId: string,
  summary: string,
  model: string
): void {
  const db = getDb();
  db.prepare(
    `UPDATE papers SET summary = ?, summarized_at = datetime('now'), summary_model = ?
     WHERE arxiv_id = ?`
  ).run(summary, model, arxivId);
}

export function getPapersForDigest(opts: {
  since?: Date;
  topicName?: string;
  limit?: number;
}): Paper[] {
  return listPapers({
    topicName: opts.topicName,
    since: opts.since,
    limit: opts.limit || 50,
    sort: "published",
  });
}

export function getTopicByName(name: string): Topic | undefined {
  const db = getDb();
  return db
    .prepare("SELECT * FROM topics WHERE name = ?")
    .get(name) as Topic | undefined;
}
