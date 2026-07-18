import { describe, expect, it } from "vitest";
import { chunkText, estimateTokens } from "./chunking";

describe("chunking", () => {
  it("returns no chunks for empty input", () => {
    expect(chunkText("")).toEqual([]);
    expect(chunkText("   \n\n  ")).toEqual([]);
  });

  it("keeps small text in a single chunk", () => {
    const chunks = chunkText("A short security policy statement.");
    expect(chunks).toHaveLength(1);
    expect(chunks[0].index).toBe(0);
  });

  it("splits long text into multiple ordered chunks", () => {
    const paragraph = "This is a sentence about encryption and access control. ".repeat(60);
    const text = `${paragraph}\n\n${paragraph}\n\n${paragraph}`;
    const chunks = chunkText(text, { maxTokens: 100, overlapTokens: 10 });
    expect(chunks.length).toBeGreaterThan(1);
    chunks.forEach((c, i) => expect(c.index).toBe(i));
    chunks.forEach((c) => expect(c.tokenCount).toBeGreaterThan(0));
  });

  it("estimates tokens roughly from length", () => {
    expect(estimateTokens("")).toBe(0);
    expect(estimateTokens("abcd")).toBe(1);
    expect(estimateTokens("a".repeat(400))).toBe(100);
  });
});
