import { describe, expect, it } from "vitest";
import { cn, formatCurrency, formatPercent, initials, truncate, clamp } from "./utils";

describe("utils", () => {
  it("merges and dedupes tailwind classes", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-sm", false && "hidden", "font-bold")).toBe("text-sm font-bold");
  });

  it("formats currency from cents", () => {
    expect(formatCurrency(19900)).toBe("$199");
    expect(formatCurrency(0)).toBe("$0");
  });

  it("formats percentages", () => {
    expect(formatPercent(94.2, 1)).toBe("94.2%");
    expect(formatPercent(82)).toBe("82%");
  });

  it("derives initials", () => {
    expect(initials("Ava Chen")).toBe("AC");
    expect(initials("madonna")).toBe("M");
  });

  it("truncates long text", () => {
    expect(truncate("hello world", 5)).toBe("hell…");
    expect(truncate("hi", 5)).toBe("hi");
  });

  it("clamps numbers to a range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(99, 0, 10)).toBe(10);
  });
});
