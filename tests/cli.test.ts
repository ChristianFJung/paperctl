import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const binPath = resolve(import.meta.dirname, "../bin/paperctl");

describe("CLI smoke tests", () => {
  it("--help exits 0 and prints usage", () => {
    const result = execFileSync("node", [binPath, "--help"], {
      encoding: "utf-8",
    });
    expect(result).toContain("paperctl");
    expect(result).toContain("Usage");
  });

  it("--version exits 0 and prints version", () => {
    const result = execFileSync("node", [binPath, "--version"], {
      encoding: "utf-8",
    });
    expect(result.trim()).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
