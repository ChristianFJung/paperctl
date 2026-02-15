import { describe, expect, it } from "vitest";
import { parseSince } from "../src/lib/config.ts";

describe("parseSince", () => {
  it("parses '7d' to a date ~7 days ago", () => {
    const result = parseSince("7d");
    const expected = new Date();
    expected.setDate(expected.getDate() - 7);
    // Allow 1 second tolerance
    expect(Math.abs(result.getTime() - expected.getTime())).toBeLessThan(1000);
  });

  it("parses '1d' to a date ~1 day ago", () => {
    const result = parseSince("1d");
    const expected = new Date();
    expected.setDate(expected.getDate() - 1);
    expect(Math.abs(result.getTime() - expected.getTime())).toBeLessThan(1000);
  });

  it("parses '30d' to a date ~30 days ago", () => {
    const result = parseSince("30d");
    const expected = new Date();
    expected.setDate(expected.getDate() - 30);
    expect(Math.abs(result.getTime() - expected.getTime())).toBeLessThan(1000);
  });

  it("throws on invalid format", () => {
    expect(() => parseSince("7h")).toThrow("Invalid duration format");
    expect(() => parseSince("abc")).toThrow("Invalid duration format");
    expect(() => parseSince("")).toThrow("Invalid duration format");
  });

  it("throws on missing number", () => {
    expect(() => parseSince("d")).toThrow("Invalid duration format");
  });
});
