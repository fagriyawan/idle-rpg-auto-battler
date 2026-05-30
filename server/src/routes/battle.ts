import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import * as campaignRepository from "../repositories/campaign.repository";
import * as formationRepository from "../repositories/formation.repository";
import * as heroTemplateRepository from "../repositories/hero-template.repository";
import { query } from "../db/connection";

const router = Router();

// All battle routes require authentication
router.use(authMiddleware);

interface PlayerHeroRow {
  id: string;
  hero_template_id: string;
  name: string;
  level: number;
  stars: number;
  class_type: string;
  attributes: { attack: number; armor: number; hp: number };
}

interface StageWaveRow {
  wave_number: number;
  enemies: unknown;
}

interface StageRewardRow {
  gold: number;
  gems: number;
  player_xp: number;
  hero_xp: number;
}

/**
 * GET /api/battle/stage/:stageId/init?difficulty=easy
 * Returns all data needed to initialize a multi-wave battle:
 * - Stage info (id, title, time limit)
 * - Waves array (3 waves with enemies)
 * - Player's formation (hero positions + combat stats)
 * - Difficulty and rewards
 */
router.get(
  "/stage/:stageId/init",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const playerId = req.player!.id;
      const stageId = req.params.stageId as string;
      const difficulty = (req.query.difficulty as string) || "easy";

      // Validate difficulty
      if (!["easy", "hard", "nightmare"].includes(difficulty)) {
        res.status(400).json({ error: "Invalid difficulty. Must be easy, hard, or nightmare." });
        return;
      }

      // Fetch stage data (for title, time limit)
      const stage = await campaignRepository.getStageById(stageId);
      if (!stage) {
        res.status(404).json({ error: "Stage not found" });
        return;
      }

      // Fetch waves from stage_waves table
      const wavesResult = await query<StageWaveRow>(
        `SELECT wave_number, enemies
         FROM stage_waves
         WHERE stage_id = $1 AND difficulty = $2
         ORDER BY wave_number`,
        [stageId, difficulty]
      );

      if (wavesResult.rows.length === 0) {
        res.status(404).json({ error: "No wave data found for this stage and difficulty." });
        return;
      }

      // Fetch rewards from stage_difficulty_rewards table
      const rewardsResult = await query<StageRewardRow>(
        `SELECT gold, gems, player_xp, hero_xp
         FROM stage_difficulty_rewards
         WHERE stage_id = $1 AND difficulty = $2`,
        [stageId, difficulty]
      );

      const rewards = rewardsResult.rows.length > 0
        ? {
            gold: rewardsResult.rows[0].gold,
            gems: rewardsResult.rows[0].gems,
            playerXp: rewardsResult.rows[0].player_xp,
            heroXp: rewardsResult.rows[0].hero_xp,
          }
        : { gold: 0, gems: 0, playerXp: 0, heroXp: 0 };

      // Build waves array
      const waves = wavesResult.rows.map((row) => ({
        waveNumber: row.wave_number,
        enemies: row.enemies as unknown[],
      }));

      // Fetch player formation with positions
      const formation = await formationRepository.getFormation(playerId);
      if (!formation.heroIds || formation.heroIds.length === 0) {
        res.status(400).json({ error: "No formation set. Please set a formation first." });
        return;
      }

      // Fetch player heroes in formation
      const heroResult = await query<PlayerHeroRow>(
        `SELECT id, hero_template_id, name, level, stars, class_type, attributes
         FROM player_heroes
         WHERE player_id = $1 AND id = ANY($2)`,
        [playerId, formation.heroIds]
      );

      // Fetch all templates for combat stats
      const templates = await heroTemplateRepository.getAllTemplates();
      const templateMap = new Map(templates.map((t) => [t.id, t]));

      // Build player units with combat stats
      const playerUnits = heroResult.rows.map((hero) => {
        const template = templateMap.get(hero.hero_template_id);
        // Find position from formation positions array
        const position = formation.positions.find((p) => p.heroId === hero.id);

        // Level multiplier: 1 + 0.05 * (level - 1)
        const levelMult = 1 + 0.05 * (hero.level - 1);
        // Star multipliers: [1.0, 1.2, 1.5, 1.8, 2.2]
        const starMults = [1.0, 1.2, 1.5, 1.8, 2.2];
        const starMult = starMults[Math.min(hero.stars - 1, 4)] || 1.0;

        return {
          id: hero.id,
          heroTemplateId: hero.hero_template_id,
          name: hero.name,
          level: hero.level,
          stars: hero.stars,
          classType: hero.class_type,
          hp: Math.round(hero.attributes.hp * levelMult * starMult),
          maxHp: Math.round(hero.attributes.hp * levelMult * starMult),
          attack: Math.round(hero.attributes.attack * levelMult * starMult),
          defense: hero.attributes.armor,
          magicResist: template?.magicResistance ?? 0,
          attackRange: template?.attackRange ?? 80,
          attackSpeed: template?.attackSpeed ?? 1.5,
          moveSpeed: template?.moveSpeed ?? 150,
          maxMana: template?.maxMana ?? 1000,
          manaRegen: template?.manaRegen ?? 10,
          manaOnAttack: template?.manaOnAttack ?? 80,
          manaOnHit: template?.manaOnHit ?? 40,
          critRate: template?.critRate ?? 5,
          critDamage: template?.critDamage ?? 1.5,
          combatType: template?.combatType ?? "melee",
          formationRow: template?.formationRow ?? "front",
          // Remap formation position to battlefield left side (20-40%)
          // Y is compressed to ground level (70-85%)
          positionX: position ? 20 + (position.x / 100) * 20 : 30,
          positionY: position ? 70 + (position.y - 50) * 0.3 : 78,
        };
      });

      // Return response with waves (backward compat: stage.enemies = wave 1 enemies)
      res.json({
        stage: {
          id: stage.id,
          title: stage.title,
          battleTimeLimit: stage.battleTimeLimit,
          enemies: waves[0]?.enemies || [],
        },
        waves,
        playerUnits,
        difficulty,
        rewards,
      });
    } catch (error) {
      console.error("Error initializing battle:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
