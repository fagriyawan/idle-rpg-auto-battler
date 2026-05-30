import { Router, Request, Response } from "express";
import { ZodError } from "zod";
import { authMiddleware } from "../middleware/auth.middleware";
import { displayNameSchema } from "../validators/player.validators";
import * as playerService from "../services/player.service";
import * as heroService from "../services/hero.service";
import * as formationService from "../services/formation.service";

const router = Router();

// Apply authMiddleware to all routes in this router
router.use(authMiddleware);

/**
 * GET /api/player/profile
 * Returns aggregated player profile: profile + resources + hero summary + formation.
 * Validates: Requirements 1.2, 6.1, 6.2, 6.3, 6.7
 */
router.get("/profile", async (req: Request, res: Response): Promise<void> => {
  try {
    const playerId = req.player!.id;

    const profile = await playerService.getPlayerProfile(playerId);

    // Get heroes (summary: id, name, level, class) and formation
    const [heroes, formation] = await Promise.all([
      heroService.getHeroes(playerId),
      formationService.getFormation(playerId),
    ]);

    // Build hero summary (id, name, level, class) per Req 6.3
    const heroSummary = heroes.map((hero) => ({
      id: hero.id,
      name: hero.name,
      level: hero.level,
      classType: hero.classType,
    }));

    // If profile is null (no heroes/resources yet), return empty collections per Req 6.7
    if (!profile) {
      res.json({
        profile: null,
        heroes: [],
        formation: { heroIds: [], updatedAt: null },
      });
      return;
    }

    res.json({
      profile,
      heroes: heroSummary,
      formation,
    });
  } catch (error) {
    console.error("Error fetching player profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * PUT /api/player/display-name
 * Validates and updates the player's display name.
 * Validates: Requirements 1.3, 1.4, 1.6
 */
router.put(
  "/display-name",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const playerId = req.player!.id;
      const { displayName } = req.body;

      // Validate display name with Zod schema
      const parseResult = displayNameSchema.safeParse(displayName);
      if (!parseResult.success) {
        const firstError = parseResult.error.errors[0];
        res.status(400).json({
          error: "Validation failed",
          field: "displayName",
          constraint: firstError.message,
        });
        return;
      }

      const updatedProfile = await playerService.updateDisplayName(
        playerId,
        parseResult.data
      );

      if (!updatedProfile) {
        res.status(404).json({ error: "Player not found" });
        return;
      }

      res.json({ profile: updatedProfile });
    } catch (error: any) {
      // Handle duplicate display name (409 Conflict)
      if (error?.statusCode === 409) {
        res.status(409).json({ error: "Display name unavailable" });
        return;
      }

      // Handle Zod validation errors (shouldn't reach here due to safeParse above, but just in case)
      if (error instanceof ZodError) {
        const firstError = error.errors[0];
        res.status(400).json({
          error: "Validation failed",
          field: "displayName",
          constraint: firstError.message,
        });
        return;
      }

      console.error("Error updating display name:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
