import { ethers } from "ethers";
import { getProvider, getRelayerWallet, getContractAddresses } from "./blockchain.js";

// Minimal ABI for relayer contract
const RELAYER_ABI = [
  "function relaySubscription(address creator, address subscriber, uint256 deadline, uint256 nonce, bytes signature) payable",
  "function relayAccessDecrypt(address creator, address subscriber, uint256 deadline, uint256 nonce, bytes signature)",
  "function relayRevenueDecrypt(address creator, uint256 deadline, uint256 nonce, bytes signature)",
  "function relayWithdraw(address creator, uint256 deadline, uint256 nonce, bytes signature)",
  "function nonces(address) view returns (uint256)",
];

// Minimal ABI for subscription contract
const SUBSCRIPTION_ABI = [
  "function creators(address) view returns (bool registered, uint256 subscriberCount, uint256 subscriptionPrice, uint256 subscriptionDuration, address payoutAddress, string contentURI)",
];

interface SubscriptionParams {
  creator: string;
  subscriber: string;
  deadline: bigint;
  nonce: bigint;
  signature: string;
}

// Relay a subscription transaction
export async function relaySubscription(params: SubscriptionParams) {
  const { creator, subscriber, deadline, nonce, signature } = params;
  const addresses = getContractAddresses();
  const wallet = getRelayerWallet();

  if (!addresses.relayer) {
    throw new Error("Relayer contract address not configured");
  }

  // Get subscription price from main contract
  const subscriptionContract = new ethers.Contract(
    addresses.subscription,
    SUBSCRIPTION_ABI,
    wallet
  );
  const creatorProfile = await subscriptionContract.creators(creator);

  if (!creatorProfile[0]) {
    throw new Error("Creator not registered");
  }

  const price = creatorProfile[2]; // subscriptionPrice is index 2

  // Create relayer contract instance
  const relayerContract = new ethers.Contract(
    addresses.relayer,
    RELAYER_ABI,
    wallet
  );

  // Estimate gas and submit transaction
  const tx = await relayerContract.relaySubscription(
    creator,
    subscriber,
    deadline,
    nonce,
    signature,
    { value: price }
  );

  console.log(`Transaction submitted: ${tx.hash}`);

  // Wait for confirmation
  const receipt = await tx.wait();
  console.log(`Transaction confirmed in block ${receipt.blockNumber}`);

  return {
    hash: tx.hash,
    blockNumber: receipt.blockNumber,
  };
}

// Get current nonce for a user
export async function getNonce(address: string): Promise<bigint> {
  const addresses = getContractAddresses();
  const provider = getProvider();

  if (!addresses.relayer) {
    throw new Error("Relayer contract address not configured");
  }

  const relayerContract = new ethers.Contract(
    addresses.relayer,
    RELAYER_ABI,
    provider
  );

  return relayerContract.nonces(address);
}

interface AccessDecryptParams {
  creator: string;
  subscriber: string;
  deadline: bigint;
  nonce: bigint;
  signature: string;
}

// Relay an access decrypt request
export async function relayAccessDecrypt(params: AccessDecryptParams) {
  const { creator, subscriber, deadline, nonce, signature } = params;
  const addresses = getContractAddresses();
  const wallet = getRelayerWallet();

  if (!addresses.relayer) {
    throw new Error("Relayer contract address not configured");
  }

  const relayerContract = new ethers.Contract(
    addresses.relayer,
    RELAYER_ABI,
    wallet
  );

  const tx = await relayerContract.relayAccessDecrypt(
    creator,
    subscriber,
    deadline,
    nonce,
    signature
  );

  console.log(`Access decrypt relayed: ${tx.hash}`);

  const receipt = await tx.wait();
  console.log(`Transaction confirmed in block ${receipt.blockNumber}`);

  return {
    hash: tx.hash,
    blockNumber: receipt.blockNumber,
  };
}

interface RevenueDecryptParams {
  creator: string;
  deadline: bigint;
  nonce: bigint;
  signature: string;
}

// Relay a revenue decrypt request
export async function relayRevenueDecrypt(params: RevenueDecryptParams) {
  const { creator, deadline, nonce, signature } = params;
  const addresses = getContractAddresses();
  const wallet = getRelayerWallet();

  if (!addresses.relayer) {
    throw new Error("Relayer contract address not configured");
  }

  const relayerContract = new ethers.Contract(
    addresses.relayer,
    RELAYER_ABI,
    wallet
  );

  const tx = await relayerContract.relayRevenueDecrypt(
    creator,
    deadline,
    nonce,
    signature
  );

  console.log(`Revenue decrypt relayed: ${tx.hash}`);

  const receipt = await tx.wait();
  console.log(`Transaction confirmed in block ${receipt.blockNumber}`);

  return {
    hash: tx.hash,
    blockNumber: receipt.blockNumber,
  };
}

interface WithdrawParams {
  creator: string;
  deadline: bigint;
  nonce: bigint;
  signature: string;
}

// Relay a withdrawal request
export async function relayWithdraw(params: WithdrawParams) {
  const { creator, deadline, nonce, signature } = params;
  const addresses = getContractAddresses();
  const wallet = getRelayerWallet();

  if (!addresses.relayer) {
    throw new Error("Relayer contract address not configured");
  }

  const relayerContract = new ethers.Contract(
    addresses.relayer,
    RELAYER_ABI,
    wallet
  );

  const tx = await relayerContract.relayWithdraw(
    creator,
    deadline,
    nonce,
    signature
  );

  console.log(`Withdraw relayed: ${tx.hash}`);

  const receipt = await tx.wait();
  console.log(`Transaction confirmed in block ${receipt.blockNumber}`);

  return {
    hash: tx.hash,
    blockNumber: receipt.blockNumber,
  };
}
