import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { config } from "./config";
import authRouter from "./routes/auth";
import playerRouter from "./routes/player";
import heroesRouter from "./routes/heroes";
import formationRouter from "./routes/formation";
import resourcesRouter from "./routes/resources";
import messagesRouter from "./routes/messages";
import campaignRouter from "./routes/campaign";
import battleRouter from "./routes/battle";

const app = express();

// CORS configuration
app.use(
  cors({
    origin: config.CLIENT_URL,
    credentials: true,
  })
);

// JSON body parser
app.use(express.json());

// Routes
app.use("/api/auth", authRouter);
app.use("/api/player", playerRouter);
app.use("/api/player/heroes", heroesRouter);
app.use("/api/player/formation", formationRouter);
app.use("/api/player/resources", resourcesRouter);
app.use("/api/player/messages", messagesRouter);
app.use("/api/campaign", campaignRouter);
app.use("/api/battle", battleRouter);

// Global error handling middleware
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  // JSONB deserialization failure
  if (
    err.message?.includes("invalid input syntax for type json") ||
    err.message?.includes("unexpected end of JSON input")
  ) {
    return res.status(500).json({ error: "Data integrity failure" });
  }

  // Generic database/server error
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

export default app;
