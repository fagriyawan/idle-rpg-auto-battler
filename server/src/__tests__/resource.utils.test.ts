import { describe, it, expect } from "vitest";
import { deductResource, awardResource } from "../utils/resource.utils";
import { RESOURCE_CAPS } from "../config/game-constants";

describe("deductResource", () => {
  it("should deduct amount from balance when sufficient funds", () => {
    const result = deductResource(500, 200);
    expect(result).toEqual({ success: true, newBalance: 300 });
  });

  it("should return zero balance when deducting exact balance", () => {
    const result = deductResource(100, 100);
    expect(result).toEqual({ success: true, newBalance: 0 });
  });

  it("should reject when amount exceeds balance", () => {
    const result = deductResource(50, 100);
    expect(result).toEqual({ success: false, error: "Insufficient resources" });
  });

  it("should reject when amount is zero", () => {
    const result = deductResource(100, 0);
    expect(result).toEqual({
      success: false,
      error: "Amount must be a positive integer (minimum 1)",
    });
  });

  it("should reject when amount is negative", () => {
    const result = deductResource(100, -5);
    expect(result).toEqual({
      success: false,
      error: "Amount must be a positive integer (minimum 1)",
    });
  });

  it("should reject when amount is not an integer", () => {
    const result = deductResource(100, 2.5);
    expect(result).toEqual({
      success: false,
      error: "Amount must be a positive integer (minimum 1)",
    });
  });

  it("should reject when balance is negative", () => {
    const result = deductResource(-10, 5);
    expect(result).toEqual({
      success: false,
      error: "Balance must be a non-negative integer",
    });
  });

  it("should reject when balance is not an integer", () => {
    const result = deductResource(10.5, 5);
    expect(result).toEqual({
      success: false,
      error: "Balance must be a non-negative integer",
    });
  });

  it("should handle deducting 1 from balance of 1", () => {
    const result = deductResource(1, 1);
    expect(result).toEqual({ success: true, newBalance: 0 });
  });
});

describe("awardResource", () => {
  it("should add amount to balance when below cap", () => {
    const result = awardResource(100, 50, RESOURCE_CAPS.gold);
    expect(result).toEqual({ success: true, newBalance: 150 });
  });

  it("should clamp to cap when sum exceeds cap", () => {
    const result = awardResource(999_990, 100, RESOURCE_CAPS.gold);
    expect(result).toEqual({ success: true, newBalance: 999_999 });
  });

  it("should return cap when balance is already at cap", () => {
    const result = awardResource(999_999, 1, RESOURCE_CAPS.gold);
    expect(result).toEqual({ success: true, newBalance: 999_999 });
  });

  it("should clamp energy to 200", () => {
    const result = awardResource(190, 50, RESOURCE_CAPS.energy);
    expect(result).toEqual({ success: true, newBalance: 200 });
  });

  it("should reject when amount is zero", () => {
    const result = awardResource(100, 0, RESOURCE_CAPS.gold);
    expect(result).toEqual({
      success: false,
      error: "Amount must be a positive integer (minimum 1)",
    });
  });

  it("should reject when amount is negative", () => {
    const result = awardResource(100, -10, RESOURCE_CAPS.gold);
    expect(result).toEqual({
      success: false,
      error: "Amount must be a positive integer (minimum 1)",
    });
  });

  it("should reject when amount is not an integer", () => {
    const result = awardResource(100, 1.5, RESOURCE_CAPS.gold);
    expect(result).toEqual({
      success: false,
      error: "Amount must be a positive integer (minimum 1)",
    });
  });

  it("should reject when balance is negative", () => {
    const result = awardResource(-10, 5, RESOURCE_CAPS.gold);
    expect(result).toEqual({
      success: false,
      error: "Balance must be a non-negative integer",
    });
  });

  it("should reject when balance is not an integer", () => {
    const result = awardResource(10.5, 5, RESOURCE_CAPS.gold);
    expect(result).toEqual({
      success: false,
      error: "Balance must be a non-negative integer",
    });
  });

  it("should reject when cap is negative", () => {
    const result = awardResource(10, 5, -1);
    expect(result).toEqual({
      success: false,
      error: "Cap must be a non-negative integer",
    });
  });

  it("should handle awarding 1 to balance of 0", () => {
    const result = awardResource(0, 1, RESOURCE_CAPS.gold);
    expect(result).toEqual({ success: true, newBalance: 1 });
  });
});
