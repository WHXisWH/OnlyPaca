import { ethers, EventLog } from "ethers";
import { getProvider, getContractAddresses } from "./blockchain.js";

// Minimal ABI for reading creator data
const SUBSCRIPTION_ABI = [
  "function creators(address) view returns (bool registered, uint256 subscriberCount, uint256 subscriptionPrice, uint256 subscriptionDuration, address payoutAddress, string contentURI)",
  "event CreatorRegistered(address indexed creator, uint256 subscriptionPrice)",
];

export interface CreatorProfile {
  address: string;
  registered: boolean;
  subscriberCount: string;
  subscriptionPrice: string;
  payoutAddress: string;
  contentURI: string;
}

// Get creator profile by address
export async function getCreatorProfile(address: string): Promise<CreatorProfile | null> {
  const addresses = getContractAddresses();
  const provider = getProvider();

  if (!addresses.subscription) {
    throw new Error("Subscription contract address not configured");
  }

  const contract = new ethers.Contract(
    addresses.subscription,
    SUBSCRIPTION_ABI,
    provider
  );

  const profile = await contract.creators(address);

  if (!profile.registered) {
    return null;
  }

  return {
    address,
    registered: profile.registered,
    subscriberCount: profile.subscriberCount.toString(),
    subscriptionPrice: profile.subscriptionPrice.toString(),
    payoutAddress: profile.payoutAddress,
    contentURI: profile.contentURI,
  };
}

// Get all registered creators by scanning events
export async function getRegisteredCreators(): Promise<CreatorProfile[]> {
  const addresses = getContractAddresses();
  const provider = getProvider();

  if (!addresses.subscription) {
    return [];
  }

  const contract = new ethers.Contract(
    addresses.subscription,
    SUBSCRIPTION_ABI,
    provider
  );

  // Query CreatorRegistered events
  const filter = contract.filters.CreatorRegistered();
  const events = await contract.queryFilter(filter, -10000); // Last 10000 blocks

  // Get unique creator addresses
  const creatorAddresses = [...new Set(
    events
      .filter((e): e is EventLog => e instanceof EventLog)
      .map((e) => e.args[0])
  )];

  // Fetch current profile for each creator
  const profiles = await Promise.all(
    creatorAddresses.map((addr) => getCreatorProfile(addr))
  );

  // Filter out null/unregistered creators
  return profiles.filter((p): p is CreatorProfile => p !== null && p.registered);
}
