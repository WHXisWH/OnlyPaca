// Creator profile from API/contract
export interface Creator {
  address: string;
  name: string;
  bio: string;
  avatar?: string;
  banner?: string;
  subscriberCount: string;
  subscriptionPrice: string;
  subscriptionDuration: string;
  payoutAddress: string;
  contentURI: string;
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    website?: string;
  };
}

// Subscription status
export enum SubscriptionStatus {
  NOT_SUBSCRIBED = 0,
  ACTIVE = 1,
  EXPIRED = 2,
}

// Subscribe request payload
export interface SubscribeRequest {
  creator: string;
  subscriber: string;
  deadline: string;
  nonce: string;
  signature: string;
}

// Subscribe response from relayer
export interface SubscribeResponse {
  success: boolean;
  transactionHash: string;
  message: string;
}

// Creator metadata stored on IPFS
export interface CreatorMetadata {
  name: string;
  bio: string;
  avatar?: string;
  banner?: string;
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    website?: string;
  };
}

// EIP-712 typed data for subscription
export interface SubscribeTypedData {
  domain: {
    name: string;
    version: string;
    chainId: bigint;
    verifyingContract: string;
  };
  types: {
    Subscribe: Array<{ name: string; type: string }>;
  };
  message: {
    creator: string;
    subscriber: string;
    nonce: bigint;
    deadline: bigint;
  };
}

// Transaction state
export type TransactionState =
  | { status: "idle" }
  | { status: "signing" }
  | { status: "pending"; hash: string }
  | { status: "success"; hash: string }
  | { status: "error"; error: string };
