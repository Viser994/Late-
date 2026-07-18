import { describe, expect, it } from "vitest";
import { UserRole } from "@prisma/client";
import { can, isAtLeastRole } from "@/lib/rbac";

describe("RBAC", () => {
  it("allows owner to manage billing", () => {
    expect(can(UserRole.OWNER, "billing", "manage")).toBe(true);
  });

  it("prevents viewer from writing questionnaires", () => {
    expect(can(UserRole.VIEWER, "questionnaire", "write")).toBe(false);
  });

  it("preserves role hierarchy ordering", () => {
    expect(isAtLeastRole(UserRole.ADMIN, UserRole.SECURITY_MANAGER)).toBe(true);
    expect(isAtLeastRole(UserRole.SECURITY_ANALYST, UserRole.ADMIN)).toBe(false);
  });
});
