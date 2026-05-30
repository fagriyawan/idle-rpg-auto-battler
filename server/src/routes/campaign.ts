import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import * as campaignService from "../services/campaign.service";

const router = Router();

// All campaign routes require authentication
router.use(authMiddleware);

/**
 * GET /api/campaign/chapters
 * Returns all campaign chapters.
 */
router.get("/chapters", async (req: Request, res: Response): Promise<void> => {
  try {
    const { getChapters } = await import(
      "../repositories/campaign.repository"
    );
    const chapters = await getChapters();
    res.json({ chapters });
  } catch (error) {
    console.error("Error fetching chapters:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/campaign/chapters/:chapterId
 * Returns a chapter with all stages, player progress, and unlock status.
 */
router.get(
  "/chapters/:chapterId",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const playerId = req.player!.id;
      const chapterId = req.params.chapterId as string;

      const result = await campaignService.getChapterWithStages(
        chapterId,
        playerId
      );
      res.json(result);
    } catch (error: any) {
      if (error?.statusCode === 404) {
        res.status(404).json({ error: error.message });
        return;
      }
      console.error("Error fetching chapter with stages:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * GET /api/campaign/stages/:stageId
 * Returns a single stage with player progress and unlock status.
 */
router.get(
  "/stages/:stageId",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const playerId = req.player!.id;
      const stageId = req.params.stageId as string;

      const stage = await campaignService.getStageDetail(stageId, playerId);
      res.json(stage);
    } catch (error: any) {
      if (error?.statusCode === 404) {
        res.status(404).json({ error: error.message });
        return;
      }
      console.error("Error fetching stage detail:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

/**
 * POST /api/campaign/stages/:stageId/clear
 * Records a stage clear with star rating and awards rewards.
 * Body: { stars: 1 | 2 | 3, heroIds?: string[], difficulty?: string }
 */
router.post(
  "/stages/:stageId/clear",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const playerId = req.player!.id;
      const stageId = req.params.stageId as string;
      const { stars, heroIds, difficulty } = req.body;

      if (!stars || typeof stars !== "number" || stars < 1 || stars > 3) {
        res
          .status(400)
          .json({ error: "stars must be a number between 1 and 3" });
        return;
      }

      const diff = difficulty || "easy";
      if (!["easy", "hard", "nightmare"].includes(diff)) {
        res.status(400).json({ error: "Invalid difficulty." });
        return;
      }

      const result = await campaignService.recordStageClear(
        playerId,
        stageId,
        stars,
        heroIds,
        diff
      );
      res.json(result);
    } catch (error: any) {
      if (error?.statusCode === 400 || error?.statusCode === 404) {
        res.status(error.statusCode).json({ error: error.message });
        return;
      }
      console.error("Error recording stage clear:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
