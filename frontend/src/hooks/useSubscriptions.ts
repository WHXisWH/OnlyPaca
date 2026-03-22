"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { SUBSCRIPTION_ABI } from "@/config/contracts";
import { CONTRACT_ADDRESSES } from "@/config/wagmi";
import { SubscriptionStatus } from "@/types";

interface Subscription {
  creatorAddress: string;
  creatorName: string;
  creatorAvatar?: string;
  status: SubscriptionStatus | null;
  subscribedAt?: string;
}

// Mock subscriptions for demo
const MOCK_SUBSCRIPTIONS: Subscription[] = [
  {
    creatorAddress: "0x1234567890123456789012345678901234567890",
    creatorName: "CryptoArtist",
    status: null,
    subscribedAt: "2024-03-15T10:00:00Z",
  },
  {
    creatorAddress: "0x3456789012345678901234567890123456789012",
    creatorName: "DeFiAnalyst",
    status: null,
    subscribedAt: "2024-03-10T14:30:00Z",
  },
];

export function useSubscriptions() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState<string | null>(null);

  // Load subscriptions
  useEffect(() => {
    async function loadSubscriptions() {
      if (!address) {
        setSubscriptions([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        // In production, this would:
        // 1. Query SubscriptionActivated events for this subscriber
        // 2. Build list of creators they've subscribed to
        // 3. For each, call verifyAccess to check current status

        // For demo, use mock data
        setSubscriptions(MOCK_SUBSCRIPTIONS);
      } catch (error) {
        console.error("Failed to load subscriptions:", error);
        setSubscriptions([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadSubscriptions();
  }, [address]);

  // Verify access to a creator
  const verifyAccess = useCallback(
    async (creatorAddress: string) => {
      if (!address) return;

      setIsVerifying(creatorAddress);

      try {
        // Step 1: Request decryption
        await writeContractAsync({
          address: CONTRACT_ADDRESSES.subscription as `0x${string}`,
          abi: SUBSCRIPTION_ABI,
          functionName: "requestAccessDecrypt",
          args: [creatorAddress as `0x${string}`],
        });

        // Step 2: Poll for result (in production)
        // For demo, simulate with timeout
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Step 3: Get decrypted status
        // In production: call verifyAccess() view function
        // For demo: randomly set active or not subscribed
        const mockStatus =
          Math.random() > 0.3
            ? SubscriptionStatus.ACTIVE
            : SubscriptionStatus.NOT_SUBSCRIBED;

        setSubscriptions((prev) =>
          prev.map((sub) =>
            sub.creatorAddress === creatorAddress
              ? { ...sub, status: mockStatus }
              : sub
          )
        );
      } catch (error) {
        console.error("Access verification failed:", error);

        // For demo without contract, show mock status
        setSubscriptions((prev) =>
          prev.map((sub) =>
            sub.creatorAddress === creatorAddress
              ? { ...sub, status: SubscriptionStatus.ACTIVE }
              : sub
          )
        );
      } finally {
        setIsVerifying(null);
      }
    },
    [address, writeContractAsync]
  );

  return {
    subscriptions,
    isLoading,
    verifyAccess,
    isVerifying,
  };
}
