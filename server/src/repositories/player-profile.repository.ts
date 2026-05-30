import { query } from "../db/connection";
import { PlayerProfile, PlayerResources } from "../types/player";
import { INITIAL_RESOURCES } from "../config/game-constants";
import { generateDefaultDisplayName } from "../utils/player.utils";
import { calculateLevelFromExperience } from "../utils/player.utils";

// --- Row interfaces (snake_case from PostgreSQL) ---

interface PlayerProfileRow {
  id: string;
  wallet_address: string;
  display_name: string | null;
  level: number;
  experience: string; // BIGINT comes as string from pg
  created_at: Date;
  last_login_at: Date;
}

interface PlayerResourceRow {
  player_id: string;
  gold: number;
  gems: number;
  energy: number;
  updated_at: Date;
}

// --- Mappers ---

function mapRowToProfile(
  row: PlayerProfileRow,
  resources: PlayerResources
): PlayerProfile {
  const experience = Number(row.experience);
  const { level, experienceToNextLevel } = calculateLevelFromExperience(experience);

  return {
    id: row.id,
    walletAddress: row.wallet_address,
    displayName: row.display_name,
    level,
    experience,
    experienceToNextLevel,
    resources,
    createdAt: row.created_at.toISOString(),
    lastLoginAt: row.last_login_at.toISOString(),
  };
}

function mapRowToResources(row: PlayerResourceRow): PlayerResources {
  return {
    gold: row.gold,
    gems: row.gems,
    energy: row.energy,
  };
}

// --- Repository functions ---

/**
 * Retrieves the full player profile including resources.
 * Returns null if the player does not exist.
 */
export async function getProfile(playerId: string): Promise<PlayerProfile | null> {
  const playerResult = await query<PlayerProfileRow>(
    "SELECT id, wallet_address, display_name, level, experience, created_at, last_login_at FROM players WHERE id = $1",
    [playerId]
  );

  if (playerResult.rows.length === 0) {
    return null;
  }

  const resources = await getResourceBalances(playerId);

  return mapRowToProfile(playerResult.rows[0], resources);
}

/**
 * Updates the player's display name.
 * Returns the updated profile or null if the player does not exist.
 */
export async function updateDisplayName(
  playerId: string,
  name: string
): Promise<PlayerProfile | null> {
  const result = await query<PlayerProfileRow>(
    "UPDATE players SET display_name = $1 WHERE id = $2 RETURNING id, wallet_address, display_name, level, experience, created_at, last_login_at",
    [name, playerId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const resources = await getResourceBalances(playerId);
  return mapRowToProfile(result.rows[0], resources);
}

/**
 * Initializes a new player's profile fields (display_name, level, experience).
 * Called after the player row is created during auth.
 */
export async function initializeProfile(
  playerId: string,
  walletAddress: string
): Promise<PlayerProfile | null> {
  const defaultName = generateDefaultDisplayName(walletAddress);

  const result = await query<PlayerProfileRow>(
    "UPDATE players SET display_name = $1, level = 1, experience = 0 WHERE id = $2 RETURNING id, wallet_address, display_name, level, experience, created_at, last_login_at",
    [defaultName, playerId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const resources = await getResourceBalances(playerId);
  return mapRowToProfile(result.rows[0], resources);
}

/**
 * Atomically adds experience to a player.
 * Uses UPDATE ... SET experience = experience + $1 for atomicity.
 * Returns the updated profile or null if the player does not exist.
 */
export async function addExperience(
  playerId: string,
  amount: number
): Promise<PlayerProfile | null> {
  const result = await query<PlayerProfileRow>(
    "UPDATE players SET experience = experience + $1 WHERE id = $2 RETURNING id, wallet_address, display_name, level, experience, created_at, last_login_at",
    [amount, playerId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const resources = await getResourceBalances(playerId);
  return mapRowToProfile(result.rows[0], resources);
}

/**
 * Retrieves the player's resource balances.
 * Returns zero-value resources if no resource row exists.
 */
export async function getResourceBalances(playerId: string): Promise<PlayerResources> {
  const result = await query<PlayerResourceRow>(
    "SELECT player_id, gold, gems, energy, updated_at FROM player_resources WHERE player_id = $1",
    [playerId]
  );

  if (result.rows.length === 0) {
    return { gold: 0, gems: 0, energy: 0 };
  }

  return mapRowToResources(result.rows[0]);
}

/**
 * Initializes the player_resources row with default values.
 * Uses INSERT ... ON CONFLICT to be idempotent.
 */
export async function initializeResources(playerId: string): Promise<PlayerResources> {
  const result = await query<PlayerResourceRow>(
    `INSERT INTO player_resources (player_id, gold, gems, energy)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (player_id) DO NOTHING
     RETURNING player_id, gold, gems, energy, updated_at`,
    [playerId, INITIAL_RESOURCES.gold, INITIAL_RESOURCES.gems, INITIAL_RESOURCES.energy]
  );

  // If ON CONFLICT hit (already exists), fetch the existing row
  if (result.rows.length === 0) {
    return getResourceBalances(playerId);
  }

  return mapRowToResources(result.rows[0]);
}
