import { Router, Request, Response, IRouter } from "express";
import { ethers } from "ethers";
import { getContractAddresses, getProvider, getRelayerWallet } from "../services/blockchain.js";

export const healthRouter: IRouter = Router();

healthRouter.get("/", async (req: Request, res: Response) => {
  try {
    const provider = getProvider();
    const wallet = getRelayerWallet();
    const addresses = getContractAddresses();

    const [blockNumber, balance, network, subscriptionBytecode, relayerBytecode] = await Promise.all([
      provider.getBlockNumber(),
      provider.getBalance(wallet.address),
      provider.getNetwork(),
      addresses.subscription ? provider.getCode(addresses.subscription) : Promise.resolve("0x"),
      addresses.relayer ? provider.getCode(addresses.relayer) : Promise.resolve("0x"),
    ]);

    const walletBalanceEth = ethers.formatEther(balance);
    const walletBalanceFloat = Number.parseFloat(walletBalanceEth);

    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      config: {
        network: process.env.NETWORK || "arb-sepolia",
        relayerWalletConfigured: Boolean(process.env.RELAYER_PRIVATE_KEY),
        subscriptionContractConfigured: Boolean(addresses.subscription),
        relayerContractConfigured: Boolean(addresses.relayer),
      },
      relayer: {
        address: wallet.address,
        balance: walletBalanceEth,
        lowBalance: Number.isFinite(walletBalanceFloat) ? walletBalanceFloat < 0.005 : false,
      },
      contracts: {
        subscription: {
          address: addresses.subscription || null,
          deployed: addresses.subscription ? subscriptionBytecode !== "0x" : false,
        },
        relayer: {
          address: addresses.relayer || null,
          deployed: addresses.relayer ? relayerBytecode !== "0x" : false,
        },
      },
      network: {
        blockNumber,
        chainId: network.chainId.toString(),
      },
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
