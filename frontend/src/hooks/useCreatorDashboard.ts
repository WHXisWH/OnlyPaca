"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount, useWriteContract, useReadContract } from "wagmi";
import { SUBSCRIPTION_ABI } from "@/config/contracts";
import { CONTRACT_ADDRESSES } from "@/config/wagmi";
import { Creator } from "@/types";

interface RegisterParams {
  name: string;
  bio: string;
  subscriptionPrice: bigint;
  payoutAddress: `0x${string}`;
}

export function useCreatorDashboard() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const [profile, setProfile] = useState<Creator | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [revenue, setRevenue] = useState<bigint | null>(null);
  const [isDecryptingRevenue, setIsDecryptingRevenue] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Read creator profile from contract
  const { data: creatorData, refetch: refetchProfile } = useReadContract({
    address: CONTRACT_ADDRESSES.subscription as `0x${string}`,
    abi: SUBSCRIPTION_ABI,
    functionName: "creators",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!CONTRACT_ADDRESSES.subscription,
    },
  });

  // Update profile state when data changes
  useEffect(() => {
    setIsLoading(true);

    if (creatorData) {
      const [registered, subscriberCount, subscriptionPrice, subscriptionDuration, payoutAddress, contentURI] =
        creatorData as [boolean, bigint, bigint, bigint, `0x${string}`, string];

      if (registered) {
        // Parse content URI to get name and bio
        let name = "Creator";
        let bio = "";

        try {
          // In production, this would fetch from IPFS
          // For now, we'll use placeholder data
          const uriParts = contentURI.split("/");
          name = uriParts[uriParts.length - 1] || "Creator";
        } catch (e) {
          // Ignore parsing errors
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

  // Register as creator
  const registerCreator = useCallback(
    async (params: RegisterParams) => {
      if (!address) return;

      setIsRegistering(true);

      try {
        // Create content URI (in production, upload to IPFS)
        const contentURI = `ipfs://${params.name}`;

        await writeContractAsync({
          address: CONTRACT_ADDRESSES.subscription as `0x${string}`,
          abi: SUBSCRIPTION_ABI,
          functionName: "registerCreator",
          args: [
            params.subscriptionPrice,
            BigInt(30 * 24 * 60 * 60), // 30 days duration
            params.payoutAddress,
            contentURI,
          ],
        });

        // Refetch profile after registration
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

  // Request revenue decryption
  const requestRevenueDecrypt = useCallback(async () => {
    if (!address) return;

    setIsDecryptingRevenue(true);

    try {
      // In production, this calls requestRevenueDecrypt() on the contract
      // Then polls getRevenue() until decryption is ready
      // For now, simulate with mock data

      await writeContractAsync({
        address: CONTRACT_ADDRESSES.subscription as `0x${string}`,
        abi: SUBSCRIPTION_ABI,
        functionName: "requestRevenueDecrypt",
        args: [],
      });

      // Poll for decryption result
      // In production, this would check isRevenueDecryptReady()
      // For demo, set mock value after delay
      setTimeout(() => {
        setRevenue(BigInt(0)); // Mock: 0 ETH
        setIsDecryptingRevenue(false);
      }, 2000);
    } catch (error) {
      console.error("Revenue decryption failed:", error);
      setIsDecryptingRevenue(false);

      // For demo without contract, show mock value
      setRevenue(BigInt(0));
    }
  }, [address, writeContractAsync]);

  // Withdraw revenue
  const withdrawRevenue = useCallback(async () => {
    if (!address || revenue === null || revenue === BigInt(0)) return;

    setIsWithdrawing(true);

    try {
      await writeContractAsync({
        address: CONTRACT_ADDRESSES.subscription as `0x${string}`,
        abi: SUBSCRIPTION_ABI,
        functionName: "withdrawRevenue",
        args: [],
      });

      // Reset revenue after withdrawal
      setRevenue(BigInt(0));
    } catch (error) {
      console.error("Withdrawal failed:", error);
      throw error;
    } finally {
      setIsWithdrawing(false);
    }
  }, [address, revenue, writeContractAsync]);

  return {
    profile,
    isLoading,
    isRegistered,
    revenue,
    isDecryptingRevenue,
    registerCreator,
    requestRevenueDecrypt,
    withdrawRevenue,
    isRegistering,
    isWithdrawing,
    refetchProfile,
  };
}
