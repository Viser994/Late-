import { describe, expect, it } from "vitest";
import { atLeast, can, assertCan, ROLE_RANK } from "./rbac";

describe("rbac", () => {
  it("grants owners billing access", () => {
    expect(can("OWNER", "org:billing")).toBe(true);
  });

  it("denies viewers write access", () => {
    expect(can("VIEWER", "documents:write")).toBe(false);
    expect(can("VIEWER", "answers:approve")).toBe(false);
  });

  it("lets analysts draft but not approve answers", () => {
    expect(can("SECURITY_ANALYST", "answers:draft")).toBe(true);
    expect(can("SECURITY_ANALYST", "answers:approve")).toBe(false);
  });

  it("lets security managers approve answers", () => {
    expect(can("SECURITY_MANAGER", "answers:approve")).toBe(true);
  });

  it("inherits lower-role permissions up the hierarchy", () => {
    expect(can("ADMIN", "documents:read")).toBe(true);
    expect(can("OWNER", "members:manage")).toBe(true);
  });

  it("compares role seniority", () => {
    expect(atLeast("ADMIN", "SECURITY_ANALYST")).toBe(true);
    expect(atLeast("VIEWER", "ADMIN")).toBe(false);
    expect(ROLE_RANK.OWNER).toBeGreaterThan(ROLE_RANK.ADMIN);
  });

  it("throws on missing permission", () => {
    expect(() => assertCan("VIEWER", "org:billing")).toThrow(/Forbidden/);
    expect(() => assertCan("OWNER", "org:billing")).not.toThrow();
  });
});
