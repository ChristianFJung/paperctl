/**
 * TTY detection, color support, and output formatting
 */

import { WriteStream } from "tty";

let _noColor = false;

export function setNoColor(val: boolean): void {
  _noColor = val;
}

export function shouldColor(): boolean {
  if (_noColor) return false;
  if (process.env.NO_COLOR !== undefined) return false;
  if (process.env.TERM === "dumb") return false;
  return (process.stdout as WriteStream).isTTY === true;
}

// ANSI color helpers
const esc = (code: string) => (text: string) =>
  shouldColor() ? `\x1b[${code}m${text}\x1b[0m` : text;

export const bold = esc("1");
export const dim = esc("2");
export const green = esc("32");
export const yellow = esc("33");
export const red = esc("31");
export const cyan = esc("36");
export const magenta = esc("35");

// Output helpers
export function info(msg: string): void {
  process.stderr.write(msg + "\n");
}

export function success(msg: string): void {
  process.stderr.write(green("✓") + " " + msg + "\n");
}

export function warn(msg: string): void {
  process.stderr.write(yellow("⚠") + " " + msg + "\n");
}

export function error(msg: string): void {
  process.stderr.write(red("✗") + " " + msg + "\n");
}

export function output(data: unknown): void {
  if (typeof data === "string") {
    process.stdout.write(data + "\n");
  } else {
    process.stdout.write(JSON.stringify(data, null, 2) + "\n");
  }
}

/**
 * Truncate a string to maxLen, appending "..." if truncated
 */
export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + "...";
}

/**
 * Format a date string for display
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return "unknown";
  try {
    const d = new Date(dateStr);
    return d.toISOString().split("T")[0];
  } catch {
    return dateStr;
  }
}

/**
 * Pad string to width
 */
export function pad(str: string, width: number): string {
  if (str.length >= width) return str;
  return str + " ".repeat(width - str.length);
}
