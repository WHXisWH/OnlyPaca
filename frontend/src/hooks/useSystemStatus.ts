"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount, useChainId, usePublicClient } from "wagmi";
import { arbitrumSepolia } from "wagmi/chains";
import { API_ENDPOINTS, CONTRACT_ADDRESSES } from "@/config/wagmi";
import { RELAYER_ABI, SUBSCRIPTION_ABI } from "@/config/contracts";

type StatusTone = "healthy" | "warning" | "error";

interface RelayerHealthResponse {
  status: "healthy" | "unhealthy";
  timestamp?: string;
  config?: {
    network: string;
    relayerWalletConfigured: boolean;
    subscriptionContractConfigured: boolean;
    relayerContractConfigured: boolean;
  };
  relayer?: {
    address: string;
    balance: string;
    lowBalance?: boolean;
  };
  contracts?: {
    subscription: {
      address: string | null;
      deployed: boolean;
    };
    relayer: {
      address: string | null;
      deployed: boolean;
    };
  };
  network?: {
    blockNumber: number;
    chainId: string;
  };
  error?: string;
}

export interface SystemStatusSnapshot {
  loading: boolean;
  relayerReachable: boolean;
  relayerHealth: RelayerHealthResponse | null;
  contractChecks: {
    subscriptionConfigured: boolean;
    relayerConfigured: boolean;
    subscriptionDeployed: boolean;
    relayerDeployed: boolean;
    relayerPaused: boolean | null;
    relayerAuthorizedOnSubscription: boolean | null;
    totalCreators: bigint | null;
    platformFeeBps: bigint | null;
  };
  wallet: {
    connected: boolean;
    chainId: number | null;
    correctChain: boolean;
  };
  errors: string[];
  summary: {
    tone: StatusTone;
    title: string;
    detail: string;
  };
  refresh: () => Promise<void>;
}

function buildSummary(input: {
  relayerReachable: boolean;
  correctChain: boolean;
  subscriptionConfigured: boolean;
  relayerConfigured: boolean;
  subscriptionDeployed: boolean;
  relayerDeployed: boolean;
  relayerPaused: boolean | null;
  relayerAuthorizedOnSubscription: boolean | null;
  relayerLowBalance: boolean;
  errors: string[];
}) {
  if (!input.relayerReachable) {
    return {
      tone: "error" as const,
      title: "Relayer unreachable",
      detail: "Frontend cannot reach the relayer API, so private subscription and decrypt flows will fail.",
    };
  }

  if (!input.subscriptionConfigured || !input.relayerConfigured) {
    return {
      tone: "error" as const,
      title: "Missing contract configuration",
      detail: "At least one required contract address is not configured in the frontend environment.",
    };
  }

  if (!input.subscriptionDeployed || !input.relayerDeployed) {
    return {
      tone: "error" as const,
      title: "Contract deployment not ready",
      detail: "Configured addresses do not currently resolve to deployed bytecode on the active network.",
    };
  }

  if (input.relayerPaused) {
    return {
      tone: "warning" as const,
      title: "Relayer is paused",
      detail: "The relayer contract is deployed but currently paused, so private actions are intentionally blocked.",
    };
  }

  if (input.relayerAuthorizedOnSubscription === false) {
    return {
      tone: "warning" as const,
      title: "Relayer not authorized",
      detail: "The relayer contract is deployed but not currently whitelisted on the subscription contract.",
    };
  }

  if (!input.correctChain) {
    return {
      tone: "warning" as const,
      title: "Wrong wallet network",
      detail: "The app expects Arbitrum Sepolia for live interaction. Read-only status can work, but transactions will not.",
    };
  }

  if (input.relayerLowBalance || input.errors.length > 0) {
    return {
      tone: "warning" as const,
      title: "System is up with warnings",
      detail: input.relayerLowBalance
        ? "The relayer is reachable but wallet balance is low, which can block sponsored private actions."
        : "Core checks passed, but one or more secondary status checks returned warnings.",
    };
  }

  return {
    tone: "healthy" as const,
    title: "System ready",
    detail: "Relayer, deployed contracts, and wallet network checks are aligned for the full private flow.",
  };
}

export function useSystemStatus(): SystemStatusSnapshot {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();

  const [loading, setLoading] = useState(true);
  const [relayerHealth, setRelayerHealth] = useState<RelayerHealthResponse | null>(null);
  const [relayerReachable, setRelayerReachable] = useState(false);
  const [contractChecks, setContractChecks] = useState<SystemStatusSnapshot["contractChecks"]>({
    subscriptionConfigured: Boolean(CONTRACT_ADDRESSES.subscription),
    relayerConfigured: Boolean(CONTRACT_ADDRESSES.relayer),
    subscriptionDeployed: false,
    relayerDeployed: false,
    relayerPaused: null,
    relayerAuthorizedOnSubscription: null,
    totalCreators: null,
    platformFeeBps: null,
  });
  const [errors, setErrors] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    setLoading(true);
    const nextErrors: string[] = [];

    let nextRelayerHealth: RelayerHealthResponse | null = null;
    let nextRelayerReachable = false;

    try {
      const response = await fetch(`${API_ENDPOINTS.relayer}/api/health`, {
        cache: "no-store",
      });

      const payload = (await response.json()) as RelayerHealthResponse;
      nextRelayerHealth = payload;
      nextRelayerReachable = response.ok && payload.status === "healthy";

      if (!response.ok) {
        nextErrors.push(payload.error || "Relayer health endpoint returned an error.");
      }
    } catch (error) {
      nextErrors.push("Relayer API could not be reached from the frontend.");
    }

    const nextChecks: SystemStatusSnapshot["contractChecks"] = {
      subscriptionConfigured: Boolean(CONTRACT_ADDRESSES.subscription),
      relayerConfigured: Boolean(CONTRACT_ADDRESSES.relayer),
      subscriptionDeployed: false,
      relayerDeployed: false,
      relayerPaused: null,
      relayerAuthorizedOnSubscription: null,
      totalCreators: null,
      platformFeeBps: null,
    };

    if (publicClient && CONTRACT_ADDRESSES.subscription && CONTRACT_ADDRESSES.relayer) {
      try {
        const [
          subscriptionBytecode,
          relayerBytecode,
          relayerPaused,
          relayerAuthorizedOnSubscription,
          totalCreators,
          platformFeeBps,
        ] = await Promise.all([
          publicClient.getBytecode({
            address: CONTRACT_ADDRESSES.subscription as `0x${string}`,
          }),
          publicClient.getBytecode({
            address: CONTRACT_ADDRESSES.relayer as `0x${string}`,
          }),
          publicClient.readContract({
            address: CONTRACT_ADDRESSES.relayer as `0x${string}`,
            abi: RELAYER_ABI,
            functionName: "paused",
          }) as Promise<boolean>,
          publicClient.readContract({
            address: CONTRACT_ADDRESSES.subscription as `0x${string}`,
            abi: SUBSCRIPTION_ABI,
            functionName: "isRelayer",
            args: [CONTRACT_ADDRESSES.relayer as `0x${string}`],
          }) as Promise<boolean>,
          publicClient.readContract({
            address: CONTRACT_ADDRESSES.subscription as `0x${string}`,
            abi: SUBSCRIPTION_ABI,
            functionName: "totalCreators",
          }) as Promise<bigint>,
          publicClient.readContract({
            address: CONTRACT_ADDRESSES.subscription as `0x${string}`,
            abi: SUBSCRIPTION_ABI,
            functionName: "platformFeeBps",
          }) as Promise<bigint>,
        ]);

        nextChecks.subscriptionDeployed = Boolean(subscriptionBytecode);
        nextChecks.relayerDeployed = Boolean(relayerBytecode);
        nextChecks.relayerPaused = relayerPaused;
        nextChecks.relayerAuthorizedOnSubscription = relayerAuthorizedOnSubscription;
        nextChecks.totalCreators = totalCreators;
        nextChecks.platformFeeBps = platformFeeBps;
      } catch (error) {
        nextErrors.push("Contract readiness checks could not be completed from the public client.");
      }
    } else if (!publicClient) {
      nextErrors.push("Wallet public client is not initialized yet.");
    }

    setRelayerHealth(nextRelayerHealth);
    setRelayerReachable(nextRelayerReachable);
    setContractChecks(nextChecks);
    setErrors(nextErrors);
    setLoading(false);
  }, [publicClient]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const summary = buildSummary({
    relayerReachable,
    correctChain: chainId === arbitrumSepolia.id,
    subscriptionConfigured: contractChecks.subscriptionConfigured,
    relayerConfigured: contractChecks.relayerConfigured,
    subscriptionDeployed: contractChecks.subscriptionDeployed,
    relayerDeployed: contractChecks.relayerDeployed,
    relayerPaused: contractChecks.relayerPaused,
    relayerAuthorizedOnSubscription: contractChecks.relayerAuthorizedOnSubscription,
    relayerLowBalance: Boolean(relayerHealth?.relayer?.lowBalance),
    errors,
  });

  return {
    loading,
    relayerReachable,
    relayerHealth,
    contractChecks,
    wallet: {
      connected: isConnected,
      chainId: chainId || null,
      correctChain: chainId === arbitrumSepolia.id,
    },
    errors,
    summary,
    refresh,
  };
}
