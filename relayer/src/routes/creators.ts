import { Router, Request, Response, IRouter } from "express";
import { getCreatorProfile, getRegisteredCreators } from "../services/creators.js";

export const creatorsRouter: IRouter = Router();

// GET /api/creators - List all registered creators
creatorsRouter.get("/", async (req: Request, res: Response) => {
  try {
    const creators = await getRegisteredCreators();
    res.json({ creators });
  } catch (error) {
    console.error("Get creators error:", error);
    res.status(500).json({ error: "Failed to fetch creators" });
  }
});

// GET /api/creators/:address - Get specific creator profile
creatorsRouter.get("/:address", async (req: Request, res: Response) => {
  try {
    const { address } = req.params;

    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({ error: "Invalid address" });
    }

    const profile = await getCreatorProfile(address);

    if (!profile || !profile.registered) {
      return res.status(404).json({ error: "Creator not found" });
    }

    res.json({ creator: profile });
  } catch (error) {
    console.error("Get creator error:", error);
    res.status(500).json({ error: "Failed to fetch creator" });
  }
});
