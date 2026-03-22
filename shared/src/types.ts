// Creator profile from contract
export interface CreatorProfile {
  address: string;
  registered: boolean;
  subscriberCount: bigint;
  subscriptionPrice: bigint;
  payoutAddress: string;
  contentURI: string;
}

// Creator profile for API/UI (serialized)
export interface CreatorProfileDTO {
  address: string;
  registered: boolean;
  subscriberCount: string;
  subscriptionPrice: string;
  subscriptionPriceFormatted: string;
  payoutAddress: string;
  contentURI: string;
}

// Subscription request for relayer API
export interface SubscribeRequest {
  creator: string;
  subscriber: string;
  deadline: string;
  nonce: string;
  signature: string;
}

// Subscription response from relayer
export interface SubscribeResponse {
  success: boolean;
  transactionHash: string;
  message: string;
}

// EIP-712 typed data for subscription authorization
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
  value: {
    creator: string;
    subscriber: string;
    nonce: bigint;
    deadline: bigint;
  };
}

// Content metadata stored on IPFS
export interface CreatorMetadata {
  name: string;
  bio: string;
  avatar: string;
  banner?: string;
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    website?: string;
  };
}
