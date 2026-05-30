import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import * as messageService from "../services/message.service";

const router = Router();

router.use(authMiddleware);

// GET /api/player/messages — returns all messages for the player
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const playerId = req.player!.id;
    const messages = await messageService.getMessages(playerId);
    const unreadCount = await messageService.getUnreadCount(playerId);
    res.json({ messages, unreadCount });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/player/messages/unread-count — returns unread message count
router.get("/unread-count", async (req: Request, res: Response): Promise<void> => {
  try {
    const playerId = req.player!.id;
    const unreadCount = await messageService.getUnreadCount(playerId);
    res.json({ unreadCount });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/player/messages/:messageId/read — mark message as read
router.post("/:messageId/read", async (req: Request, res: Response): Promise<void> => {
  try {
    const playerId = req.player!.id;
    const messageId = req.params.messageId as string;
    const message = await messageService.markAsRead(messageId, playerId);
    res.json(message);
  } catch (error: any) {
    if (error.message === "Message not found") {
      res.status(404).json({ error: "Message not found" });
      return;
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/player/messages/:messageId/claim — claim reward from message
router.post("/:messageId/claim", async (req: Request, res: Response): Promise<void> => {
  try {
    const playerId = req.player!.id;
    const messageId = req.params.messageId as string;
    const message = await messageService.claimReward(messageId, playerId);
    res.json(message);
  } catch (error: any) {
    const msg = error.message;
    if (msg === "Message not found") {
      res.status(404).json({ error: msg });
      return;
    }
    if (msg === "Reward already claimed" || msg === "No reward to claim") {
      res.status(400).json({ error: msg });
      return;
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/player/messages/:messageId — delete a message
router.delete("/:messageId", async (req: Request, res: Response): Promise<void> => {
  try {
    const playerId = req.player!.id;
    const messageId = req.params.messageId as string;
    await messageService.deleteMessage(messageId, playerId);
    res.json({ success: true });
  } catch (error: any) {
    if (error.message === "Message not found") {
      res.status(404).json({ error: "Message not found" });
      return;
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
