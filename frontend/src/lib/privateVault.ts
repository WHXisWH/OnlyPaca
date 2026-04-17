"use client";

import { SubscriptionStatus } from "@/types";

export type PrivateVaultStage =
  | "not-started"
  | "relay-submitted"
  | "awaiting-verification"
  | "verified-active"
  | "verified-inactive";

export interface PrivateVaultEntry {
  creatorAddress: string;
  creatorName: string;
  creatorBio?: string;
  creatorAvatar?: string;
  subscriptionPrice?: string;
  contentURL?: string;
  txHash?: string;
  relayedAt?: string;
  lastCheckedAt?: string;
  subscribedAt?: string;
  status: SubscriptionStatus | null;
  stage: PrivateVaultStage;
}

const LEGACY_SUBS_KEY_PREFIX = "onlypaca_subs_";
const LEGACY_SUBTIME_KEY_PREFIX = "onlypaca_subtime_";
const LEGACY_VERIFIED_KEY_PREFIX = "onlypaca_verified_";
const PRIVATE_VAULT_KEY_PREFIX = "onlypaca_private_vault_";

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function getVaultKey(userAddress: string) {
  return `${PRIVATE_VAULT_KEY_PREFIX}${userAddress.toLowerCase()}`;
}

function getLegacySubsKey(userAddress: string) {
  return `${LEGACY_SUBS_KEY_PREFIX}${userAddress.toLowerCase()}`;
}

function getLegacySubtimeKey(userAddress: string, creatorAddress: string) {
  return `${LEGACY_SUBTIME_KEY_PREFIX}${userAddress.toLowerCase()}_${creatorAddress.toLowerCase()}`;
}

function getLegacyVerifiedKey(userAddress: string, creatorAddress: string) {
  return `${LEGACY_VERIFIED_KEY_PREFIX}${userAddress.toLowerCase()}_${creatorAddress.toLowerCase()}`;
}

function sortEntries(entries: PrivateVaultEntry[]) {
  return [...entries].sort((a, b) => {
    const aTime = new Date(a.lastCheckedAt || a.relayedAt || a.subscribedAt || 0).getTime();
    const bTime = new Date(b.lastCheckedAt || b.relayedAt || b.subscribedAt || 0).getTime();

    return bTime - aTime;
  });
}

function getStageFromStatus(status: SubscriptionStatus | null): PrivateVaultStage {
  if (status === SubscriptionStatus.ACTIVE) {
    return "verified-active";
  }

  if (status === SubscriptionStatus.NOT_SUBSCRIBED || status === SubscriptionStatus.EXPIRED) {
    return "verified-inactive";
  }

  return "awaiting-verification";
}

export function readPrivateVault(userAddress: string): PrivateVaultEntry[] {
  if (typeof window === "undefined") return [];

  return sortEntries(
    safeParse<PrivateVaultEntry[]>(window.localStorage.getItem(getVaultKey(userAddress)), [])
  );
}

export function writePrivateVault(userAddress: string, entries: PrivateVaultEntry[]) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(getVaultKey(userAddress), JSON.stringify(sortEntries(entries)));
}

export function upsertPrivateVaultEntry(
  userAddress: string,
  entry: Omit<PrivateVaultEntry, "status" | "stage"> & {
    status?: SubscriptionStatus | null;
    stage?: PrivateVaultStage;
  }
) {
  const current = readPrivateVault(userAddress);
  const existing = current.find(
    (item) => item.creatorAddress.toLowerCase() === entry.creatorAddress.toLowerCase()
  );

  const nextStatus = entry.status ?? existing?.status ?? null;
  const nextEntry: PrivateVaultEntry = {
    creatorAddress: entry.creatorAddress,
    creatorName: entry.creatorName,
    creatorBio: entry.creatorBio ?? existing?.creatorBio,
    creatorAvatar: entry.creatorAvatar ?? existing?.creatorAvatar,
    subscriptionPrice: entry.subscriptionPrice ?? existing?.subscriptionPrice,
    contentURL: entry.contentURL ?? existing?.contentURL,
    txHash: entry.txHash ?? existing?.txHash,
    relayedAt: entry.relayedAt ?? existing?.relayedAt,
    lastCheckedAt: entry.lastCheckedAt ?? existing?.lastCheckedAt,
    subscribedAt: entry.subscribedAt ?? existing?.subscribedAt,
    status: nextStatus,
    stage: entry.stage ?? existing?.stage ?? getStageFromStatus(nextStatus),
  };

  const filtered = current.filter(
    (item) => item.creatorAddress.toLowerCase() !== entry.creatorAddress.toLowerCase()
  );

  writePrivateVault(userAddress, [...filtered, nextEntry]);
}

export function updatePrivateVaultVerification(
  userAddress: string,
  creatorAddress: string,
  status: SubscriptionStatus
) {
  const current = readPrivateVault(userAddress);

  const next = current.map((entry) => {
    if (entry.creatorAddress.toLowerCase() !== creatorAddress.toLowerCase()) {
      return entry;
    }

    return {
      ...entry,
      status,
      stage: getStageFromStatus(status),
      lastCheckedAt: new Date().toISOString(),
    };
  });

  writePrivateVault(userAddress, next);

  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      getLegacyVerifiedKey(userAddress, creatorAddress),
      status.toString()
    );
  }
}

export function migrateLegacyVault(userAddress: string) {
  if (typeof window === "undefined") return;

  const existingVault = readPrivateVault(userAddress);
  const legacySubs = safeParse<string[]>(
    window.localStorage.getItem(getLegacySubsKey(userAddress)),
    []
  );

  if (legacySubs.length === 0) return;

  const merged = [...existingVault];

  for (const creatorAddress of legacySubs) {
    const alreadyExists = merged.some(
      (entry) => entry.creatorAddress.toLowerCase() === creatorAddress.toLowerCase()
    );

    if (alreadyExists) continue;

    const rawStatus = window.localStorage.getItem(
      getLegacyVerifiedKey(userAddress, creatorAddress)
    );
    const status =
      rawStatus === null ? null : (Number.parseInt(rawStatus, 10) as SubscriptionStatus);

    merged.push({
      creatorAddress,
      creatorName: `${creatorAddress.slice(0, 6)}...${creatorAddress.slice(-4)}`,
      subscribedAt:
        window.localStorage.getItem(getLegacySubtimeKey(userAddress, creatorAddress)) ?? undefined,
      status,
      stage: getStageFromStatus(status),
    });
  }

  writePrivateVault(userAddress, merged);
}

export function getVaultStatusCopy(stage: PrivateVaultStage, status: SubscriptionStatus | null) {
  switch (stage) {
    case "not-started":
      return {
        label: "No Local Flow Yet",
        helper:
          "Start a private subscription from this browser to create a local helper record. Access is still verified on-chain when you need it.",
      };
    case "relay-submitted":
      return {
        label: "Relay Submitted",
        helper: "The relayer broadcast the transaction. Access still needs an FHE verification step.",
      };
    case "verified-active":
      return {
        label: "Verified Active",
        helper: "Your browser saw a successful FHE access verification for this creator.",
      };
    case "verified-inactive":
      return {
        label:
          status === SubscriptionStatus.EXPIRED ? "Verified Expired" : "Verified Not Active",
        helper: "A recent FHE verification showed this creator is not currently unlocked.",
      };
    case "awaiting-verification":
    default:
      return {
        label: "Awaiting Verification",
        helper:
          "Only you can re-check access. This browser cannot publicly enumerate private subscriptions.",
      };
  }
}
