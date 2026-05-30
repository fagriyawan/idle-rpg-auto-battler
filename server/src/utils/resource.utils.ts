/**
 * Pure resource operation utilities for deducting and awarding resources.
 * These functions contain no DB access and are designed to be property-tested.
 */

export type ResourceResult =
  | { success: true; newBalance: number }
  | { success: false; error: string };

/**
 * Deducts a specified amount from a resource balance.
 *
 * @param balance - Current resource balance (must be non-negative integer)
 * @param amount - Amount to deduct (must be a positive integer, minimum 1)
 * @returns Success with new balance, or failure with error message
 *
 * Validates: Requirements 2.3, 2.4
 */
export function deductResource(balance: number, amount: number): ResourceResult {
  if (!Number.isInteger(amount) || amount < 1) {
    return { success: false, error: 'Amount must be a positive integer (minimum 1)' };
  }

  if (!Number.isInteger(balance) || balance < 0) {
    return { success: false, error: 'Balance must be a non-negative integer' };
  }

  if (amount > balance) {
    return { success: false, error: 'Insufficient resources' };
  }

  return { success: true, newBalance: balance - amount };
}

/**
 * Awards a specified amount to a resource balance, clamping at the cap.
 *
 * @param balance - Current resource balance (must be non-negative integer)
 * @param amount - Amount to award (must be a positive integer, minimum 1)
 * @param cap - Maximum allowed balance for this resource type
 * @returns Success with new clamped balance, or failure with error message
 *
 * Validates: Requirements 2.5, 2.6
 */
export function awardResource(balance: number, amount: number, cap: number): ResourceResult {
  if (!Number.isInteger(amount) || amount < 1) {
    return { success: false, error: 'Amount must be a positive integer (minimum 1)' };
  }

  if (!Number.isInteger(balance) || balance < 0) {
    return { success: false, error: 'Balance must be a non-negative integer' };
  }

  if (!Number.isInteger(cap) || cap < 0) {
    return { success: false, error: 'Cap must be a non-negative integer' };
  }

  const newBalance = Math.min(balance + amount, cap);
  return { success: true, newBalance };
}
