"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount, useWriteContract, useReadContract, usePublicClient, useSignTypedData } from "wagmi";
import { SUBSCRIPTION_ABI } from "@/config/contracts";
import { CONTRACT_ADDRESSES, API_ENDPOINTS } from "@/config/wagmi";
import { Creator } from "@/types";

// EIP-712 type definitions for relayer operations
const REVENUE_DECRYPT_TYPES = {
  RevenueDecrypt: [
    { name: "creator", type: "address" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
} as const;

const WITHDRAW_TYPES = {
  Withdraw: [
    { name: "creator", type: "address" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
} as const;

interface RegisterParams {
  name: string;
  bio: string;
  contentURL: string;
  subscriptionPrice: bigint;
  payoutAddress: `0x${string}`;
}

export function useCreatorDashboard() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { signTypedDataAsync } = useSignTypedData();
  const publicClient = usePublicClient();

  const [profile, setProfile] = useState<Creator | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [revenue, setRevenue] = useState<bigint | null>(null);
  const [isDecryptingRevenue, setIsDecryptingRevenue] = useState(false);
  const [revenueDecryptStep, setRevenueDecryptStep] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const { data: creatorData, refetch: refetchProfile } = useReadContract({
    address: CONTRACT_ADDRESSES.subscription as `0x${string}`,
    abi: SUBSCRIPTION_ABI,
    functionName: "creators",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!CONTRACT_ADDRESSES.subscription,
    },
  });

  useEffect(() => {
    setIsLoading(true);

    if (creatorData) {
      const [registered, subscriberCount, subscriptionPrice, subscriptionDuration, payoutAddress, contentURI] =
        creatorData as [boolean, bigint, bigint, bigint, `0x${string}`, string];

      if (registered) {
        let name = "Creator";
        let bio = "";
        let contentURL = "";

        try {
          const meta = JSON.parse(contentURI);
          if (meta.name) name = meta.name;
          if (meta.bio) bio = meta.bio;
          if (meta.contentURL) contentURL = meta.contentURL;
        } catch {
          if (contentURI && !contentURI.startsWith("{")) {
            const parts = contentURI.split("/");
            name = decodeURIComponent(parts[parts.length - 1] || "Creator");
          }
        }

        setProfile({
          address: address!,
          name,
          bio,
          subscriberCount: subscriberCount.toString(),
          subscriptionPrice: subscriptionPrice.toString(),
          subscriptionDuration: subscriptionDuration.toString(),
          payoutAddress,
          contentURI,
          contentURL,
        });
        setIsRegistered(true);
      } else {
        setIsRegistered(false);
        setProfile(null);
      }
    } else {
      setIsRegistered(false);
      setProfile(null);
    }

    setIsLoading(false);
  }, [creatorData, address]);

  const registerCreator = useCallback(
    async (params: RegisterParams) => {
      if (!address) return;

      setIsRegistering(true);

      try {
        // Store metadata as JSON in contentURI
        const contentURI = JSON.stringify({
          name: params.name,
          bio: params.bio,
          contentURL: params.contentURL,
        });

        await writeContractAsync({
          address: CONTRACT_ADDRESSES.subscription as `0x${string}`,
          abi: SUBSCRIPTION_ABI,
          functionName: "registerCreator",
          args: [
            params.subscriptionPrice,
            BigInt(30 * 24 * 60 * 60), // 30 days
            params.payoutAddress,
            contentURI,
          ],
        });

        await refetchProfile();
      } catch (error) {
        console.error("Registration failed:", error);
        throw error;
      } finally {
        setIsRegistering(false);
      }
    },
    [address, writeContractAsync, refetchProfile]
  );

  const updateProfile = useCallback(
    async (params: RegisterParams) => {
      if (!address) return;

      setIsRegistering(true);

      try {
        const contentURI = JSON.stringify({
          name: params.name,
          bio: params.bio,
          contentURL: params.contentURL,
        });

        await writeContractAsync({
          address: CONTRACT_ADDRESSES.subscription as `0x${string}`,
          abi: SUBSCRIPTION_ABI,
          functionName: "updateCreatorProfile",
          args: [
            params.subscriptionPrice,
            BigInt(30 * 24 * 60 * 60),
            params.payoutAddress,
            contentURI,
          ],
        });

        await refetchProfile();
      } catch (error) {
        console.error("Profile update failed:", error);
        throw error;
      } finally {
        setIsRegistering(false);
      }
    },
    [address, writeContractAsync, refetchProfile]
  );

  // Request revenue decryption via Relayer (privacy-preserving)
  const requestRevenueDecrypt = useCallback(async () => {
    if (!address || !publicClient) return;

    setIsDecryptingRevenue(true);
    setRevenueDecryptStep("Signing request...");

    try {
      // 1. Get nonce from relayer
      const nonceResponse = await fetch(
        `${API_ENDPOINTS.relayer}/api/subscribe/nonce/${address}`
      );

      if (!nonceResponse.ok) {
        throw new Error("Failed to get nonce");
      }

      const { nonce } = await nonceResponse.json();

      // 2. Calculate deadline (1 hour from now)
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);

      // 3. Sign EIP-712 message
      const signature = await signTypedDataAsync({
        domain: {
          name: "OnlyFHERelayer",
          version: "1",
          chainId: BigInt(421614),
          verifyingContract: CONTRACT_ADDRESSES.relayer as `0x${string}`,
        },
        types: REVENUE_DECRYPT_TYPES,
        primaryType: "RevenueDecrypt",
        message: {
          creator: address,
          nonce: BigInt(nonce),
          deadline,
        },
      });

      setRevenueDecryptStep("Sending to relayer...");

      // 4. Send to relayer
      const response = await fetch(`${API_ENDPOINTS.relayer}/api/subscribe/revenue-decrypt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creator: address,
          deadline: deadline.toString(),
          nonce: nonce.toString(),
          signature,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Revenue decrypt failed");
      }

      setRevenueDecryptStep("Waiting for FHE decryption (~5–30s)...");

      // Poll isRevenueDecryptReady() up to 60 seconds
      let attempts = 0;
      const maxAttempts = 15;

      while (attempts < maxAttempts) {
        await new Promise((r) => setTimeout(r, 4000));

        try {
          const result = await publicClient.readContract({
            address: CONTRACT_ADDRESSES.subscription as `0x${string}`,
            abi: SUBSCRIPTION_ABI,
            functionName: "isRevenueDecryptReady",
            args: [],
            account: address,
          });

          const [ready, value] = result as [boolean, bigint];

          if (ready) {
            setRevenue(value);
            setRevenueDecryptStep(null);
            return;
          }
        } catch {
          // poll failure — keep trying
        }

        attempts++;
      }

      setRevenueDecryptStep("Timed out. Please try again.");
      setTimeout(() => setRevenueDecryptStep(null), 3000);
    } catch (error) {
      console.error("Revenue decryption failed:", error);
      setRevenueDecryptStep(null);
    } finally {
      setIsDecryptingRevenue(false);
    }
  }, [address, publicClient, signTypedDataAsync]);

  // Withdraw revenue via Relayer (privacy-preserving)
  const withdrawRevenue = useCallback(async () => {
    if (!address || revenue === null || revenue === BigInt(0)) return;

    setIsWithdrawing(true);

    try {
      // 1. Get nonce from relayer
      const nonceResponse = await fetch(
        `${API_ENDPOINTS.relayer}/api/subscribe/nonce/${address}`
      );

      if (!nonceResponse.ok) {
        throw new Error("Failed to get nonce");
      }

      const { nonce } = await nonceResponse.json();

      // 2. Calculate deadline (1 hour from now)
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600);

      // 3. Sign EIP-712 message
      const signature = await signTypedDataAsync({
        domain: {
          name: "OnlyFHERelayer",
          version: "1",
          chainId: BigInt(421614),
          verifyingContract: CONTRACT_ADDRESSES.relayer as `0x${string}`,
        },
        types: WITHDRAW_TYPES,
        primaryType: "Withdraw",
        message: {
          creator: address,
          nonce: BigInt(nonce),
          deadline,
        },
      });

      // 4. Send to relayer
      const response = await fetch(`${API_ENDPOINTS.relayer}/api/subscribe/withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creator: address,
          deadline: deadline.toString(),
          nonce: nonce.toString(),
          signature,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Withdrawal failed");
      }

      setRevenue(BigInt(0));
    } catch (error) {
      console.error("Withdrawal failed:", error);
      throw error;
    } finally {
      setIsWithdrawing(false);
    }
  }, [address, revenue, signTypedDataAsync]);

  return {
    profile,
    isLoading,
    isRegistered,
    revenue,
    isDecryptingRevenue,
    revenueDecryptStep,
    registerCreator,
    updateProfile,
    withdrawRevenue,
    requestRevenueDecrypt,
    isRegistering,
    isWithdrawing,
    refetchProfile,
  };
}
