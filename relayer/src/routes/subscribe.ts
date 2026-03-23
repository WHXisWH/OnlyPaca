import { Router, Request, Response, IRouter } from "express";
import { z } from "zod";
import {
  relaySubscription,
  relayAccessDecrypt,
  relayRevenueDecrypt,
  relayWithdraw,
  getNonce,
} from "../services/subscription.js";

export const subscribeRouter: IRouter = Router();

// Request validation schemas
const subscribeSchema = z.object({
  creator: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid creator address"),
  subscriber: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid subscriber address"),
  deadline: z.string().regex(/^\d+$/, "Invalid deadline"),
  nonce: z.string().regex(/^\d+$/, "Invalid nonce"),
  signature: z.string().regex(/^0x[a-fA-F0-9]+$/, "Invalid signature"),
});

const accessDecryptSchema = z.object({
  creator: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid creator address"),
  subscriber: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid subscriber address"),
  deadline: z.string().regex(/^\d+$/, "Invalid deadline"),
  nonce: z.string().regex(/^\d+$/, "Invalid nonce"),
  signature: z.string().regex(/^0x[a-fA-F0-9]+$/, "Invalid signature"),
});

const creatorActionSchema = z.object({
  creator: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid creator address"),
  deadline: z.string().regex(/^\d+$/, "Invalid deadline"),
  nonce: z.string().regex(/^\d+$/, "Invalid nonce"),
  signature: z.string().regex(/^0x[a-fA-F0-9]+$/, "Invalid signature"),
});

// POST /api/subscribe - Relay a subscription transaction
subscribeRouter.post("/", async (req: Request, res: Response) => {
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
subscribeRouter.get("/nonce/:address", async (req: Request, res: Response) => {
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

// POST /api/subscribe/access-decrypt - Relay access decrypt request
subscribeRouter.post("/access-decrypt", async (req: Request, res: Response) => {
  try {
    const validation = accessDecryptSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid request",
        details: validation.error.errors,
      });
    }

    const { creator, subscriber, deadline, nonce, signature } = validation.data;

    console.log(`Relaying access decrypt: ${subscriber} checking ${creator}`);

    const result = await relayAccessDecrypt({
      creator,
      subscriber,
      deadline: BigInt(deadline),
      nonce: BigInt(nonce),
      signature,
    });

    res.json({
      success: true,
      transactionHash: result.hash,
      message: "Access decrypt relayed successfully",
    });
  } catch (error) {
    console.error("Access decrypt relay error:", error);

    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      error: "Failed to relay access decrypt",
      message,
    });
  }
});

// POST /api/subscribe/revenue-decrypt - Relay revenue decrypt request
subscribeRouter.post("/revenue-decrypt", async (req: Request, res: Response) => {
  try {
    const validation = creatorActionSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid request",
        details: validation.error.errors,
      });
    }

    const { creator, deadline, nonce, signature } = validation.data;

    console.log(`Relaying revenue decrypt for creator: ${creator}`);

    const result = await relayRevenueDecrypt({
      creator,
      deadline: BigInt(deadline),
      nonce: BigInt(nonce),
      signature,
    });

    res.json({
      success: true,
      transactionHash: result.hash,
      message: "Revenue decrypt relayed successfully",
    });
  } catch (error) {
    console.error("Revenue decrypt relay error:", error);

    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      error: "Failed to relay revenue decrypt",
      message,
    });
  }
});

// POST /api/subscribe/withdraw - Relay withdrawal request
subscribeRouter.post("/withdraw", async (req: Request, res: Response) => {
  try {
    const validation = creatorActionSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: "Invalid request",
        details: validation.error.errors,
      });
    }

    const { creator, deadline, nonce, signature } = validation.data;

    console.log(`Relaying withdrawal for creator: ${creator}`);

    const result = await relayWithdraw({
      creator,
      deadline: BigInt(deadline),
      nonce: BigInt(nonce),
      signature,
    });

    res.json({
      success: true,
      transactionHash: result.hash,
      message: "Withdrawal relayed successfully",
    });
  } catch (error) {
    console.error("Withdraw relay error:", error);

    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({
      error: "Failed to relay withdrawal",
      message,
    });
  }
});
