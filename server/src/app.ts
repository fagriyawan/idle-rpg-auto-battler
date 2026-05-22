import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { config } from "./config";
import authRouter from "./routes/auth";

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

// Global error handling middleware
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err.message);
  res.status(500).json({ error: "Internal server error" });
});

export default app;
