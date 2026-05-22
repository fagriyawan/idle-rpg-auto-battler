import { Router, Request, Response } from "express";
import { z } from "zod";
import { generateNonce, verifySignature } from "../services/auth.service";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

const nonceQuerySchema = z.object({
  walletAddress: z
    .string()
    .startsWith("0x")
    .length(42),
});

const verifyBodySchema = z.object({
  walletAddress: z.string().startsWith("0x").length(42),
  signature: z.string().min(1),
  nonce: z.string().min(1),
});

// GET /nonce — request a signature challenge nonce
router.get("/nonce", async (req: Request, res: Response): Promise<void> => {
  const parsed = nonceQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid walletAddress. Must be a 0x-prefixed 42-character string." });
    return;
  }

  try {
    const nonceResponse = await generateNonce(parsed.data.walletAddress);
    res.json(nonceResponse);
  } catch (err) {
    res.status(500).json({ error: "Failed to generate nonce" });
  }
});

// POST /verify — verify signed message and authenticate
router.post("/verify", async (req: Request, res: Response): Promise<void> => {
  const parsed = verifyBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body. walletAddress, signature, and nonce are required." });
    return;
  }

  try {
    const authResponse = await verifySignature(
      parsed.data.walletAddress,
      parsed.data.signature,
      parsed.data.nonce
    );
    res.json(authResponse);
  } catch {
    res.status(401).json({ error: "Invalid signature" });
  }
});

// GET /me — get current authenticated player (protected)
router.get("/me", authMiddleware, (req: Request, res: Response): void => {
  res.json({ player: req.player });
});

export default router;
