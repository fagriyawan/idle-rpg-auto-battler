import { Router, Request, Response } from "express";
import { resourceOperationSchema } from "../validators/player.validators";
import { authMiddleware } from "../middleware/auth.middleware";
import * as resourceService from "../services/resource.service";

const router = Router();

// Apply authMiddleware to all routes
router.use(authMiddleware);

// POST /deduct — deduct resources from player balance
router.post("/deduct", async (req: Request, res: Response): Promise<void> => {
  const parsed = resourceOperationSchema.safeParse(req.body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    res.status(400).json({
      error: "Validation failed",
      field: firstIssue.path[0] || "unknown",
      constraint: firstIssue.message,
    });
    return;
  }

  const playerId = req.player!.id;
  const { resourceType, amount } = parsed.data;

  try {
    const updatedResources = await resourceService.deductResource(playerId, resourceType, amount);
    res.json(updatedResources);
  } catch (err: any) {
    if (err.message === "Insufficient resources") {
      res.status(400).json({
        error: "Insufficient resources",
        resource: err.resource,
        required: err.required,
        available: err.available,
      });
      return;
    }
    if (err.message === "Player resource record not found") {
      res.status(404).json({ error: "Player resource record not found" });
      return;
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /award — award resources to player balance
router.post("/award", async (req: Request, res: Response): Promise<void> => {
  const parsed = resourceOperationSchema.safeParse(req.body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    res.status(400).json({
      error: "Validation failed",
      field: firstIssue.path[0] || "unknown",
      constraint: firstIssue.message,
    });
    return;
  }

  const playerId = req.player!.id;
  const { resourceType, amount } = parsed.data;

  try {
    const updatedResources = await resourceService.awardResource(playerId, resourceType, amount);
    res.json(updatedResources);
  } catch (err: any) {
    if (err.message === "Player resource record not found") {
      res.status(404).json({ error: "Player resource record not found" });
      return;
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
