import { describe, expect, it } from "vitest";
import { generateAnswer } from "./answer-engine";
import { retrieveRelevant } from "./retrieval";
import { getDemoCorpus } from "./demo-corpus";

describe("answer engine (offline/mock path)", () => {
  it("generates a grounded answer with citations for a covered question", async () => {
    const corpus = getDemoCorpus();
    const retrieved = await retrieveRelevant("Do we encrypt backups?", corpus, 5);
    const answer = await generateAnswer("Do we encrypt backups?", retrieved);

    expect(answer.content.length).toBeGreaterThan(0);
    expect(answer.aiGenerated).toBe(true);
    expect(answer.citations.length).toBeGreaterThan(0);
    expect(answer.confidence).toBeGreaterThan(0);
    expect(answer.confidence).toBeLessThanOrEqual(0.99);
  });

  it("returns low confidence and a fallback when no evidence is retrieved", async () => {
    const answer = await generateAnswer("Unrelated question with no docs?", []);
    expect(answer.confidence).toBeLessThanOrEqual(0.3);
    expect(answer.content).toMatch(/do not|don't|no documentation|route this/i);
  });

  it("ranks the most relevant document first", async () => {
    const corpus = getDemoCorpus();
    const retrieved = await retrieveRelevant(
      "access control policy passwords multi-factor authentication",
      corpus,
      3
    );
    expect(retrieved[0].documentTitle).toContain("Access Control");
  });
});
