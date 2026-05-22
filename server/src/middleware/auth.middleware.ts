import { Request, Response, NextFunction } from "express";
import { validateToken } from "../services/auth.service";
import { Player } from "../types";

declare global {
  namespace Express {
    interface Request {
      player?: Player;
    }
  }
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "No token provided" });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const player = await validateToken(token);
    req.player = player;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
