// Contract ABIs
// These will be updated with full ABIs after contract compilation

export const SUBSCRIPTION_ABI = [
  // Creator functions
  "function registerCreator(uint256 subscriptionPrice, address payoutAddress, string contentURI)",
  "function getRevenue(tuple(bytes32,bytes) perm) view returns (uint256)",
  "function withdrawRevenue(tuple(bytes32,bytes) perm)",
  "function proveRevenueInRange(uint64 minRevenue, uint64 maxRevenue, tuple(bytes32,bytes) perm) view returns (bool)",

  // Subscriber functions
  "function verifyAccess(address creator, tuple(bytes32,bytes) perm) view returns (uint8)",

  // Relayer functions
  "function activateSubscription(address creator, address subscriber) payable",

  // View functions
  "function creators(address) view returns (bool registered, uint256 subscriberCount, uint256 subscriptionPrice, address payoutAddress, string contentURI)",
  "function relayers(address) view returns (bool)",
  "function platformFeeBps() view returns (uint256)",
  "function platformFeeBalance() view returns (uint256)",
  "function owner() view returns (address)",

  // Admin functions
  "function setRelayer(address relayer, bool status)",
  "function setPlatformFee(uint256 feeBps)",
  "function withdrawPlatformFees()",

  // Events
  "event SubscriptionActivated(address indexed creator, uint256 newSubscriberCount)",
  "event CreatorRegistered(address indexed creator, uint256 subscriptionPrice)",
  "event RevenueWithdrawn(address indexed creator, address indexed destination)",
  "event RelayerUpdated(address indexed relayer, bool status)",
] as const;

export const RELAYER_ABI = [
  // Core function
  "function relaySubscription(address creator, address subscriber, uint256 deadline, uint256 nonce, bytes signature) payable",

  // View functions
  "function subscriptionContract() view returns (address)",
  "function nonces(address) view returns (uint256)",
  "function owner() view returns (address)",

  // Events
  "event SubscriptionRelayed(address indexed creator, uint256 timestamp)",
] as const;
