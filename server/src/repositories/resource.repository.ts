import { query } from "../db/connection";
import { PlayerResources } from "../types/player";
import { RESOURCE_CAPS } from "../config/game-constants";

// Whitelist of valid resource column names to prevent SQL injection
const VALID_RESOURCE_TYPES = ["gold", "gems", "energy"] as const;
export type ResourceType = (typeof VALID_RESOURCE_TYPES)[number];

interface PlayerResourcesRow {
  player_id: string;
  gold: number;
  gems: number;
  energy: number;
  updated_at: Date;
}

function mapRowToResources(row: PlayerResourcesRow): PlayerResources {
  return {
    gold: row.gold,
    gems: row.gems,
    energy: row.energy,
  };
}

function validateResourceType(resourceType: string): ResourceType {
  if (!VALID_RESOURCE_TYPES.includes(resourceType as ResourceType)) {
    throw new Error(
      `Invalid resource type: ${resourceType}. Must be one of: ${VALID_RESOURCE_TYPES.join(", ")}`
    );
  }
  return resourceType as ResourceType;
}

/**
 * Atomically deducts a resource amount from a player's balance.
 * Uses a WHERE clause to ensure the balance is sufficient, preventing negative balances.
 * Returns the updated resources if successful, or null if insufficient balance.
 */
export async function deductResource(
  playerId: string,
  resourceType: string,
  amount: number
): Promise<PlayerResources | null> {
  const column = validateResourceType(resourceType);

  const result = await query<PlayerResourcesRow>(
    `UPDATE player_resources
     SET ${column} = ${column} - $1, updated_at = NOW()
     WHERE player_id = $2 AND ${column} >= $1
     RETURNING *`,
    [amount, playerId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapRowToResources(result.rows[0]);
}

/**
 * Atomically awards a resource amount to a player's balance.
 * Clamps the result to the resource cap using LEAST to prevent exceeding maximum.
 * Returns the updated resources.
 */
export async function awardResource(
  playerId: string,
  resourceType: string,
  amount: number
): Promise<PlayerResources | null> {
  const column = validateResourceType(resourceType);
  const cap = RESOURCE_CAPS[column];

  const result = await query<PlayerResourcesRow>(
    `UPDATE player_resources
     SET ${column} = LEAST(${column} + $1, $2), updated_at = NOW()
     WHERE player_id = $3
     RETURNING *`,
    [amount, cap, playerId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapRowToResources(result.rows[0]);
}

/**
 * Gets the current resource balances for a player.
 * Returns null if the player has no resource record.
 */
export async function getResources(
  playerId: string
): Promise<PlayerResources | null> {
  const result = await query<PlayerResourcesRow>(
    "SELECT * FROM player_resources WHERE player_id = $1",
    [playerId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapRowToResources(result.rows[0]);
}

/**
 * Initializes resource balances for a new player with default values.
 * Uses the INITIAL_RESOURCES from game constants via the database defaults.
 */
export async function initializeResources(
  playerId: string
): Promise<PlayerResources> {
  const result = await query<PlayerResourcesRow>(
    `INSERT INTO player_resources (player_id)
     VALUES ($1)
     RETURNING *`,
    [playerId]
  );

  return mapRowToResources(result.rows[0]);
}
