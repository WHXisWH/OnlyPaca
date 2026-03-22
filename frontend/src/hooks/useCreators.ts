"use client";

import { useState, useEffect } from "react";
import { Creator } from "@/types";
import { API_ENDPOINTS } from "@/config/wagmi";

// Mock data for development
const MOCK_CREATORS: Creator[] = [
  {
    address: "0x1234567890123456789012345678901234567890",
    name: "CryptoArtist",
    bio: "Digital artist exploring the intersection of art and blockchain technology.",
    avatar: "",
    subscriberCount: "142",
    subscriptionPrice: "10000000000000000", // 0.01 ETH
    subscriptionDuration: "2592000", // 30 days
    payoutAddress: "0x1234567890123456789012345678901234567890",
    contentURI: "ipfs://QmExample1",
  },
  {
    address: "0x2345678901234567890123456789012345678901",
    name: "Web3Developer",
    bio: "Building the decentralized future, one smart contract at a time.",
    avatar: "",
    subscriberCount: "89",
    subscriptionPrice: "20000000000000000", // 0.02 ETH
    subscriptionDuration: "2592000",
    payoutAddress: "0x2345678901234567890123456789012345678901",
    contentURI: "ipfs://QmExample2",
  },
  {
    address: "0x3456789012345678901234567890123456789012",
    name: "DeFiAnalyst",
    bio: "Deep dives into DeFi protocols. Research and alpha for subscribers.",
    avatar: "",
    subscriberCount: "256",
    subscriptionPrice: "50000000000000000", // 0.05 ETH
    subscriptionDuration: "2592000",
    payoutAddress: "0x3456789012345678901234567890123456789012",
    contentURI: "ipfs://QmExample3",
  },
  {
    address: "0x4567890123456789012345678901234567890123",
    name: "NFTCollector",
    bio: "Curating the best NFT collections. Early access to drops for subscribers.",
    avatar: "",
    subscriberCount: "78",
    subscriptionPrice: "15000000000000000", // 0.015 ETH
    subscriptionDuration: "2592000",
    payoutAddress: "0x4567890123456789012345678901234567890123",
    contentURI: "ipfs://QmExample4",
  },
];

export function useCreators() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCreators() {
      try {
        setIsLoading(true);
        setError(null);

        // Try to fetch from relayer API
        const response = await fetch(`${API_ENDPOINTS.relayer}/api/creators`);

        if (response.ok) {
          const data = await response.json();
          setCreators(data.creators || []);
        } else {
          // Fall back to mock data in development
          console.warn("Relayer API not available, using mock data");
          setCreators(MOCK_CREATORS);
        }
      } catch (err) {
        console.warn("Failed to fetch creators, using mock data:", err);
        // Use mock data if API is unavailable
        setCreators(MOCK_CREATORS);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCreators();
  }, []);

  return { creators, isLoading, error };
}

export function useCreator(address: string) {
  const [creator, setCreator] = useState<Creator | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCreator() {
      if (!address) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          `${API_ENDPOINTS.relayer}/api/creators/${address}`
        );

        if (response.ok) {
          const data = await response.json();
          setCreator(data.creator);
        } else if (response.status === 404) {
          setError("Creator not found");
        } else {
          // Fall back to mock data
          const mock = MOCK_CREATORS.find(
            (c) => c.address.toLowerCase() === address.toLowerCase()
          );
          if (mock) {
            setCreator(mock);
          } else {
            setError("Creator not found");
          }
        }
      } catch (err) {
        // Try mock data
        const mock = MOCK_CREATORS.find(
          (c) => c.address.toLowerCase() === address.toLowerCase()
        );
        if (mock) {
          setCreator(mock);
        } else {
          setError("Failed to fetch creator");
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchCreator();
  }, [address]);

  return { creator, isLoading, error };
}
