"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount, useWriteContract, usePublicClient } from "wagmi";
import { SUBSCRIPTION_ABI } from "@/config/contracts";
import { CONTRACT_ADDRESSES } from "@/config/wagmi";
import { SubscriptionStatus } from "@/types";
import { parseCreatorData } from "./useCreators";
import { API_ENDPOINTS } from "@/config/wagmi";
import {
  getVaultStatusCopy,
  migrateLegacyVault,
  readPrivateVault,
  updatePrivateVaultVerification,
} from "@/lib/privateVault";

interface Subscription {
  creatorAddress: string;
  creatorName: string;
  creatorBio?: string;
  creatorAvatar?: string;
  subscriptionPrice?: string;
  contentURL?: string;
  status: SubscriptionStatus | null;
  subscribedAt?: string;
  txHash?: string;
  statusLabel: string;
  statusHelper: string;
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
        migrateLegacyVault(address);
        const vaultEntries = readPrivateVault(address);

        if (vaultEntries.length === 0) {
          setSubscriptions([]);
          setIsLoading(false);
          return;
        }

        const subs: Subscription[] = await Promise.all(
          vaultEntries.map(async (entry) => {
            let creatorName = entry.creatorName;
            let creatorBio = entry.creatorBio;
            let contentURL = entry.contentURL;
            let subscriptionPrice = entry.subscriptionPrice;

            try {
              const res = await fetch(
                `${API_ENDPOINTS.relayer}/api/creators/${entry.creatorAddress}`
              );
              if (res.ok) {
                const data = await res.json();
                const parsed = parseCreatorData(data.creator);
                creatorName = parsed.name;
                creatorBio = parsed.bio;
                contentURL = parsed.contentURL;
                subscriptionPrice = parsed.subscriptionPrice;
              }
            } catch { /* use fallback name */ }

            const statusCopy = getVaultStatusCopy(entry.stage, entry.status);

            return {
              creatorAddress: entry.creatorAddress,
              creatorName,
              creatorBio,
              creatorAvatar: entry.creatorAvatar,
              subscriptionPrice,
              contentURL,
              status: entry.status,
              subscribedAt: entry.subscribedAt,
              txHash: entry.txHash,
              statusLabel: statusCopy.label,
              statusHelper: statusCopy.helper,
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

        setVerifyStep("Waiting for FHE decryption (~5-30s)...");

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
              updatePrivateVaultVerification(address, creatorAddress, subStatus);
              setSubscriptions((prev) =>
                prev.map((sub) =>
                  sub.creatorAddress.toLowerCase() === creatorAddress.toLowerCase()
                    ? {
                        ...sub,
                        status: subStatus,
                        ...(() => {
                          const copy = getVaultStatusCopy(
                            subStatus === SubscriptionStatus.ACTIVE
                              ? "verified-active"
                              : "verified-inactive",
                            subStatus
                          );

                          return {
                            statusLabel: copy.label,
                            statusHelper: copy.helper,
                          };
                        })(),
                      }
                    : sub
                )
              );
              setVerifyStep(null);
              return;
            }
          } catch { /* keep polling */ }

          attempts++;
        }

        setVerifyStep("Timed out - please try verifying again.");
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
    usesPrivateVault: true,
  };
}
