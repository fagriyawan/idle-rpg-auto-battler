import * as playerProfileRepository from "../repositories/player-profile.repository";
import * as heroRepository from "../repositories/hero.repository";
import * as heroTemplateRepository from "../repositories/hero-template.repository";
import * as messageService from "./message.service";
import { PlayerProfile } from "../types/player";
import { displayNameSchema } from "../validators/player.validators";
import { CreateHeroData } from "../repositories/hero.repository";

/**
 * Retrieves the full player profile including resources.
 * Returns null if the player does not exist.
 */
export async function getPlayerProfile(
  playerId: string
): Promise<PlayerProfile | null> {
  return playerProfileRepository.getProfile(playerId);
}

/**
 * Initializes a new player with profile, resources, and 4 starter heroes.
 * Called after the player row is created during auth.
 * This operation is idempotent — if already initialized, it won't re-create heroes.
 */
export async function initializeNewPlayer(
  playerId: string,
  walletAddress: string
): Promise<PlayerProfile | null> {
  // Initialize profile (display name, level, experience)
  const profile = await playerProfileRepository.initializeProfile(
    playerId,
    walletAddress
  );

  if (!profile) {
    return null;
  }

  // Initialize resources (gold, gems, energy) — idempotent via ON CONFLICT DO NOTHING
  await playerProfileRepository.initializeResources(playerId);

  // Create starter heroes only if the player has no heroes yet
  const existingHeroes = await heroRepository.getHeroesByPlayer(playerId);
  if (existingHeroes.length === 0) {
    const starterTemplates =
      await heroTemplateRepository.getStarterTemplates();

    for (const template of starterTemplates) {
      // Build skills array: [0] = attack skill, [1+] = other skills
      const allSkills = [
        {
          name: template.attackSkillName,
          level: 1,
          icon: template.attackSkillIcon,
          description: template.attackSkillDescription,
        },
        ...template.skills.map((s) => ({
          name: s.name,
          level: 1,
          icon: s.icon,
          description: s.description,
        })),
      ];

      const heroData: CreateHeroData = {
        heroTemplateId: template.id,
        name: template.name,
        classType: template.classType,
        attributes: {
          attack: template.baseAttack,
          armor: template.baseArmor,
          hp: template.baseHp,
        },
        skills: allSkills,
        runes: [null, null, null, null],
      };
      await heroRepository.createHero(playerId, heroData);
    }
  }

  // Send welcome gift message (3000 gems)
  await messageService.sendWelcomeGift(playerId);

  // Return the full profile with updated resources
  return playerProfileRepository.getProfile(playerId);
}

/**
 * Updates the player's display name after validation.
 * Validates format with Zod schema and handles uniqueness constraint.
 *
 * @throws Error with message "Display name unavailable" if name is taken (PG code 23505)
 * @throws ZodError if name fails validation
 */
export async function updateDisplayName(
  playerId: string,
  name: string
): Promise<PlayerProfile | null> {
  // Validate display name format (3-20 chars, alphanumeric + underscore)
  displayNameSchema.parse(name);

  try {
    const profile = await playerProfileRepository.updateDisplayName(
      playerId,
      name
    );
    return profile;
  } catch (error: any) {
    // PostgreSQL unique constraint violation (code 23505)
    if (error?.code === "23505") {
      const uniqueError = new Error("Display name unavailable");
      (uniqueError as any).statusCode = 409;
      throw uniqueError;
    }
    throw error;
  }
}

/**
 * Adds experience to a player's profile.
 * The repository handles atomic increment; level is recalculated from total XP.
 */
export async function addExperience(
  playerId: string,
  amount: number
): Promise<PlayerProfile | null> {
  if (amount <= 0) {
    throw new Error("Experience amount must be a positive integer");
  }

  return playerProfileRepository.addExperience(playerId, amount);
}
