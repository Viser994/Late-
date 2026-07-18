import { describe, it, expect } from "vitest";
import { hasPermission, hasMinRole } from "@/lib/permissions";
import { splitIntoChunks } from "@/lib/ai/embeddings";
import { parseQuestionsFromText } from "@/lib/questionnaires/parser";
import { slugify, formatBytes } from "@/lib/utils";

describe("permissions", () => {
  it("grants owner all permissions", () => {
    expect(hasPermission("OWNER", "org:billing")).toBe(true);
    expect(hasPermission("OWNER", "admin:access")).toBe(true);
  });

  it("restricts viewer permissions", () => {
    expect(hasPermission("VIEWER", "documents:upload")).toBe(false);
    expect(hasPermission("VIEWER", "analytics:view")).toBe(true);
  });

  it("checks role hierarchy", () => {
    expect(hasMinRole("ADMIN", "SECURITY_MANAGER")).toBe(true);
    expect(hasMinRole("VIEWER", "ADMIN")).toBe(false);
  });
});

describe("embeddings", () => {
  it("splits text into chunks", () => {
    const text = Array.from({ length: 5 }, (_, i) =>
      `Paragraph ${i + 1}: ${"A".repeat(500)}`
    ).join("\n\n");
    const chunks = splitIntoChunks(text);
    expect(chunks.length).toBeGreaterThan(1);
  });

  it("returns single chunk for short text", () => {
    const chunks = splitIntoChunks("Short text");
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toBe("Short text");
  });
});

describe("questionnaire parser", () => {
  it("detects numbered questions", () => {
    const text = `
Section 1: Access Control

1. Do you enforce multi-factor authentication?
2. How often are access reviews performed?

3. Describe your password policy requirements.
    `;
    const questions = parseQuestionsFromText(text);
    expect(questions.length).toBeGreaterThanOrEqual(2);
    expect(questions[0].text).toContain("multi-factor");
  });

  it("detects yes/no questions", () => {
    const questions = parseQuestionsFromText(
      "1. Do you encrypt data at rest?"
    );
    expect(questions[0].questionType).toBe("YES_NO");
  });
});

describe("utils", () => {
  it("formats bytes", () => {
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatBytes(0)).toBe("0 B");
  });

  it("slugifies text", () => {
    expect(slugify("Hello World!")).toBe("hello-world");
  });
});
