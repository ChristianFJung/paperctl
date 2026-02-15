import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { Config } from "../types.ts";

const DATA_DIR = join(homedir(), ".paperctl");
const CONFIG_FILE = join(DATA_DIR, "config.json");

const DEFAULT_CONFIG: Config = {
  model: "gpt-4o-mini",
  maxFetchPerTopic: 100,
  defaultSinceDays: 7,
};

export function getDataDir(): string {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  return DATA_DIR;
}

export function getConfigPath(): string {
  return CONFIG_FILE;
}

export function loadConfig(): Config {
  getDataDir(); // ensure dir exists
  if (!existsSync(CONFIG_FILE)) {
    return { ...DEFAULT_CONFIG };
  }
  try {
    const raw = readFileSync(CONFIG_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveConfig(config: Config): void {
  getDataDir();
  writeFileSync(CONFIG_FILE, `${JSON.stringify(config, null, 2)}\n`);
}

/**
 * Resolve a config value with precedence: flag > env > config > default
 */
export function resolveModel(flagModel?: string): string {
  if (flagModel) return flagModel;
  const envModel = process.env.PAPERCTL_MODEL;
  if (envModel) return envModel;
  const config = loadConfig();
  return config.model;
}

/**
 * Parse a duration string like "7d", "30d", "1d" into a Date
 */
export function parseSince(since: string): Date {
  const match = since.match(/^(\d+)d$/);
  if (!match) {
    throw new Error(`Invalid duration format: "${since}". Use format like "7d", "30d".`);
  }
  const days = Number.parseInt(match[1], 10);
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}
