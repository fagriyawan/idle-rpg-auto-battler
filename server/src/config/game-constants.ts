export const MAX_PLAYER_LEVEL = 100;
export const MAX_HERO_LEVEL = 100;
export const MAX_STAR_RATING = 5;
export const MAX_SKILL_LEVEL = 20;
export const MAX_FORMATION_SIZE = 5;
export const RUNE_SLOTS_PER_HERO = 4;

export const RESOURCE_CAPS = {
  gold: 999_999,
  gems: 99_999,
  energy: 200,
} as const;

export const INITIAL_RESOURCES = {
  gold: 500,
  gems: 50,
  energy: 100,
} as const;

// Star tier multipliers for attribute scaling (index 0 = 1 star, index 4 = 5 stars)
export const STAR_MULTIPLIERS = [1.0, 1.2, 1.5, 1.8, 2.2] as const;

// Level multiplier: base_stat * (1 + 0.05 * (level - 1))
export function levelMultiplier(level: number): number {
  return 1 + 0.05 * (level - 1);
}

// XP required to reach a given level: 100 * level * (level - 1) / 2
export function experienceForLevel(level: number): number {
  return (100 * level * (level - 1)) / 2;
}

// Hero XP: cumulative XP needed to reach hero level N
// Level 1→2: 500, Level 2→3: 1000, Level 3→4: 1500, ...
// Cumulative: heroXpForLevel(N) = 500 * N * (N-1) / 2
export function heroXpForLevel(level: number): number {
  return (500 * level * (level - 1)) / 2;
}

// Calculate hero level from accumulated XP
export function calculateHeroLevelFromXp(xp: number): { level: number; xpToNextLevel: number } {
  let level = 1;
  for (let n = 2; n <= MAX_HERO_LEVEL; n++) {
    if (heroXpForLevel(n) <= xp) {
      level = n;
    } else {
      break;
    }
  }
  const xpToNextLevel = level >= MAX_HERO_LEVEL ? 0 : heroXpForLevel(level + 1) - xp;
  return { level, xpToNextLevel };
}
