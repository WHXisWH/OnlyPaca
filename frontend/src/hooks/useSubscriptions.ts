"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount, useWriteContract, usePublicClient } from "wagmi";
import { SUBSCRIPTION_ABI } from "@/config/contracts";
import { CONTRACT_ADDRESSES } from "@/config/wagmi";
import { SubscriptionStatus } from "@/types";
import { parseCreatorData } from "./useCreators";
import { API_ENDPOINTS } from "@/config/wagmi";

interface Subscription {
  creatorAddress: string;
  creatorName: string;
  creatorAvatar?: string;
  status: SubscriptionStatus | null;
  subscribedAt?: string;
}

// ---- localStorage helpers ----

function getStoredCreatorAddresses(userAddress: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(`onlypaca_subs_${userAddress.toLowerCase()}`) || "[]");
  } catch {
    return [];
  }
}

function getStoredSubTime(userAddress: string, creatorAddress: string): string | undefined {
  try {
    return localStorage.getItem(`onlypaca_subtime_${userAddress.toLowerCase()}_${creatorAddress.toLowerCase()}`) || undefined;
  } catch {
    return undefined;
  }
}

function getStoredVerifiedStatus(userAddress: string, creatorAddress: string): SubscriptionStatus | null {
  try {
    const val = localStorage.getItem(`onlypaca_verified_${userAddress.toLowerCase()}_${creatorAddress.toLowerCase()}`);
    return val !== null ? (parseInt(val) as SubscriptionStatus) : null;
  } catch {
    return null;
  }
}

function setStoredVerifiedStatus(userAddress: string, creatorAddress: string, status: SubscriptionStatus) {
  try {
    localStorage.setItem(`onlypaca_verified_${userAddress.toLowerCase()}_${creatorAddress.toLowerCase()}`, status.toString());
  } catch {}
}

// ---- hook ----

export function useSubscriptions() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState<string | null>(null);
  const [verifyStep, setVerifyStep] = useState<string | null>(null);

  useEffect(() => {
    async function loadSubscriptions() {
      if (!address) {
        setSubscriptions([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const creatorAddresses = getStoredCreatorAddresses(address);

        if (creatorAddresses.length === 0) {
          setSubscriptions([]);
          setIsLoading(false);
          return;
        }

        const subs: Subscription[] = await Promise.all(
          creatorAddresses.map(async (creatorAddr) => {
            let creatorName = creatorAddr.slice(0, 6) + "..." + creatorAddr.slice(-4);

            try {
              const res = await fetch(`${API_ENDPOINTS.relayer}/api/creators/${creatorAddr}`);
              if (res.ok) {
                const data = await res.json();
                const parsed = parseCreatorData(data.creator);
                creatorName = parsed.name;
              }
            } catch { /* use fallback name */ }

            return {
              creatorAddress: creatorAddr,
              creatorName,
              status: getStoredVerifiedStatus(address, creatorAddr),
              subscribedAt: getStoredSubTime(address, creatorAddr),
            };
          })
        );

        setSubscriptions(subs);
      } catch (error) {
        console.error("Failed to load subscriptions:", error);
        setSubscriptions([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadSubscriptions();
  }, [address]);

  const verifyAccess = useCallback(
    async (creatorAddress: string) => {
      if (!address || !publicClient) return;

      setIsVerifying(creatorAddress);
      setVerifyStep("Sending transaction...");

      try {
        await writeContractAsync({
          address: CONTRACT_ADDRESSES.subscription as `0x${string}`,
          abi: SUBSCRIPTION_ABI,
          functionName: "requestAccessDecrypt",
          args: [creatorAddress as `0x${string}`],
        });

        setVerifyStep("Waiting for FHE decryption (~5–30s)...");

        let attempts = 0;
        const maxAttempts = 15;

        while (attempts < maxAttempts) {
          await new Promise((r) => setTimeout(r, 4000));

          try {
            const result = await publicClient.readContract({
              address: CONTRACT_ADDRESSES.subscription as `0x${string}`,
              abi: SUBSCRIPTION_ABI,
              functionName: "isAccessDecryptReady",
              args: [creatorAddress as `0x${string}`],
              account: address,
            });

            const [ready, status] = result as [boolean, number];

            if (ready) {
              const subStatus = status as SubscriptionStatus;
              setStoredVerifiedStatus(address, creatorAddress, subStatus);
              setSubscriptions((prev) =>
                prev.map((sub) =>
                  sub.creatorAddress.toLowerCase() === creatorAddress.toLowerCase()
                    ? { ...sub, status: subStatus }
                    : sub
                )
              );
              setVerifyStep(null);
              return;
            }
          } catch { /* keep polling */ }

          attempts++;
        }

        setVerifyStep("Timed out — please try verifying again.");
        setTimeout(() => setVerifyStep(null), 3000);
      } catch (error: any) {
        console.error("Access verification failed:", error);
        setVerifyStep(null);
      } finally {
        setIsVerifying(null);
      }
    },
    [address, publicClient, writeContractAsync]
  );

  return {
    subscriptions,
    isLoading,
    verifyAccess,
    isVerifying,
    verifyStep,
  };
}
