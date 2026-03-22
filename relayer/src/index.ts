import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

import { subscribeRouter } from "./routes/subscribe.js";
import { creatorsRouter } from "./routes/creators.js";
import { healthRouter } from "./routes/health.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(morgan("combined"));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: "Too many requests, please try again later." },
});
app.use(limiter);

// Routes
app.use("/api/health", healthRouter);
app.use("/api/subscribe", subscribeRouter);
app.use("/api/creators", creatorsRouter);

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Start server
app.listen(PORT, () => {
  console.log(`OnlyFHE Relayer running on port ${PORT}`);
  console.log(`Network: ${process.env.NETWORK || "arb-sepolia"}`);
});

export default app;
