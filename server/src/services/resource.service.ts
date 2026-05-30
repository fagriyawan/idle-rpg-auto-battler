import * as resourceRepository from "../repositories/resource.repository";
import { resourceOperationSchema } from "../validators/player.validators";
import { PlayerResources } from "../types/player";

/**
 * Retrieves the current resource balances for a player.
 * Returns null if the player has no resource record.
 */
export async function getResources(playerId: string): Promise<PlayerResources | null> {
  return resourceRepository.getResources(playerId);
}

/**
 * Deducts a specified amount of a resource from a player's balance.
 * Validates that the amount is a positive integer and the resource type is valid.
 * Throws an error if validation fails or if the player has insufficient balance.
 *
 * Validates: Requirements 2.2, 2.3, 2.4
 */
export async function deductResource(
  playerId: string,
  resourceType: string,
  amount: number
): Promise<PlayerResources> {
  // Validate input using the resourceOperationSchema
  const validation = resourceOperationSchema.safeParse({ resourceType, amount });
  if (!validation.success) {
    const firstIssue = validation.error.issues[0];
    throw new Error(firstIssue.message);
  }

  const { resourceType: validatedType, amount: validatedAmount } = validation.data;

  // Attempt atomic deduction — returns null if insufficient balance
  const result = await resourceRepository.deductResource(playerId, validatedType, validatedAmount);

  if (result === null) {
    // Fetch current balance to include in error details
    const current = await resourceRepository.getResources(playerId);
    const available = current ? current[validatedType] : 0;
    const error = new Error("Insufficient resources") as Error & {
      resource: string;
      required: number;
      available: number;
    };
    error.resource = validatedType;
    error.required = validatedAmount;
    error.available = available;
    throw error;
  }

  return result;
}

/**
 * Awards a specified amount of a resource to a player's balance.
 * Validates that the amount is a positive integer and the resource type is valid.
 * The result is clamped to the resource cap (atomic with cap clamping in the repository).
 *
 * Validates: Requirements 2.5, 2.6
 */
export async function awardResource(
  playerId: string,
  resourceType: string,
  amount: number
): Promise<PlayerResources> {
  // Validate input using the resourceOperationSchema
  const validation = resourceOperationSchema.safeParse({ resourceType, amount });
  if (!validation.success) {
    const firstIssue = validation.error.issues[0];
    throw new Error(firstIssue.message);
  }

  const { resourceType: validatedType, amount: validatedAmount } = validation.data;

  // Attempt atomic award with cap clamping
  const result = await resourceRepository.awardResource(playerId, validatedType, validatedAmount);

  if (result === null) {
    throw new Error("Player resource record not found");
  }

  return result;
}
