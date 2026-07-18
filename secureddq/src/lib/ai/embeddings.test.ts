import { describe, expect, it } from "vitest";
import { cosineSimilarity, mockEmbedding } from "./embeddings";
import { AI_CONFIG } from "./config";

describe("embeddings", () => {
  it("produces vectors of the configured dimension", () => {
    const v = mockEmbedding("encryption at rest");
    expect(v).toHaveLength(AI_CONFIG.embeddingDimensions);
  });

  it("is deterministic for the same input", () => {
    expect(mockEmbedding("password policy")).toEqual(mockEmbedding("password policy"));
  });

  it("scores identical text as maximally similar", () => {
    const a = mockEmbedding("we encrypt backups with aes-256");
    expect(cosineSimilarity(a, a)).toBeCloseTo(1, 5);
  });

  it("scores related text higher than unrelated text", () => {
    const query = mockEmbedding("do we encrypt backups");
    const related = mockEmbedding("backups are encrypted using aes-256 encryption");
    const unrelated = mockEmbedding("the office kitchen restocks snacks weekly");
    expect(cosineSimilarity(query, related)).toBeGreaterThan(cosineSimilarity(query, unrelated));
  });

  it("returns 0 similarity for a zero vector", () => {
    const zero = new Array(AI_CONFIG.embeddingDimensions).fill(0);
    expect(cosineSimilarity(zero, mockEmbedding("anything"))).toBe(0);
  });
});
