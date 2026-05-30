import * as campaignRepository from "../repositories/campaign.repository";
import * as resourceRepository from "../repositories/resource.repository";
import * as playerProfileRepository from "../repositories/player-profile.repository";
import * as formationRepository from "../repositories/formation.repository";
import * as heroRepository from "../repositories/hero.repository";
import * as heroService from "./hero.service";
import { MAX_HERO_LEVEL, calculateHeroLevelFromXp } from "../config/game-constants";
import { calculateLevelFromExperience } from "../utils/player.utils";
import {
  CampaignChapter,
  CampaignStageWithProgress,
  PlayerStageProgress,
} from "../types/campaign";

/**
 * Returns a chapter with all its stages, including player progress and unlock status.
 * Also returns which difficulty modes are unlocked.
 */
export async function getChapterWithStages(
  chapterId: string,
  playerId: string
): Promise<{ chapter: CampaignChapter; stages: CampaignStageWithProgress[]; unlockedDifficulties: string[] }> {
  const [chapters, stages, progress] = await Promise.all([
    campaignRepository.getChapters(),
    campaignRepository.getStagesByChapter(chapterId),
    campaignRepository.getPlayerProgress(playerId),
  ]);

  const chapter = chapters.find((c) => c.id === chapterId);
  if (!chapter) {
    throw Object.assign(new Error("Chapter not found"), { statusCode: 404 });
  }

  // Build a map of stage progress by stageId
  const progressMap = new Map<string, PlayerStageProgress>();
  for (const p of progress) {
    progressMap.set(p.stageId, p);
  }

  // Determine unlock status for each stage
  const stagesWithProgress: CampaignStageWithProgress[] = stages.map(
    (stage, index) => {
      const stageProgress = progressMap.get(stage.id) || null;

      // Stage 1 is always unlocked; subsequent stages require previous stage cleared
      let unlocked = false;
      if (index === 0) {
        unlocked = true;
      } else {
        const prevStage = stages[index - 1];
        const prevProgress = progressMap.get(prevStage.id);
        unlocked = !!prevProgress && prevProgress.stars > 0;
      }

      return {
        ...stage,
        progress: stageProgress,
        unlocked,
      };
    }
  );

  // Determine difficulty unlocks:
  // Easy: always unlocked
  // Hard: unlocked when ALL stages in this chapter are cleared on Easy (stars > 0)
  // Nightmare: unlocked when ALL stages cleared on Hard
  const { query: dbQuery } = await import("../db/connection");
  const unlockedDifficulties: string[] = ['easy'];

  // Check if all stages cleared on easy
  const easyProgressResult = await dbQuery<{ count: string }>(
    `SELECT COUNT(*) as count FROM player_difficulty_progress
     WHERE player_id = $1 AND stage_id = ANY($2) AND difficulty = 'easy' AND stars > 0`,
    [playerId, stages.map(s => s.id)]
  );
  const easyClearedCount = parseInt(easyProgressResult.rows[0]?.count || '0');
  if (easyClearedCount >= stages.length) {
    unlockedDifficulties.push('hard');

    // Check if all stages cleared on hard
    const hardProgressResult = await dbQuery<{ count: string }>(
      `SELECT COUNT(*) as count FROM player_difficulty_progress
       WHERE player_id = $1 AND stage_id = ANY($2) AND difficulty = 'hard' AND stars > 0`,
      [playerId, stages.map(s => s.id)]
    );
    const hardClearedCount = parseInt(hardProgressResult.rows[0]?.count || '0');
    if (hardClearedCount >= stages.length) {
      unlockedDifficulties.push('nightmare');
    }
  }

  return { chapter, stages: stagesWithProgress, unlockedDifficulties };
}

/**
 * Returns a single stage with player progress and unlock status.
 */
export async function getStageDetail(
  stageId: string,
  playerId: string
): Promise<CampaignStageWithProgress> {
  const stage = await campaignRepository.getStageById(stageId);
  if (!stage) {
    throw Object.assign(new Error("Stage not found"), { statusCode: 404 });
  }

  const stageProgress = await campaignRepository.getPlayerStageProgress(
    playerId,
    stageId
  );

  // Determine unlock status
  let unlocked = false;
  if (stage.stageNumber === 1) {
    unlocked = true;
  } else {
    // Find the previous stage in the same chapter
    const allStages = await campaignRepository.getStagesByChapter(
      stage.chapterId
    );
    const prevStage = allStages.find(
      (s) => s.stageNumber === stage.stageNumber - 1
    );
    if (prevStage) {
      const prevProgress = await campaignRepository.getPlayerStageProgress(
        playerId,
        prevStage.id
      );
      unlocked = !!prevProgress && prevProgress.stars > 0;
    }
  }

  return {
    ...stage,
    progress: stageProgress,
    unlocked,
  };
}

/**
 * Records a stage clear and awards rewards (gold, gems, player XP, hero XP).
 * Returns detailed reward breakdown for the victory screen.
 */
export interface BattleRewardResult {
  progress: PlayerStageProgress;
  rewards: {
    gold: number;
    gems: number;
    playerXp: number;
    heroXp: number;
  };
  player: {
    levelBefore: number;
    levelAfter: number;
    xpBefore: number;
    xpAfter: number;
    xpToNextLevel: number;
  };
  heroes: Array<{
    heroId: string;
    name: string;
    heroTemplateId: string;
    levelBefore: number;
    levelAfter: number;
    xpBefore: number;
    xpAfter: number;
    xpToNextLevel: number;
  }>;
  stars: number;
}

export async function recordStageClear(
  playerId: string,
  stageId: string,
  stars: number,
  heroIds?: string[],
  difficulty: string = "easy"
): Promise<BattleRewardResult> {
  console.log(`[STAGE CLEAR] Called for player=${playerId}, stage=${stageId}, stars=${stars}, difficulty=${difficulty}, heroIds=${heroIds?.length || 0}`);
  // Validate stage exists
  const stage = await campaignRepository.getStageById(stageId);
  if (!stage) {
    throw Object.assign(new Error("Stage not found"), { statusCode: 404 });
  }

  // Validate stars
  if (stars < 1 || stars > 3) {
    throw Object.assign(new Error("Stars must be between 1 and 3"), {
      statusCode: 400,
    });
  }

  // Record the clear in player_difficulty_progress table
  const { query: dbQuery } = await import("../db/connection");
  const progressResult = await dbQuery<{
    player_id: string;
    stage_id: string;
    difficulty: string;
    stars: number;
    clear_count: number;
    first_cleared_at: Date | null;
    last_cleared_at: Date | null;
  }>(
    `INSERT INTO player_difficulty_progress (player_id, stage_id, difficulty, stars, clear_count, first_cleared_at, last_cleared_at)
     VALUES ($1, $2, $3, $4, 1, NOW(), NOW())
     ON CONFLICT (player_id, stage_id, difficulty) DO UPDATE SET
       stars = GREATEST(player_difficulty_progress.stars, $4),
       clear_count = player_difficulty_progress.clear_count + 1,
       last_cleared_at = NOW()
     RETURNING player_id, stage_id, difficulty, stars, clear_count, first_cleared_at, last_cleared_at`,
    [playerId, stageId, difficulty, stars]
  );

  const progressRow = progressResult.rows[0];
  const progress: PlayerStageProgress = {
    stageId: progressRow.stage_id,
    stars: progressRow.stars,
    clearCount: progressRow.clear_count,
    firstClearedAt: progressRow.first_cleared_at ? progressRow.first_cleared_at.toISOString() : null,
    lastClearedAt: progressRow.last_cleared_at ? progressRow.last_cleared_at.toISOString() : null,
  };

  // Also record in player_stage_progress for backward compat (unlock logic)
  await campaignRepository.recordStageClear(playerId, stageId, stars);

  // Get rewards from stage_difficulty_rewards table
  const rewardsResult = await dbQuery<{
    gold: number;
    gems: number;
    player_xp: number;
    hero_xp: number;
  }>(
    `SELECT gold, gems, player_xp, hero_xp
     FROM stage_difficulty_rewards
     WHERE stage_id = $1 AND difficulty = $2`,
    [stageId, difficulty]
  );

  // Fallback to stage.rewards if no difficulty reward found
  const gold = rewardsResult.rows.length > 0 ? rewardsResult.rows[0].gold : stage.rewards.gold;
  const gems = rewardsResult.rows.length > 0 ? rewardsResult.rows[0].gems : stage.rewards.gems;
  const playerXp = rewardsResult.rows.length > 0 ? rewardsResult.rows[0].player_xp : stage.rewards.playerXp;
  const heroXpGain = rewardsResult.rows.length > 0 ? rewardsResult.rows[0].hero_xp : (stage.rewards.heroXp || Math.round(playerXp * 2));

  // Get player profile before XP award
  const profileBefore = await playerProfileRepository.getProfile(playerId);
  const xpBefore = profileBefore?.experience ?? 0;
  const levelBefore = calculateLevelFromExperience(xpBefore).level;

  // Award resources
  if (gold > 0) {
    await resourceRepository.awardResource(playerId, "gold", gold);
  }
  if (gems > 0) {
    await resourceRepository.awardResource(playerId, "gems", gems);
  }
  if (playerXp > 0) {
    await playerProfileRepository.addExperience(playerId, playerXp);
  }

  // Calculate player level after
  const xpAfter = xpBefore + playerXp;
  const afterCalc = calculateLevelFromExperience(xpAfter);
  const levelAfter = afterCalc.level;
  const xpToNextLevel = afterCalc.experienceToNextLevel;

  // Award hero XP — accumulate XP and level up if threshold reached
  const heroResults: BattleRewardResult['heroes'] = [];

  // Get heroes in formation (use provided heroIds or fetch from formation)
  let deployedHeroIds = heroIds;
  if (!deployedHeroIds || deployedHeroIds.length === 0) {
    const formation = await formationRepository.getFormation(playerId);
    deployedHeroIds = formation.heroIds;
  }

  if (deployedHeroIds && deployedHeroIds.length > 0) {
    for (const heroId of deployedHeroIds) {
      try {
        const hero = await heroRepository.getHeroById(heroId, playerId);
        if (!hero || hero.level >= MAX_HERO_LEVEL) continue;

        const heroLevelBefore = hero.level;
        const currentXp = hero.experience || 0;
        const newXp = currentXp + heroXpGain;

        // Update hero XP in database (atomic increment)
        await heroRepository.updateHeroExperience(heroId, newXp);

        // Check if hero should level up based on NEW accumulated XP
        const { level: calculatedLevel } = calculateHeroLevelFromXp(newXp);
        const newLevel = Math.min(calculatedLevel, MAX_HERO_LEVEL);

        // Only level up if calculated level from XP is HIGHER than current DB level
        if (newLevel > heroLevelBefore) {
          await heroService.setHeroLevel(heroId, playerId, newLevel);
        }

        heroResults.push({
          heroId: hero.id,
          name: hero.name,
          heroTemplateId: hero.heroTemplateId,
          levelBefore: heroLevelBefore,
          levelAfter: newLevel > heroLevelBefore ? newLevel : heroLevelBefore,
          xpBefore: currentXp,
          xpAfter: newXp,
          xpToNextLevel: calculateHeroLevelFromXp(newXp).xpToNextLevel,
        });
      } catch (err) {
        console.error(`[HERO XP] Error processing hero ${heroId}:`, err);
      }
    }
  }

  return {
    progress,
    rewards: { gold, gems, playerXp, heroXp: heroXpGain },
    player: {
      levelBefore,
      levelAfter,
      xpBefore,
      xpAfter,
      xpToNextLevel,
    },
    heroes: heroResults,
    stars,
  };
}
