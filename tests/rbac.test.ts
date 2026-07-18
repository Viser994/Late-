import { describe, expect, it } from "vitest";

import { can, permissionsFor } from "@/lib/rbac";

describe("rbac", () => {
  it("allows owners to manage billing and api keys", () => {
    expect(can("OWNER", "billing.manage")).toBe(true);
    expect(can("OWNER", "api_keys.manage")).toBe(true);
  });

  it("limits viewers to read-only workspace access", () => {
    expect(can("VIEWER", "documents.read")).toBe(true);
    expect(can("VIEWER", "questionnaires.read")).toBe(true);
    expect(can("VIEWER", "documents.write")).toBe(false);
    expect(can("VIEWER", "answers.review")).toBe(false);
  });

  it("keeps role permissions explicit", () => {
    expect(permissionsFor("SECURITY_ANALYST")).toContain("answers.review");
    expect(permissionsFor("SALES_ENGINEER")).not.toContain("documents.write");
  });
});
