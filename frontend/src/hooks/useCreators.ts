"use client";

import { useState, useEffect } from "react";
import { Creator } from "@/types";
import { API_ENDPOINTS } from "@/config/wagmi";

// Parse a raw creator object from the API into a typed Creator
export function parseCreatorData(raw: {
  address: string;
  subscriberCount: string;
  subscriptionPrice: string;
  subscriptionDuration?: string;
  payoutAddress: string;
  contentURI: string;
}): Creator {
  let name = raw.address.slice(0, 6) + "..." + raw.address.slice(-4);
  let bio = "";
  let contentURL = "";

  try {
    const meta = JSON.parse(raw.contentURI);
    if (meta.name) name = meta.name;
    if (meta.bio) bio = meta.bio;
    if (meta.contentURL) contentURL = meta.contentURL;
  } catch {
    // Legacy: contentURI is a plain string, not JSON
    if (raw.contentURI && !raw.contentURI.startsWith("{")) {
      const parts = raw.contentURI.split("/");
      name = decodeURIComponent(parts[parts.length - 1] || name);
    }
  }

  return {
    address: raw.address,
    name,
    bio,
    subscriberCount: raw.subscriberCount,
    subscriptionPrice: raw.subscriptionPrice,
    subscriptionDuration: raw.subscriptionDuration || "2592000",
    payoutAddress: raw.payoutAddress,
    contentURI: raw.contentURI,
    contentURL,
  };
}

export function useCreators() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCreators() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`${API_ENDPOINTS.relayer}/api/creators`);

        if (response.ok) {
          const data = await response.json();
          const parsed = (data.creators || []).map(parseCreatorData);
          setCreators(parsed);
        } else {
          setError("Failed to load creators. Please try again.");
          setCreators([]);
        }
      } catch (err) {
        setError("Could not connect to the API. Please try again later.");
        setCreators([]);
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
          setCreator(parseCreatorData(data.creator));
        } else if (response.status === 404) {
          setError("Creator not found");
        } else {
          setError("Failed to load creator");
        }
      } catch (err) {
        setError("Failed to fetch creator");
      } finally {
        setIsLoading(false);
      }
    }

    fetchCreator();
  }, [address]);

  return { creator, isLoading, error };
}
