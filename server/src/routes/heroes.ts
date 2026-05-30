import { Router, Request, Response } from "express";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth.middleware";
import * as heroService from "../services/hero.service";
import * as heroTemplateRepository from "../repositories/hero-template.repository";
import { RUNE_SLOTS_PER_HERO } from "../config/game-constants";

const router = Router();

// Apply auth middleware to all hero routes
router.use(authMiddleware);

// Validation schemas for request bodies
const equipRuneBodySchema = z.object({
  slotIndex: z
    .number()
    .int({ message: "Slot index must be an integer" })
    .min(1, { message: "Slot index must be at least 1" })
    .max(RUNE_SLOTS_PER_HERO, {
      message: `Slot index must be at most ${RUNE_SLOTS_PER_HERO}`,
    }),
  runeId: z.string().uuid({ message: "runeId must be a valid UUID" }),
});

const unequipRuneBodySchema = z.object({
  slotIndex: z
    .number()
    .int({ message: "Slot index must be an integer" })
    .min(1, { message: "Slot index must be at least 1" })
    .max(RUNE_SLOTS_PER_HERO, {
      message: `Slot index must be at most ${RUNE_SLOTS_PER_HERO}`,
    }),
});

const skillUpgradeBodySchema = z.object({
  skillIndex: z
    .number()
    .int({ message: "Skill index must be an integer" })
    .min(0, { message: "Skill index must be non-negative" }),
});

// Error message to HTTP status mapping
function mapErrorToStatus(message: string): number {
  switch (message) {
    case "Hero not found":
      return 404;
    case "Maximum level reached":
    case "Maximum star rating reached":
    case "Slot is occupied":
    case "Slot is empty":
    case "Rune not found in inventory":
    case "Skill is at maximum level":
    case "Insufficient resources":
      return 400;
    default:
      return 500;
  }
}

// GET /api/player/heroes — returns hero roster
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const playerId = req.player!.id;
    const heroes = await heroService.getHeroes(playerId);
    res.json(heroes);
  } catch (err) {
    console.error("Error fetching heroes:", (err as Error).message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/player/heroes/templates — returns all hero templates (public game data)
router.get(
  "/templates",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const templates = await heroTemplateRepository.getAllTemplates();
      res.json(templates);
    } catch (err) {
      console.error("Error fetching hero templates:", (err as Error).message);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /api/player/heroes/:heroId — returns hero detail with skills and runes
router.get("/:heroId", async (req: Request, res: Response): Promise<void> => {
  try {
    const playerId = req.player!.id;
    const heroId = req.params.heroId as string;
    const hero = await heroService.getHeroDetail(heroId, playerId);
    res.json(hero);
  } catch (err) {
    const message = (err as Error).message;
    const status = mapErrorToStatus(message);
    if (status === 500) {
      console.error("Error fetching hero detail:", message);
    }
    res.status(status).json({ error: message });
  }
});

// POST /api/player/heroes/:heroId/level-up — level up hero
router.post(
  "/:heroId/level-up",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const playerId = req.player!.id;
      const heroId = req.params.heroId as string;
      const hero = await heroService.levelUpHero(heroId, playerId);
      res.json(hero);
    } catch (err) {
      const message = (err as Error).message;
      const status = mapErrorToStatus(message);
      if (status === 500) {
        console.error("Error leveling up hero:", message);
      }
      res.status(status).json({ error: message });
    }
  }
);

// POST /api/player/heroes/:heroId/star-upgrade — upgrade star rating
router.post(
  "/:heroId/star-upgrade",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const playerId = req.player!.id;
      const heroId = req.params.heroId as string;
      const hero = await heroService.upgradeStars(heroId, playerId);
      res.json(hero);
    } catch (err) {
      const message = (err as Error).message;
      const status = mapErrorToStatus(message);
      if (status === 500) {
        console.error("Error upgrading hero stars:", message);
      }
      res.status(status).json({ error: message });
    }
  }
);

// POST /api/player/heroes/:heroId/equip-rune — equip rune to slot
router.post(
  "/:heroId/equip-rune",
  async (req: Request, res: Response): Promise<void> => {
    const parsed = equipRuneBodySchema.safeParse(req.body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      res.status(400).json({
        error: "Validation failed",
        field: firstError.path.join("."),
        constraint: firstError.message,
      });
      return;
    }

    try {
      const playerId = req.player!.id;
      const heroId = req.params.heroId as string;
      const { slotIndex, runeId } = parsed.data;
      const hero = await heroService.equipRune(
        heroId,
        playerId,
        slotIndex,
        runeId
      );
      res.json(hero);
    } catch (err) {
      const message = (err as Error).message;
      const status = mapErrorToStatus(message);
      if (status === 500) {
        console.error("Error equipping rune:", message);
      }
      res.status(status).json({ error: message });
    }
  }
);

// POST /api/player/heroes/:heroId/unequip-rune — unequip rune from slot
router.post(
  "/:heroId/unequip-rune",
  async (req: Request, res: Response): Promise<void> => {
    const parsed = unequipRuneBodySchema.safeParse(req.body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      res.status(400).json({
        error: "Validation failed",
        field: firstError.path.join("."),
        constraint: firstError.message,
      });
      return;
    }

    try {
      const playerId = req.player!.id;
      const heroId = req.params.heroId as string;
      const { slotIndex } = parsed.data;
      const hero = await heroService.unequipRune(heroId, playerId, slotIndex);
      res.json(hero);
    } catch (err) {
      const message = (err as Error).message;
      const status = mapErrorToStatus(message);
      if (status === 500) {
        console.error("Error unequipping rune:", message);
      }
      res.status(status).json({ error: message });
    }
  }
);

// POST /api/player/heroes/:heroId/upgrade-skill — upgrade skill level
router.post(
  "/:heroId/upgrade-skill",
  async (req: Request, res: Response): Promise<void> => {
    const parsed = skillUpgradeBodySchema.safeParse(req.body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      res.status(400).json({
        error: "Validation failed",
        field: firstError.path.join("."),
        constraint: firstError.message,
      });
      return;
    }

    try {
      const playerId = req.player!.id;
      const heroId = req.params.heroId as string;
      const { skillIndex } = parsed.data;
      const hero = await heroService.upgradeSkill(heroId, playerId, skillIndex);
      res.json(hero);
    } catch (err) {
      const message = (err as Error).message;
      const status = mapErrorToStatus(message);
      if (status === 500) {
        console.error("Error upgrading skill:", message);
      }
      res.status(status).json({ error: message });
    }
  }
);

export default router;
