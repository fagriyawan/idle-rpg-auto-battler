import { query } from "../db/connection";
import { PlayerHero, HeroAttributes, HeroSkill, HeroRune } from "../types/player";

interface PlayerHeroRow {
  id: string;
  player_id: string;
  hero_template_id: string;
  name: string;
  level: number;
  stars: number;
  class_type: string;
  attributes: HeroAttributes;
  skills: HeroSkill[];
  runes: (HeroRune | null)[];
  experience: number;
  created_at: Date;
  updated_at: Date;
}

function mapRowToPlayerHero(row: PlayerHeroRow): PlayerHero {
  return {
    id: row.id,
    heroTemplateId: row.hero_template_id,
    name: row.name,
    level: row.level,
    stars: row.stars,
    classType: row.class_type,
    attributes: row.attributes,
    skills: row.skills,
    runes: row.runes,
    experience: row.experience || 0,
    active: false, // derived from formation membership, set by service layer
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export interface CreateHeroData {
  heroTemplateId: string;
  name: string;
  level?: number;
  stars?: number;
  classType: string;
  attributes: HeroAttributes;
  skills: HeroSkill[];
  runes: (HeroRune | null)[];
}

export async function getHeroesByPlayer(playerId: string): Promise<PlayerHero[]> {
  const result = await query<PlayerHeroRow>(
    "SELECT * FROM player_heroes WHERE player_id = $1 ORDER BY created_at ASC",
    [playerId]
  );

  return result.rows.map(mapRowToPlayerHero);
}

export async function getHeroById(
  heroId: string,
  playerId: string
): Promise<PlayerHero | null> {
  const result = await query<PlayerHeroRow>(
    "SELECT * FROM player_heroes WHERE id = $1 AND player_id = $2",
    [heroId, playerId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapRowToPlayerHero(result.rows[0]);
}

export async function createHero(
  playerId: string,
  heroData: CreateHeroData
): Promise<PlayerHero> {
  const result = await query<PlayerHeroRow>(
    `INSERT INTO player_heroes (player_id, hero_template_id, name, level, stars, class_type, attributes, skills, runes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      playerId,
      heroData.heroTemplateId,
      heroData.name,
      heroData.level ?? 1,
      heroData.stars ?? 1,
      heroData.classType,
      JSON.stringify(heroData.attributes),
      JSON.stringify(heroData.skills),
      JSON.stringify(heroData.runes),
    ]
  );

  return mapRowToPlayerHero(result.rows[0]);
}

export async function updateHeroLevel(
  heroId: string,
  newLevel: number,
  newAttributes: HeroAttributes
): Promise<PlayerHero | null> {
  const result = await query<PlayerHeroRow>(
    `UPDATE player_heroes
     SET level = $1, attributes = $2, updated_at = NOW()
     WHERE id = $3
     RETURNING *`,
    [newLevel, JSON.stringify(newAttributes), heroId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapRowToPlayerHero(result.rows[0]);
}

export async function updateHeroStars(
  heroId: string,
  newStars: number,
  newAttributes: HeroAttributes
): Promise<PlayerHero | null> {
  const result = await query<PlayerHeroRow>(
    `UPDATE player_heroes
     SET stars = $1, attributes = $2, updated_at = NOW()
     WHERE id = $3
     RETURNING *`,
    [newStars, JSON.stringify(newAttributes), heroId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapRowToPlayerHero(result.rows[0]);
}

export async function updateHeroSkills(
  heroId: string,
  skills: HeroSkill[]
): Promise<PlayerHero | null> {
  const result = await query<PlayerHeroRow>(
    `UPDATE player_heroes
     SET skills = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [JSON.stringify(skills), heroId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapRowToPlayerHero(result.rows[0]);
}

export async function updateHeroRunes(
  heroId: string,
  runes: (HeroRune | null)[]
): Promise<PlayerHero | null> {
  const result = await query<PlayerHeroRow>(
    `UPDATE player_heroes
     SET runes = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [JSON.stringify(runes), heroId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapRowToPlayerHero(result.rows[0]);
}

export async function updateHeroExperience(
  heroId: string,
  experience: number
): Promise<void> {
  const result = await query(
    `UPDATE player_heroes SET experience = $1, updated_at = NOW() WHERE id = $2 RETURNING experience`,
    [experience, heroId]
  );
  if (result.rowCount === 0) {
    console.error(`[updateHeroExperience] No rows updated for heroId=${heroId}, xp=${experience}`);
  }
}
