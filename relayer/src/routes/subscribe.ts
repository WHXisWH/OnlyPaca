import { Router } from "express";
import { z } from "zod";
import { relaySubscription, getNonce } from "../services/subscription.js";

export const subscribeRouter = Router();

// Request validation schema
const subscribeSchema = z.object({
  creator: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid creator address"),
  subscriber: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid subscriber address"),
  deadline: z.string().regex(/^\d+$/, "Invalid deadline"),
  nonce: z.string().regex(/^\d+$/, "Invalid nonce"),
  signature: z.string().regex(/^0x[a-fA-F0-9]+$/, "Invalid signature"),
});

// POST /api/subscribe - Relay a subscription transaction
subscribeRouter.post("/", async (req, res) => {
  try {
    const validation = subscribeSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid request",
        details: validation.error.errors,
      });
    }

    const { creator, subscriber, deadline, nonce, signature } = validation.data;

    console.log(`Relaying subscription: ${subscriber} -> ${creator}`);

    const result = await relaySubscription({
      creator,
      subscriber,
      deadline: BigInt(deadline),
      nonce: BigInt(nonce),
      signature,
    });

    res.json({
      success: true,
      transactionHash: result.hash,
      message: "Subscription relayed successfully",
    });
  } catch (error) {
    console.error("Subscription relay error:", error);

    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      error: "Failed to relay subscription",
      message,
    });
  }
});

// GET /api/subscribe/nonce/:address - Get current nonce for a user
subscribeRouter.get("/nonce/:address", async (req, res) => {
  try {
    const { address } = req.params;

    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({ error: "Invalid address" });
    }

    const nonce = await getNonce(address);

    res.json({
      address,
      nonce: nonce.toString(),
    });
  } catch (error) {
    console.error("Get nonce error:", error);
    res.status(500).json({ error: "Failed to get nonce" });
  }
});
