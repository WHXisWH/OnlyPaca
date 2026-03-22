import { ethers } from "ethers";

let provider: ethers.JsonRpcProvider | null = null;
let relayerWallet: ethers.Wallet | null = null;

// Get RPC URL based on network
function getRpcUrl(): string {
  const network = process.env.NETWORK || "arb-sepolia";

  switch (network) {
    case "arb-sepolia":
      return process.env.ARBITRUM_SEPOLIA_RPC_URL || "https://sepolia-rollup.arbitrum.io/rpc";
    case "eth-sepolia":
      return process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia.publicnode.com";
    default:
      return "https://sepolia-rollup.arbitrum.io/rpc";
  }
}

// Get provider singleton
export function getProvider(): ethers.JsonRpcProvider {
  if (!provider) {
    provider = new ethers.JsonRpcProvider(getRpcUrl());
  }
  return provider;
}

// Get relayer wallet singleton
export function getRelayerWallet(): ethers.Wallet {
  if (!relayerWallet) {
    const privateKey = process.env.RELAYER_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error("RELAYER_PRIVATE_KEY not configured");
    }
    relayerWallet = new ethers.Wallet(privateKey, getProvider());
  }
  return relayerWallet;
}

// Get contract addresses
export function getContractAddresses() {
  return {
    subscription: process.env.SUBSCRIPTION_CONTRACT || "",
    relayer: process.env.RELAYER_CONTRACT || "",
  };
}
