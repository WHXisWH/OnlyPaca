import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { arbitrumSepolia } from "wagmi/chains";

export const wagmiConfig = getDefaultConfig({
  appName: "OnlyFHE",
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "demo",
  chains: [arbitrumSepolia],
  ssr: true,
});

// Contract addresses (update after deployment)
export const CONTRACT_ADDRESSES = {
  subscription: process.env.NEXT_PUBLIC_SUBSCRIPTION_CONTRACT || "",
  relayer: process.env.NEXT_PUBLIC_RELAYER_CONTRACT || "",
} as const;

// API endpoints
export const API_ENDPOINTS = {
  relayer: process.env.NEXT_PUBLIC_RELAYER_API || "http://localhost:3001",
} as const;
