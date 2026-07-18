import { describe, expect, it } from "vitest";
import { splitIntoChunks } from "@/lib/documents/parse";

describe("splitIntoChunks", () => {
  it("returns non-empty chunks for long text", () => {
    const text = Array.from({ length: 30 }, (_, idx) => `Paragraph ${idx + 1} about SOC2 controls.`).join("\n\n");
    const chunks = splitIntoChunks(text, 120);
    expect(chunks.length).toBeGreaterThan(3);
    expect(chunks.every((chunk) => chunk.length <= 120)).toBe(true);
  });

  it("returns empty array for blank text", () => {
    expect(splitIntoChunks("   \n\n  ")).toEqual([]);
  });
});
