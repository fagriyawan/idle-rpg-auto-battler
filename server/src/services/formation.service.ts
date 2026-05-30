import { Formation, FormationPosition } from "../types/player";
import { formationSchema } from "../validators/player.validators";
import * as formationRepository from "../repositories/formation.repository";
import * as heroRepository from "../repositories/hero.repository";

export async function getFormation(playerId: string): Promise<Formation> {
  return formationRepository.getFormation(playerId);
}

export async function saveFormation(
  playerId: string,
  heroIds: string[],
  positions: FormationPosition[] = []
): Promise<Formation> {
  // Validate formation structure: 1–5 unique UUIDs
  const parseResult = formationSchema.safeParse(heroIds);
  if (!parseResult.success) {
    const firstError = parseResult.error.errors[0];
    throw new Error(firstError.message);
  }

  // Validate positions if provided
  if (positions.length > 0) {
    // All position heroIds must be in the heroIds array
    const heroIdSet = new Set(heroIds);
    for (const pos of positions) {
      if (!heroIdSet.has(pos.heroId)) {
        throw new Error("Position references a hero not in the formation");
      }
      if (pos.x < 0 || pos.x > 100 || pos.y < 0 || pos.y > 100) {
        throw new Error("Position x and y must be between 0 and 100");
      }
    }

    // Check for duplicate heroIds in positions
    const posHeroIds = positions.map((p) => p.heroId);
    if (new Set(posHeroIds).size !== posHeroIds.length) {
      throw new Error("Formation cannot have duplicate hero positions");
    }
  }

  // Verify all hero IDs are owned by the player
  const ownedHeroes = await heroRepository.getHeroesByPlayer(playerId);
  const ownedHeroIds = new Set(ownedHeroes.map((hero) => hero.id));

  const unownedIds = heroIds.filter((id) => !ownedHeroIds.has(id));
  if (unownedIds.length > 0) {
    throw new Error("Formation contains heroes not owned by the player");
  }

  // Persist the formation
  return formationRepository.saveFormation(playerId, heroIds, positions);
}
