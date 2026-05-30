import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import * as formationService from "../services/formation.service";

const router = Router();

// Apply authMiddleware to all routes
router.use(authMiddleware);

// GET /api/player/formation — returns current formation
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const playerId = req.player!.id;
    const formation = await formationService.getFormation(playerId);
    res.json(formation);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/player/formation — saves new formation
router.put("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const playerId = req.player!.id;
    const { heroIds, positions } = req.body;

    if (!heroIds || !Array.isArray(heroIds)) {
      res.status(400).json({ error: "heroIds must be an array" });
      return;
    }

    // positions is optional, default to empty array
    const positionsArray = Array.isArray(positions) ? positions : [];

    const formation = await formationService.saveFormation(playerId, heroIds, positionsArray);
    res.json(formation);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";

    if (
      message === "Formation must contain at least 1 hero" ||
      message === "Formation must contain at most 5 heroes" ||
      message === "Formation must not contain duplicate hero IDs" ||
      message === "Formation contains heroes not owned by the player" ||
      message === "Position references a hero not in the formation" ||
      message === "Position x and y must be between 0 and 100" ||
      message === "Formation cannot have duplicate hero positions"
    ) {
      res.status(400).json({ error: message });
      return;
    }

    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
