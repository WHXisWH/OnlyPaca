// Contract ABIs for OnlyFHE
// These match the deployed contracts

export const SUBSCRIPTION_ABI = [
  // Creator Functions
  {
    name: "registerCreator",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "subscriptionPrice", type: "uint256" },
      { name: "subscriptionDuration", type: "uint256" },
      { name: "payoutAddress", type: "address" },
      { name: "contentURI", type: "string" },
    ],
    outputs: [],
  },
  {
    name: "updateCreatorProfile",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "subscriptionPrice", type: "uint256" },
      { name: "subscriptionDuration", type: "uint256" },
      { name: "payoutAddress", type: "address" },
      { name: "contentURI", type: "string" },
    ],
    outputs: [],
  },
  {
    name: "requestRevenueDecrypt",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    name: "getRevenue",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "amount", type: "uint256" }],
  },
  {
    name: "isRevenueDecryptReady",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "ready", type: "bool" },
      { name: "value", type: "uint256" },
    ],
  },
  {
    name: "withdrawRevenue",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    name: "requestRevenueRangeProof",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "minRevenue", type: "uint64" },
      { name: "maxRevenue", type: "uint64" },
    ],
    outputs: [],
  },

  // Subscriber Functions
  {
    name: "activateSubscription",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "creator", type: "address" },
      { name: "subscriber", type: "address" },
    ],
    outputs: [],
  },
  {
    name: "requestAccessDecrypt",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "creator", type: "address" }],
    outputs: [],
  },
  {
    name: "verifyAccess",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "creator", type: "address" }],
    outputs: [{ name: "status", type: "uint8" }],
  },
  {
    name: "isAccessDecryptReady",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "creator", type: "address" }],
    outputs: [
      { name: "ready", type: "bool" },
      { name: "status", type: "uint8" },
    ],
  },

  // View Functions
  {
    name: "creators",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "creator", type: "address" }],
    outputs: [
      { name: "registered", type: "bool" },
      { name: "subscriberCount", type: "uint256" },
      { name: "subscriptionPrice", type: "uint256" },
      { name: "subscriptionDuration", type: "uint256" },
      { name: "payoutAddress", type: "address" },
      { name: "contentURI", type: "string" },
    ],
  },
  {
    name: "getCreatorProfile",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "creator", type: "address" }],
    outputs: [
      {
        name: "profile",
        type: "tuple",
        components: [
          { name: "registered", type: "bool" },
          { name: "subscriberCount", type: "uint256" },
          { name: "subscriptionPrice", type: "uint256" },
          { name: "subscriptionDuration", type: "uint256" },
          { name: "payoutAddress", type: "address" },
          { name: "contentURI", type: "string" },
        ],
      },
    ],
  },
  {
    name: "isCreator",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "creator", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "isRelayer",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "relayer", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "getSubscriptionPrice",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "creator", type: "address" }],
    outputs: [{ name: "price", type: "uint256" }],
  },
  {
    name: "platformFeeBps",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "platformFeeBalance",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "totalCreators",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },

  // Events
  {
    name: "SubscriptionActivated",
    type: "event",
    inputs: [
      { name: "creator", type: "address", indexed: true },
      { name: "newSubscriberCount", type: "uint256", indexed: false },
    ],
  },
  {
    name: "CreatorRegistered",
    type: "event",
    inputs: [
      { name: "creator", type: "address", indexed: true },
      { name: "subscriptionPrice", type: "uint256", indexed: false },
      { name: "contentURI", type: "string", indexed: false },
    ],
  },
  {
    name: "CreatorUpdated",
    type: "event",
    inputs: [{ name: "creator", type: "address", indexed: true }],
  },
  {
    name: "RevenueWithdrawn",
    type: "event",
    inputs: [
      { name: "creator", type: "address", indexed: true },
      { name: "destination", type: "address", indexed: true },
    ],
  },
] as const;

export const RELAYER_ABI = [
  // Core Functions
  {
    name: "relaySubscription",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "creator", type: "address" },
      { name: "subscriber", type: "address" },
      { name: "deadline", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "signature", type: "bytes" },
    ],
    outputs: [],
  },

  // View Functions
  {
    name: "subscriptionContract",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    name: "nonces",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "getNonce",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "subscriber", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "isSignatureUsed",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "signature", type: "bytes" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "getDomainSeparator",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "bytes32" }],
  },
  {
    name: "getSubscriptionDigest",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "creator", type: "address" },
      { name: "subscriber", type: "address" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bytes32" }],
  },
  {
    name: "totalRelayed",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "paused",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "bool" }],
  },

  // Events
  {
    name: "SubscriptionRelayed",
    type: "event",
    inputs: [
      { name: "creator", type: "address", indexed: true },
      { name: "timestamp", type: "uint256", indexed: false },
      { name: "nonce", type: "uint256", indexed: false },
    ],
  },
] as const;

// EIP-712 types for subscription signing
export const SUBSCRIBE_TYPES = {
  Subscribe: [
    { name: "creator", type: "address" },
    { name: "subscriber", type: "address" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
} as const;

// Get EIP-712 domain for relayer
export function getRelayerDomain(chainId: bigint, verifyingContract: string) {
  return {
    name: "OnlyFHERelayer",
    version: "1",
    chainId,
    verifyingContract: verifyingContract as `0x${string}`,
  };
}
