import { experienceForLevel, MAX_PLAYER_LEVEL } from '../config/game-constants';

/**
 * Calculates the player's level from their total accumulated experience.
 *
 * Finds the highest level N (1 ≤ N ≤ 100) such that experienceForLevel(N) ≤ xp.
 * Returns the level and the XP remaining until the next level (0 if at max level).
 */
export function calculateLevelFromExperience(xp: number): {
  level: number;
  experienceToNextLevel: number;
} {
  let level = 1;

  for (let n = 2; n <= MAX_PLAYER_LEVEL; n++) {
    if (experienceForLevel(n) <= xp) {
      level = n;
    } else {
      break;
    }
  }

  const experienceToNextLevel =
    level >= MAX_PLAYER_LEVEL ? 0 : experienceForLevel(level + 1) - xp;

  return { level, experienceToNextLevel };
}

/**
 * Generates a default display name from a wallet address.
 *
 * For wallet "0x1a2b3cDEF..." → "Player_1a2b3c"
 * Takes the first 6 hex characters after the "0x" prefix, lowercased.
 */
export function generateDefaultDisplayName(walletAddress: string): string {
  const hexChars = walletAddress.slice(2, 8).toLowerCase();
  return `Player_${hexChars}`;
}
