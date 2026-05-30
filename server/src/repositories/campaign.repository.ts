import { query } from "../db/connection";
import {
  CampaignChapter,
  CampaignStage,
  PlayerStageProgress,
  StageEnemy,
  StageRewards,
} from "../types/campaign";

// --- Row interfaces ---

interface ChapterRow {
  id: string;
  chapter_number: number;
  title: string;
  description: string;
}

interface StageRow {
  id: string;
  chapter_id: string;
  stage_number: number;
  title: string;
  energy_cost: number;
  enemies: StageEnemy[];
  rewards: StageRewards;
  recommended_level: number;
  map_position_x: number;
  map_position_y: number;
  battle_time_limit: number;
}

interface ProgressRow {
  id: string;
  player_id: string;
  stage_id: string;
  stars: number;
  clear_count: number;
  first_cleared_at: Date | null;
  last_cleared_at: Date | null;
}

// --- Mappers ---

function mapChapterRow(row: ChapterRow): CampaignChapter {
  return {
    id: row.id,
    chapterNumber: row.chapter_number,
    title: row.title,
    description: row.description,
  };
}

function mapStageRow(row: StageRow): CampaignStage {
  return {
    id: row.id,
    chapterId: row.chapter_id,
    stageNumber: row.stage_number,
    title: row.title,
    energyCost: row.energy_cost,
    enemies: row.enemies,
    rewards: row.rewards,
    recommendedLevel: row.recommended_level,
    mapPositionX: row.map_position_x,
    mapPositionY: row.map_position_y,
    battleTimeLimit: row.battle_time_limit ?? 90,
  };
}

function mapProgressRow(row: ProgressRow): PlayerStageProgress {
  return {
    stageId: row.stage_id,
    stars: row.stars,
    clearCount: row.clear_count,
    firstClearedAt: row.first_cleared_at
      ? row.first_cleared_at.toISOString()
      : null,
    lastClearedAt: row.last_cleared_at
      ? row.last_cleared_at.toISOString()
      : null,
  };
}

// --- Repository functions ---

/**
 * Returns all campaign chapters ordered by chapter number.
 */
export async function getChapters(): Promise<CampaignChapter[]> {
  const result = await query<ChapterRow>(
    "SELECT id, chapter_number, title, description FROM campaign_chapters ORDER BY chapter_number"
  );
  return result.rows.map(mapChapterRow);
}

/**
 * Returns all stages for a given chapter, ordered by stage number.
 */
export async function getStagesByChapter(
  chapterId: string
): Promise<CampaignStage[]> {
  const result = await query<StageRow>(
    `SELECT id, chapter_id, stage_number, title, energy_cost, enemies, rewards,
            recommended_level, map_position_x, map_position_y, battle_time_limit
     FROM campaign_stages
     WHERE chapter_id = $1
     ORDER BY stage_number`,
    [chapterId]
  );
  return result.rows.map(mapStageRow);
}

/**
 * Returns a single stage by ID, or null if not found.
 */
export async function getStageById(
  stageId: string
): Promise<CampaignStage | null> {
  const result = await query<StageRow>(
    `SELECT id, chapter_id, stage_number, title, energy_cost, enemies, rewards,
            recommended_level, map_position_x, map_position_y, battle_time_limit
     FROM campaign_stages
     WHERE id = $1`,
    [stageId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapStageRow(result.rows[0]);
}

/**
 * Returns all stage progress records for a player.
 */
export async function getPlayerProgress(
  playerId: string
): Promise<PlayerStageProgress[]> {
  const result = await query<ProgressRow>(
    `SELECT id, player_id, stage_id, stars, clear_count, first_cleared_at, last_cleared_at
     FROM player_stage_progress
     WHERE player_id = $1`,
    [playerId]
  );
  return result.rows.map(mapProgressRow);
}

/**
 * Returns progress for a specific stage, or null if not yet attempted.
 */
export async function getPlayerStageProgress(
  playerId: string,
  stageId: string
): Promise<PlayerStageProgress | null> {
  const result = await query<ProgressRow>(
    `SELECT id, player_id, stage_id, stars, clear_count, first_cleared_at, last_cleared_at
     FROM player_stage_progress
     WHERE player_id = $1 AND stage_id = $2`,
    [playerId, stageId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapProgressRow(result.rows[0]);
}

/**
 * Records a stage clear. Uses INSERT ... ON CONFLICT to upsert.
 * Keeps the highest star rating achieved.
 */
export async function recordStageClear(
  playerId: string,
  stageId: string,
  stars: number
): Promise<PlayerStageProgress> {
  const result = await query<ProgressRow>(
    `INSERT INTO player_stage_progress (player_id, stage_id, stars, clear_count, first_cleared_at, last_cleared_at)
     VALUES ($1, $2, $3, 1, NOW(), NOW())
     ON CONFLICT (player_id, stage_id) DO UPDATE SET
       stars = GREATEST(player_stage_progress.stars, $3),
       clear_count = player_stage_progress.clear_count + 1,
       last_cleared_at = NOW()
     RETURNING id, player_id, stage_id, stars, clear_count, first_cleared_at, last_cleared_at`,
    [playerId, stageId, stars]
  );

  return mapProgressRow(result.rows[0]);
}
