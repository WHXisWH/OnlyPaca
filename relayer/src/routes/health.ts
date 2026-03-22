import { Router } from "express";
import { ethers } from "ethers";
import { getProvider, getRelayerWallet } from "../services/blockchain.js";

export const healthRouter = Router();

healthRouter.get("/", async (req, res) => {
  try {
    const provider = getProvider();
    const wallet = getRelayerWallet();

    const [blockNumber, balance] = await Promise.all([
      provider.getBlockNumber(),
      provider.getBalance(wallet.address),
    ]);

    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      relayer: {
        address: wallet.address,
        balance: ethers.formatEther(balance),
      },
      network: {
        blockNumber,
        chainId: (await provider.getNetwork()).chainId.toString(),
      },
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
