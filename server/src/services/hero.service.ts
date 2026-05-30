import { pool } from "../db/connection";
import { PlayerHero } from "../types/player";
import {
  MAX_HERO_LEVEL,
  MAX_STAR_RATING,
  MAX_SKILL_LEVEL,
  STAR_MULTIPLIERS,
  levelMultiplier,
} from "../config/game-constants";
import { calculateAttributes } from "../utils/hero.utils";
import * as heroRepository from "../repositories/hero.repository";
import * as heroTemplateRepository from "../repositories/hero-template.repository";
import * as formationRepository from "../repositories/formation.repository";
import * as inventoryRepository from "../repositories/inventory.repository";
import * as resourceRepository from "../repositories/resource.repository";

/**
 * Returns all heroes for a player, marking active status based on formation membership.
 */
export async function getHeroes(playerId: string): Promise<PlayerHero[]> {
  const [heroes, formation] = await Promise.all([
    heroRepository.getHeroesByPlayer(playerId),
    formationRepository.getFormation(playerId),
  ]);

  const formationSet = new Set(formation.heroIds);

  return heroes.map((hero) => ({
    ...hero,
    active: formationSet.has(hero.id),
  }));
}

/**
 * Returns a single hero's details, checking ownership and marking active status.
 */
export async function getHeroDetail(
  heroId: string,
  playerId: string
): Promise<PlayerHero> {
  const hero = await heroRepository.getHeroById(heroId, playerId);
  if (!hero) {
    throw new Error("Hero not found");
  }

  const formation = await formationRepository.getFormation(playerId);
  const formationSet = new Set(formation.heroIds);

  return {
    ...hero,
    active: formationSet.has(hero.id),
  };
}

/**
 * Levels up a hero by 1, recalculating attributes.
 * Enforces ownership and max level (100).
 */
export async function levelUpHero(
  heroId: string,
  playerId: string
): Promise<PlayerHero> {
  const hero = await heroRepository.getHeroById(heroId, playerId);
  if (!hero) {
    throw new Error("Hero not found");
  }

  if (hero.level >= MAX_HERO_LEVEL) {
    throw new Error("Maximum level reached");
  }

  const newLevel = hero.level + 1;
  const baseAttributes = await getBaseAttributes(hero);
  const newAttributes = calculateAttributes(
    baseAttributes,
    newLevel,
    hero.stars
  );

  const updated = await heroRepository.updateHeroLevel(
    heroId,
    newLevel,
    newAttributes
  );
  if (!updated) {
    throw new Error("Failed to update hero level");
  }

  return updated;
}

/**
 * Sets a hero to a specific level, recalculating attributes.
 * Used by battle reward system when hero accumulates enough XP.
 */
export async function setHeroLevel(
  heroId: string,
  playerId: string,
  targetLevel: number
): Promise<PlayerHero> {
  const hero = await heroRepository.getHeroById(heroId, playerId);
  if (!hero) {
    throw new Error("Hero not found");
  }

  const newLevel = Math.min(targetLevel, MAX_HERO_LEVEL);
  if (newLevel <= hero.level) return hero; // No change needed

  const baseAttributes = await getBaseAttributes(hero);
  const newAttributes = calculateAttributes(baseAttributes, newLevel, hero.stars);

  const updated = await heroRepository.updateHeroLevel(heroId, newLevel, newAttributes);
  if (!updated) {
    throw new Error("Failed to update hero level");
  }

  return updated;
}

/**
 * Upgrades a hero's star rating by 1, recalculating attributes.
 * Enforces ownership and max stars (5).
 */
export async function upgradeStars(
  heroId: string,
  playerId: string
): Promise<PlayerHero> {
  const hero = await heroRepository.getHeroById(heroId, playerId);
  if (!hero) {
    throw new Error("Hero not found");
  }

  if (hero.stars >= MAX_STAR_RATING) {
    throw new Error("Maximum star rating reached");
  }

  const newStars = hero.stars + 1;
  const baseAttributes = await getBaseAttributes(hero);
  const newAttributes = calculateAttributes(
    baseAttributes,
    hero.level,
    newStars
  );

  const updated = await heroRepository.updateHeroStars(
    heroId,
    newStars,
    newAttributes
  );
  if (!updated) {
    throw new Error("Failed to update hero stars");
  }

  return updated;
}

/**
 * Equips a rune from the player's inventory to a hero's rune slot.
 * Uses a transaction to atomically update hero runes and remove from inventory.
 */
export async function equipRune(
  heroId: string,
  playerId: string,
  slotIndex: number,
  runeId: string
): Promise<PlayerHero> {
  const hero = await heroRepository.getHeroById(heroId, playerId);
  if (!hero) {
    throw new Error("Hero not found");
  }

  // slotIndex is 1-based, array is 0-based
  const arrayIndex = slotIndex - 1;
  if (hero.runes[arrayIndex] !== null) {
    throw new Error("Slot is occupied");
  }

  const inventoryItem = await inventoryRepository.getItemById(runeId, playerId);
  if (!inventoryItem) {
    throw new Error("Rune not found in inventory");
  }

  // Use transaction for atomic equip
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Build the new runes array
    const newRunes = [...hero.runes];
    newRunes[arrayIndex] = {
      id: inventoryItem.id,
      name: (inventoryItem.itemData.name as string) || "Unknown Rune",
      icon: (inventoryItem.itemData.icon as string) || "",
      level: (inventoryItem.itemData.level as number) || 1,
    };

    // Update hero runes
    await client.query(
      `UPDATE player_heroes SET runes = $1, updated_at = NOW() WHERE id = $2`,
      [JSON.stringify(newRunes), heroId]
    );

    // Remove rune from inventory
    await client.query(`DELETE FROM player_inventory WHERE id = $1`, [runeId]);

    await client.query("COMMIT");

    // Return updated hero
    const updated = await heroRepository.getHeroById(heroId, playerId);
    if (!updated) {
      throw new Error("Failed to retrieve updated hero");
    }
    return updated;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Unequips a rune from a hero's slot and returns it to the player's inventory.
 * Uses a transaction to atomically update hero runes and add to inventory.
 */
export async function unequipRune(
  heroId: string,
  playerId: string,
  slotIndex: number
): Promise<PlayerHero> {
  const hero = await heroRepository.getHeroById(heroId, playerId);
  if (!hero) {
    throw new Error("Hero not found");
  }

  // slotIndex is 1-based, array is 0-based
  const arrayIndex = slotIndex - 1;
  const rune = hero.runes[arrayIndex];
  if (rune === null) {
    throw new Error("Slot is empty");
  }

  // Use transaction for atomic unequip
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Build the new runes array with the slot cleared
    const newRunes = [...hero.runes];
    newRunes[arrayIndex] = null;

    // Update hero runes
    await client.query(
      `UPDATE player_heroes SET runes = $1, updated_at = NOW() WHERE id = $2`,
      [JSON.stringify(newRunes), heroId]
    );

    // Add rune back to inventory
    await client.query(
      `INSERT INTO player_inventory (player_id, item_type, item_data) VALUES ($1, $2, $3)`,
      [
        playerId,
        "rune",
        JSON.stringify({
          name: rune.name,
          icon: rune.icon,
          level: rune.level,
        }),
      ]
    );

    await client.query("COMMIT");

    // Return updated hero
    const updated = await heroRepository.getHeroById(heroId, playerId);
    if (!updated) {
      throw new Error("Failed to retrieve updated hero");
    }
    return updated;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Upgrades a hero's skill by 1 level, deducting the required gold.
 * Cost: 100 * (currentSkillLevel + 1) gold per upgrade.
 * Enforces ownership, skill existence, max skill level (20), and sufficient resources.
 */
export async function upgradeSkill(
  heroId: string,
  playerId: string,
  skillIndex: number
): Promise<PlayerHero> {
  const hero = await heroRepository.getHeroById(heroId, playerId);
  if (!hero) {
    throw new Error("Hero not found");
  }

  if (skillIndex < 0 || skillIndex >= hero.skills.length) {
    throw new Error("Skill not found");
  }

  const skill = hero.skills[skillIndex];
  if (skill.level >= MAX_SKILL_LEVEL) {
    throw new Error("Skill is at maximum level");
  }

  const cost = 100 * (skill.level + 1);

  // Deduct gold atomically
  const updatedResources = await resourceRepository.deductResource(
    playerId,
    "gold",
    cost
  );
  if (!updatedResources) {
    throw new Error("Insufficient resources");
  }

  // Update skill level
  const newSkills = [...hero.skills];
  newSkills[skillIndex] = { ...skill, level: skill.level + 1 };

  const updated = await heroRepository.updateHeroSkills(heroId, newSkills);
  if (!updated) {
    throw new Error("Failed to update hero skills");
  }

  return updated;
}

/**
 * Fetches the true base attributes from the hero_templates table.
 * This replaces the fragile reverse-calculation approach.
 * Falls back to reverse-calculation if the template is not found (shouldn't happen).
 */
async function getBaseAttributes(hero: PlayerHero) {
  const template = await heroTemplateRepository.getTemplateById(
    hero.heroTemplateId
  );

  if (template) {
    return {
      attack: template.baseAttack,
      armor: template.baseArmor,
      hp: template.baseHp,
    };
  }

  // Fallback: reverse-calculate (legacy behavior, should not be reached)
  const currentStarMult = STAR_MULTIPLIERS[hero.stars - 1];
  const currentLevelMult = levelMultiplier(hero.level);
  const divisor = currentStarMult * currentLevelMult;

  return {
    attack: Math.round(hero.attributes.attack / divisor),
    armor: Math.round(hero.attributes.armor / divisor),
    hp: Math.round(hero.attributes.hp / divisor),
  };
}
