// Chain IDs
export const CHAIN_IDS = {
  ARBITRUM_SEPOLIA: 421614,
  ETH_SEPOLIA: 11155111,
} as const;

// Platform constants
export const PLATFORM = {
  NAME: "OnlyFHE",
  FEE_BPS: 500, // 5%
  FEE_MAX_BPS: 1000, // 10% max
} as const;

// Subscription status values (stored as euint8)
export const SUBSCRIPTION_STATUS = {
  NOT_SUBSCRIBED: 0,
  ACTIVE: 1,
  EXPIRED: 2, // Future use
} as const;

// EIP-712 type definitions
export const EIP712_TYPES = {
  Subscribe: [
    { name: "creator", type: "address" },
    { name: "subscriber", type: "address" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
} as const;

// EIP-712 domain for Relayer contract
export function getRelayerDomain(chainId: bigint, verifyingContract: string) {
  return {
    name: "OnlyFHERelayer",
    version: "1",
    chainId,
    verifyingContract,
  };
}
