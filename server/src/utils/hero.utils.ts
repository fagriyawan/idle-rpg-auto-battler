import { levelMultiplier, STAR_MULTIPLIERS } from '../config/game-constants';
import { HeroAttributes } from '../types/player';

/**
 * Calculates hero attributes by applying level and star multipliers to base attributes.
 *
 * Formula per attribute: floor(baseAttribute × STAR_MULTIPLIERS[stars - 1] × levelMultiplier(level))
 *
 * @param baseAttributes - The hero's base attributes before scaling
 * @param level - The hero's current level (1–100)
 * @param stars - The hero's current star rating (1–5)
 * @returns Scaled HeroAttributes with each value floored to an integer
 */
export function calculateAttributes(
  baseAttributes: HeroAttributes,
  level: number,
  stars: number
): HeroAttributes {
  const starMult = STAR_MULTIPLIERS[stars - 1];
  const lvlMult = levelMultiplier(level);

  return {
    attack: Math.floor(baseAttributes.attack * starMult * lvlMult),
    armor: Math.floor(baseAttributes.armor * starMult * lvlMult),
    hp: Math.floor(baseAttributes.hp * starMult * lvlMult),
  };
}
