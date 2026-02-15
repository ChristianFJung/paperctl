import { describe, expect, it } from "vitest";
import { normalizeArxivId } from "../src/lib/arxiv.ts";

describe("normalizeArxivId", () => {
  it("handles bare new-style IDs", () => {
    expect(normalizeArxivId("2401.12345")).toBe("2401.12345");
  });

  it("handles new-style IDs with version", () => {
    expect(normalizeArxivId("2401.12345v2")).toBe("2401.12345v2");
  });

  it("handles 4-digit suffix IDs", () => {
    expect(normalizeArxivId("2401.1234")).toBe("2401.1234");
  });

  it("extracts ID from abs URL", () => {
    expect(normalizeArxivId("https://arxiv.org/abs/2401.12345")).toBe("2401.12345");
  });

  it("extracts ID from pdf URL", () => {
    expect(normalizeArxivId("https://arxiv.org/pdf/2401.12345")).toBe("2401.12345");
  });

  it("extracts versioned ID from URL", () => {
    expect(normalizeArxivId("https://arxiv.org/abs/2401.12345v3")).toBe("2401.12345v3");
  });

  it("handles old-style IDs", () => {
    expect(normalizeArxivId("hep-ph/9905221")).toBe("hep-ph/9905221");
  });

  it("handles old-style IDs from URLs", () => {
    expect(normalizeArxivId("https://arxiv.org/abs/hep-ph/9905221")).toBe("hep-ph/9905221");
  });

  it("returns unrecognized input as-is", () => {
    expect(normalizeArxivId("not-an-id")).toBe("not-an-id");
  });
});
