import { query } from "../db/connection";
import { Formation, FormationPosition } from "../types/player";

interface FormationRow {
  player_id: string;
  hero_ids: string[];
  positions: FormationPosition[];
  updated_at: Date;
}

function mapRowToFormation(row: FormationRow): Formation {
  return {
    heroIds: row.hero_ids,
    positions: row.positions ?? [],
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function getFormation(playerId: string): Promise<Formation> {
  const result = await query<FormationRow>(
    "SELECT player_id, hero_ids, positions, updated_at FROM player_formations WHERE player_id = $1",
    [playerId]
  );

  if (result.rows.length === 0) {
    return { heroIds: [], positions: [], updatedAt: new Date().toISOString() };
  }

  return mapRowToFormation(result.rows[0]);
}

export async function saveFormation(
  playerId: string,
  heroIds: string[],
  positions: FormationPosition[] = []
): Promise<Formation> {
  const result = await query<FormationRow>(
    `INSERT INTO player_formations (player_id, hero_ids, positions, updated_at)
     VALUES ($1, $2, $3::jsonb, NOW())
     ON CONFLICT (player_id) DO UPDATE SET hero_ids = $2, positions = $3::jsonb, updated_at = NOW()
     RETURNING player_id, hero_ids, positions, updated_at`,
    [playerId, heroIds, JSON.stringify(positions)]
  );

  return mapRowToFormation(result.rows[0]);
}
