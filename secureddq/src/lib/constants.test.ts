import { describe, expect, it } from "vitest";
import { PLANS, PLAN_ORDER } from "./constants";

describe("plans", () => {
  it("defines all four tiers in ascending order", () => {
    expect(PLAN_ORDER).toEqual(["FREE", "STARTER", "PROFESSIONAL", "ENTERPRISE"]);
  });

  it("prices Starter at $49 and Professional at $199", () => {
    expect(PLANS.STARTER.priceMonthly).toBe(49);
    expect(PLANS.PROFESSIONAL.priceMonthly).toBe(199);
  });

  it("marks Enterprise as custom pricing", () => {
    expect(PLANS.ENTERPRISE.priceMonthly).toBeNull();
    expect(PLANS.ENTERPRISE.priceLabel).toBe("Custom");
  });

  it("limits the free plan to 2 users and 10 documents", () => {
    expect(PLANS.FREE.limits.users).toBe(2);
    expect(PLANS.FREE.limits.documents).toBe(10);
  });

  it("gives Professional unlimited users and documents", () => {
    expect(PLANS.PROFESSIONAL.limits.users).toBe("unlimited");
    expect(PLANS.PROFESSIONAL.limits.documents).toBe("unlimited");
  });

  it("highlights exactly one plan", () => {
    const highlighted = PLAN_ORDER.filter((t) => PLANS[t].highlighted);
    expect(highlighted).toEqual(["PROFESSIONAL"]);
  });
});
