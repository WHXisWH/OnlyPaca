# OnlyFHE — Smart Contract Interface

> Stack: Solidity ^0.8.24 + Fhenix CoFHE (`cofhe-contracts`)
> Network: Arbitrum Sepolia
> Starter: `cofhe-hardhat-starter` (https://github.com/fhenixprotocol/cofhe-hardhat-starter)

---

## 1. Overview

OnlyFHE uses **two smart contracts**:

| Contract | Purpose |
|---|---|
| `OnlyFHESubscription.sol` | Core FHE contract: encrypted subscription state, encrypted revenue, access control |
| `OnlyFHERelayer.sol` | Trusted relayer: receives user-signed messages, submits transactions on their behalf |

Both contracts import from `@fhenixprotocol/cofhe-contracts/FHE.sol`.

---

## 2. Environment Setup

```bash
# Clone the Fhenix starter (required)
git clone https://github.com/fhenixprotocol/cofhe-hardhat-starter.git onlyfhe
cd onlyfhe
pnpm install

# Install additional dependencies
pnpm add @openzeppelin/contracts
```

`hardhat.config.ts` — the cofhe-hardhat-plugin is already imported in the starter. No changes needed for local mock testing.

```typescript
// hardhat.config.ts (from starter, no changes needed)
import "@fhenixprotocol/cofhe-hardhat-plugin";
```

---

## 3. Contract A: OnlyFHESubscription.sol

### 3.1 Full Contract Code

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { FHE, euint8, euint64, euint128, ebool, inEuint8, inEuint64 } from "@fhenixprotocol/cofhe-contracts/FHE.sol";
import { Permissioned, Permission } from "@fhenixprotocol/cofhe-contracts/access/Permissioned.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title OnlyFHESubscription
 * @notice Privacy-first creator subscription platform using FHE
 * @dev Subscription relationships and creator revenue are stored encrypted.
 *      Only the subscriber can verify their own access.
 *      Only the creator can view their own earnings.
 *      The platform operator cannot read any encrypted state.
 */
contract OnlyFHESubscription is Permissioned, Ownable, ReentrancyGuard {

    // ─────────────────────────────────────────────────────────────────────────
    // Types
    // ─────────────────────────────────────────────────────────────────────────

    struct CreatorProfile {
        bool registered;
        uint256 subscriberCount;     // Public: social proof (not private)
        uint256 subscriptionPrice;   // Public: price in wei
        address payoutAddress;       // Where revenue is sent on withdrawal
        string contentURI;           // IPFS CID of creator metadata (public)
    }

    // ─────────────────────────────────────────────────────────────────────────
    // State Variables
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Encrypted subscription status: creator → subscriber → euint8
    /// @dev euint8: 0 = not subscribed, 1 = active, 2 = expired (future use)
    mapping(address => mapping(address => euint8)) private _subscriptions;

    /// @notice Encrypted accumulated revenue per creator
    /// @dev euint64 holds up to ~18.4 ETH in wei. Use euint128 for production.
    mapping(address => euint64) private _creatorRevenue;

    /// @notice Encrypted subscription expiry timestamp (future use, MVP: not implemented)
    // mapping(address => mapping(address => euint64)) private _expiryTimestamp;

    /// @notice Public creator profiles
    mapping(address => CreatorProfile) public creators;

    /// @notice Whitelisted relayer addresses
    mapping(address => bool) public relayers;

    /// @notice Platform fee in basis points (e.g., 500 = 5%)
    uint256 public platformFeeBps = 500;

    /// @notice Accumulated platform fees (plaintext, belongs to platform)
    uint256 public platformFeeBalance;

    // ─────────────────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Emitted when a subscription is activated
    /// @dev Intentionally does NOT include subscriber address (privacy)
    event SubscriptionActivated(address indexed creator, uint256 newSubscriberCount);

    /// @notice Emitted when a creator registers or updates profile
    event CreatorRegistered(address indexed creator, uint256 subscriptionPrice);

    /// @notice Emitted when a creator withdraws revenue
    /// @dev Amount is NOT emitted (privacy)
    event RevenueWithdrawn(address indexed creator, address indexed destination);

    /// @notice Emitted when relayer status changes
    event RelayerUpdated(address indexed relayer, bool status);

    // ─────────────────────────────────────────────────────────────────────────
    // Errors
    // ─────────────────────────────────────────────────────────────────────────

    error NotRelayer();
    error CreatorNotFound();
    error InsufficientPayment(uint256 required, uint256 provided);
    error NotCreator();
    error TransferFailed();
    error InvalidAddress();

    // ─────────────────────────────────────────────────────────────────────────
    // Modifiers
    // ─────────────────────────────────────────────────────────────────────────

    modifier onlyRelayer() {
        if (!relayers[msg.sender]) revert NotRelayer();
        _;
    }

    modifier onlyRegisteredCreator(address creator) {
        if (!creators[creator].registered) revert CreatorNotFound();
        _;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────────────────

    constructor(address initialRelayer) Ownable(msg.sender) {
        relayers[initialRelayer] = true;
        emit RelayerUpdated(initialRelayer, true);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Creator Functions
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Register as a creator or update profile
     * @param subscriptionPrice Price in wei per subscription period
     * @param payoutAddress Address to receive revenue on withdrawal
     * @param contentURI IPFS CID of creator metadata JSON
     */
    function registerCreator(
        uint256 subscriptionPrice,
        address payoutAddress,
        string calldata contentURI
    ) external {
        if (payoutAddress == address(0)) revert InvalidAddress();

        creators[msg.sender] = CreatorProfile({
            registered: true,
            subscriberCount: creators[msg.sender].subscriberCount,
            subscriptionPrice: subscriptionPrice,
            payoutAddress: payoutAddress,
            contentURI: contentURI
        });

        emit CreatorRegistered(msg.sender, subscriptionPrice);
    }

    /**
     * @notice View encrypted total revenue (creator only)
     * @dev Uses CoFHE Permission system — only the creator's signed permission works
     * @param perm CoFHE Permission signed by msg.sender
     * @return Decrypted revenue amount in wei
     */
    function getRevenue(
        Permission calldata perm
    ) external view onlySender(perm) returns (uint256) {
        return FHE.decrypt(_creatorRevenue[msg.sender]);
    }

    /**
     * @notice Prove that revenue is within a range (selective disclosure)
     * @dev Returns an encrypted boolean — only reveals if condition is true, not the amount
     * @param minRevenue Minimum threshold (plaintext, caller provides)
     * @param maxRevenue Maximum threshold (plaintext, caller provides)
     * @param perm CoFHE Permission signed by creator
     * @return True if revenue is within [minRevenue, maxRevenue]
     */
    function proveRevenueInRange(
        uint64 minRevenue,
        uint64 maxRevenue,
        Permission calldata perm
    ) external view onlySender(perm) returns (bool) {
        euint64 revenue = _creatorRevenue[msg.sender];
        euint64 eMin = FHE.asEuint64(minRevenue);
        euint64 eMax = FHE.asEuint64(maxRevenue);
        ebool aboveMin = FHE.gte(revenue, eMin);
        ebool belowMax = FHE.lte(revenue, eMax);
        ebool inRange = FHE.and(aboveMin, belowMax);
        return FHE.decrypt(inRange);
    }

    /**
     * @notice Withdraw revenue to creator's registered payout address
     * @dev Amount withdrawn is the decrypted total; emits no amount for privacy
     *      In production: use Stealth Address for payout destination
     * @param perm CoFHE Permission signed by creator
     */
    function withdrawRevenue(
        Permission calldata perm
    ) external nonReentrant onlySender(perm) {
        address creator = msg.sender;
        if (!creators[creator].registered) revert CreatorNotFound();

        // Decrypt the total revenue
        uint256 amount = FHE.decrypt(_creatorRevenue[creator]);

        // Reset encrypted revenue to zero
        _creatorRevenue[creator] = FHE.asEuint64(0);
        FHE.allowThis(_creatorRevenue[creator]);
        FHE.allow(_creatorRevenue[creator], creator);

        // Transfer to creator's registered payout address (no amount in event)
        address destination = creators[creator].payoutAddress;
        (bool success, ) = destination.call{value: amount}("");
        if (!success) revert TransferFailed();

        emit RevenueWithdrawn(creator, destination);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Subscriber Functions (via Relayer)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Activate a subscription (called by Relayer on behalf of subscriber)
     * @dev The Relayer receives ETH from the Stealth Address payment and forwards it here.
     *      msg.sender = Relayer (subscriber identity protected)
     *      subscriber = the real fan's address (passed by Relayer after signature verification)
     * @param creator Creator address to subscribe to
     * @param subscriber Real subscriber address (verified off-chain via EIP-712 sig)
     */
    function activateSubscription(
        address creator,
        address subscriber
    ) external payable onlyRelayer onlyRegisteredCreator(creator) nonReentrant {
        uint256 price = creators[creator].subscriptionPrice;
        if (msg.value < price) revert InsufficientPayment(price, msg.value);

        // Calculate fees
        uint256 platformFee = (price * platformFeeBps) / 10_000;
        uint256 creatorAmount = price - platformFee;
        platformFeeBalance += platformFee;

        // ── FHE OPERATIONS ────────────────────────────────────────────────

        // 1. Set subscription status to 1 (active) — encrypted
        euint8 activeStatus = FHE.asEuint8(1);
        _subscriptions[creator][subscriber] = activeStatus;

        // Grant access: contract can read, subscriber can read (for verifyAccess)
        FHE.allowThis(activeStatus);
        FHE.allow(activeStatus, subscriber);
        // Note: creator does NOT get permission to read subscriber's status (privacy)

        // 2. Add creator's share to encrypted revenue — computed on ciphertext
        euint64 payment = FHE.asEuint64(uint64(creatorAmount));
        _creatorRevenue[creator] = FHE.add(_creatorRevenue[creator], payment);

        // Grant access: contract can read, creator can decrypt their own revenue
        FHE.allowThis(_creatorRevenue[creator]);
        FHE.allow(_creatorRevenue[creator], creator);

        // ── END FHE OPERATIONS ────────────────────────────────────────────

        // Public subscriber count — no privacy concern for the count itself
        creators[creator].subscriberCount += 1;

        // Refund excess payment
        uint256 excess = msg.value - price;
        if (excess > 0) {
            (bool refundSuccess, ) = subscriber.call{value: excess}("");
            // Non-critical: if refund fails, excess stays in contract (can be claimed)
        }

        // Event: no subscriber address emitted
        emit SubscriptionActivated(creator, creators[creator].subscriberCount);
    }

    /**
     * @notice Verify subscriber's own access status (subscriber-only)
     * @dev Uses CoFHE Permission — only the subscriber can call this with a valid perm
     *      The Permission is signed by the subscriber's wallet; no one else can use it
     * @param creator Creator address to check access for
     * @param perm CoFHE Permission signed by the subscriber (msg.sender)
     * @return 1 if subscribed, 0 if not
     */
    function verifyAccess(
        address creator,
        Permission calldata perm
    ) external view onlySender(perm) returns (uint8) {
        return uint8(FHE.decrypt(_subscriptions[creator][msg.sender]));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Admin Functions
    // ─────────────────────────────────────────────────────────────────────────

    function setRelayer(address relayer, bool status) external onlyOwner {
        relayers[relayer] = status;
        emit RelayerUpdated(relayer, status);
    }

    function setPlatformFee(uint256 feeBps) external onlyOwner {
        require(feeBps <= 1000, "Max 10%");
        platformFeeBps = feeBps;
    }

    function withdrawPlatformFees() external onlyOwner nonReentrant {
        uint256 amount = platformFeeBalance;
        platformFeeBalance = 0;
        (bool success, ) = owner().call{value: amount}("");
        if (!success) revert TransferFailed();
    }

    receive() external payable {}
}
```

---

## 4. Contract B: OnlyFHERelayer.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IOnlyFHESubscription {
    function activateSubscription(
        address creator,
        address subscriber
    ) external payable;

    function creators(address creator) external view returns (
        bool registered,
        uint256 subscriberCount,
        uint256 subscriptionPrice,
        address payoutAddress,
        string memory contentURI
    );
}

/**
 * @title OnlyFHERelayer
 * @notice Accepts user-signed subscription authorization, submits on their behalf
 * @dev The Relayer breaks the on-chain link between subscriber wallet and contract call.
 *      msg.sender to OnlyFHESubscription is always this contract, not the user.
 */
contract OnlyFHERelayer is EIP712, Ownable {
    using ECDSA for bytes32;

    // ─── Types ─────────────────────────────────────────────────────────────

    bytes32 private constant SUBSCRIBE_TYPEHASH = keccak256(
        "Subscribe(address creator,address subscriber,uint256 nonce,uint256 deadline)"
    );

    // ─── State ─────────────────────────────────────────────────────────────

    IOnlyFHESubscription public subscriptionContract;
    mapping(address => uint256) public nonces;

    // ─── Events ────────────────────────────────────────────────────────────

    event SubscriptionRelayed(address indexed creator, uint256 timestamp);

    // ─── Errors ────────────────────────────────────────────────────────────

    error InvalidSignature();
    error ExpiredDeadline();
    error InvalidNonce();
    error InsufficientFunds();

    // ─── Constructor ────────────────────────────────────────────────────────

    constructor(address _subscriptionContract)
        EIP712("OnlyFHERelayer", "1")
        Ownable(msg.sender)
    {
        subscriptionContract = IOnlyFHESubscription(_subscriptionContract);
    }

    // ─── Core Function ──────────────────────────────────────────────────────

    /**
     * @notice Relay a subscription on behalf of a subscriber
     * @dev Verifies EIP-712 signature, then calls subscriptionContract.activateSubscription()
     *      Funds (subscription price) are passed as msg.value from Relayer backend
     * @param creator The creator to subscribe to
     * @param subscriber The real subscriber address
     * @param deadline Signature expiry timestamp
     * @param nonce Anti-replay nonce
     * @param signature EIP-712 signature from subscriber
     */
    function relaySubscription(
        address creator,
        address subscriber,
        uint256 deadline,
        uint256 nonce,
        bytes calldata signature
    ) external payable onlyOwner {
        // Validate deadline
        if (block.timestamp > deadline) revert ExpiredDeadline();

        // Validate nonce
        if (nonces[subscriber] != nonce) revert InvalidNonce();
        nonces[subscriber]++;

        // Verify EIP-712 signature
        bytes32 structHash = keccak256(abi.encode(
            SUBSCRIBE_TYPEHASH,
            creator,
            subscriber,
            nonce,
            deadline
        ));
        bytes32 digest = _hashTypedDataV4(structHash);
        address recovered = digest.recover(signature);
        if (recovered != subscriber) revert InvalidSignature();

        // Get subscription price
        (, , uint256 price, , ) = subscriptionContract.creators(creator);
        if (msg.value < price) revert InsufficientFunds();

        // Forward subscription to FHE contract
        subscriptionContract.activateSubscription{value: price}(creator, subscriber);

        emit SubscriptionRelayed(creator, block.timestamp);
    }

    // Allow Relayer backend to fund the contract
    receive() external payable {}
}
```

---

## 5. Data Structures

### 5.1 Encrypted Types Used

| Variable | FHE Type | Range | Purpose |
|---|---|---|---|
| `_subscriptions[creator][subscriber]` | `euint8` | 0–255 | Subscription status flag |
| `_creatorRevenue[creator]` | `euint64` | 0–18.4 ETH (in wei) | Accumulated earnings |
| *(future)* `_expiryTimestamp` | `euint64` | Unix timestamp | Subscription expiry |
| *(future)* `_contentAccess[content][user]` | `euint8` | 0 or 1 | Per-content access flag |

### 5.2 Public Types (Not Encrypted)

| Variable | Solidity Type | Why Public |
|---|---|---|
| `subscribers[creator].subscriberCount` | `uint256` | Social proof — creator wants this visible |
| `subscriptionPrice` | `uint256` | User needs to know price before paying |
| `contentURI` | `string` | IPFS link to creator's public metadata |
| `platformFeeBalance` | `uint256` | Transparency for platform accounting |

---

## 6. Access Control (CoFHE ACL)

### 6.1 Permission Rules

| Encrypted Value | Who Can Decrypt | How |
|---|---|---|
| `_subscriptions[C][S]` | Subscriber `S` only | `FHE.allow(value, subscriber)` in `activateSubscription()` |
| `_creatorRevenue[C]` | Creator `C` only | `FHE.allow(value, creator)` in `activateSubscription()` |
| *(future)* `_contentAccess[T][U]` | User `U` only | `FHE.allow(value, user)` on purchase |

### 6.2 Key Principle

The Relayer (`msg.sender` during activation) is **never granted permission** to decrypt any encrypted value. The Relayer can write encrypted state but cannot read it. Even the platform operator is cryptographically locked out.

---

## 7. Events

| Event | Parameters | Privacy Note |
|---|---|---|
| `SubscriptionActivated` | `creator`, `newSubscriberCount` | Subscriber address intentionally omitted |
| `CreatorRegistered` | `creator`, `subscriptionPrice` | Public info, no privacy concern |
| `RevenueWithdrawn` | `creator`, `destination` | Amount intentionally omitted |
| `RelayerUpdated` | `relayer`, `status` | Admin event |

---

## 8. Error Handling

| Error | Trigger | Recovery |
|---|---|---|
| `NotRelayer()` | Non-relayer calls `activateSubscription()` | Relayer config issue |
| `CreatorNotFound()` | Subscribe to unregistered creator | Register creator first |
| `InsufficientPayment(required, provided)` | Underpayment | Frontend should pre-check price |
| `NotCreator()` | *(future use)* | N/A |
| `TransferFailed()` | ETH transfer reverts | Retry or check destination address |
| `InvalidSignature()` | Tampered EIP-712 sig | Re-sign with correct parameters |
| `ExpiredDeadline()` | Stale signature | Re-sign with fresh deadline |

---

## 9. Testing Strategy

### 9.1 Mock Environment (Local)

Use `cofhe-hardhat-plugin` mock mode — FHE operations return instantly with plaintext stored on-chain.

```typescript
// test/OnlyFHE.test.ts
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { mock_expectPlaintext } from "@fhenixprotocol/cofhe-hardhat-plugin/mock";

describe("OnlyFHESubscription", function () {
    async function deployFixture() {
        const [owner, relayer, creator, subscriber] = await ethers.getSigners();

        // Set up CoFHE client for mock
        await hre.cofhe.createClientWithBatteries(owner);

        const Subscription = await ethers.getContractFactory("OnlyFHESubscription");
        const subscription = await Subscription.deploy(relayer.address);

        return { subscription, owner, relayer, creator, subscriber };
    }

    it("should encrypt subscription state", async function () {
        const { subscription, relayer, creator, subscriber } = await loadFixture(deployFixture);

        // Creator registers
        await subscription.connect(creator).registerCreator(
            ethers.parseEther("0.01"),
            creator.address,
            "ipfs://QmCreatorMetadata"
        );

        // Check initial subscription status is 0 (not subscribed)
        const initialStatus = await subscription.subscriptions(creator.address, subscriber.address);
        await mock_expectPlaintext(subscriber.provider, initialStatus, 0n);

        // Relayer activates subscription
        await subscription.connect(relayer).activateSubscription(
            creator.address,
            subscriber.address,
            { value: ethers.parseEther("0.01") }
        );

        // Verify subscription status is now 1 (subscribed)
        const activeStatus = await subscription.subscriptions(creator.address, subscriber.address);
        await mock_expectPlaintext(subscriber.provider, activeStatus, 1n);

        // Verify subscriber count incremented (public)
        const profile = await subscription.creators(creator.address);
        expect(profile.subscriberCount).to.equal(1n);
    });

    it("should encrypt creator revenue", async function () {
        const { subscription, relayer, creator, subscriber } = await loadFixture(deployFixture);

        await subscription.connect(creator).registerCreator(
            ethers.parseEther("0.01"),
            creator.address,
            "ipfs://QmMeta"
        );

        await subscription.connect(relayer).activateSubscription(
            creator.address,
            subscriber.address,
            { value: ethers.parseEther("0.01") }
        );

        // Check encrypted revenue
        const encRevenue = await subscription.creatorRevenue(creator.address);
        const expectedRevenue = ethers.parseEther("0.01") * 95n / 100n; // 5% platform fee
        await mock_expectPlaintext(creator.provider, encRevenue, expectedRevenue);
    });

    it("should prevent non-subscriber from decrypting access", async function () {
        // Test that Permission system enforces access control
        // A non-subscriber trying to verify access should return 0 (not subscribed)
        // And cannot use subscriber's Permission (signature mismatch)
    });
});
```

### 9.2 Testnet Deployment

```bash
# Deploy to Arbitrum Sepolia
pnpm hardhat run scripts/deploy.ts --network arb-sepolia

# Verify
pnpm hardhat verify --network arb-sepolia <CONTRACT_ADDRESS> <RELAYER_ADDRESS>
```

### 9.3 Test Coverage Requirements

| Scenario | Test Type | Priority |
|---|---|---|
| Encrypt subscription on `activateSubscription()` | Unit (Mock) | P0 |
| Encrypt revenue with `FHE.add()` | Unit (Mock) | P0 |
| Subscriber can decrypt own status | Unit (Mock) | P0 |
| Creator can decrypt own revenue | Unit (Mock) | P0 |
| Non-subscriber cannot decrypt another's status | Unit (Mock) | P0 |
| Creator cannot read subscriber identity | Unit (Mock) | P0 |
| Relayer signature verification in `OnlyFHERelayer` | Unit | P0 |
| Revenue range proof | Unit (Mock) | P1 |
| Withdrawal resets encrypted revenue to 0 | Unit (Mock) | P1 |
| Full flow on Arbitrum Sepolia | Integration (Testnet) | P1 |

---

## 10. Deployment Script

```typescript
// scripts/deploy.ts
import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with:", deployer.address);

    // 1. Deploy main subscription contract (deployer as temp relayer)
    const Subscription = await ethers.getContractFactory("OnlyFHESubscription");
    const subscription = await Subscription.deploy(deployer.address);
    await subscription.waitForDeployment();
    console.log("OnlyFHESubscription:", await subscription.getAddress());

    // 2. Deploy relayer contract
    const Relayer = await ethers.getContractFactory("OnlyFHERelayer");
    const relayer = await Relayer.deploy(await subscription.getAddress());
    await relayer.waitForDeployment();
    console.log("OnlyFHERelayer:", await relayer.getAddress());

    // 3. Update subscription contract to use real relayer
    await subscription.setRelayer(deployer.address, false);
    await subscription.setRelayer(await relayer.getAddress(), true);
    console.log("Relayer configured");

    // 4. Save addresses for frontend
    const addresses = {
        subscription: await subscription.getAddress(),
        relayer: await relayer.getAddress(),
        network: "arb-sepolia",
        deployedAt: new Date().toISOString()
    };
    console.log("Deployment complete:", addresses);
}

main().catch(console.error);
```

---

## 11. Frontend Integration (cofhejs SDK)

```typescript
// lib/onlyfhe.ts — Client-side FHE operations
import { createFhenixClient } from "@cofhe/sdk";

/**
 * Verify subscriber's own access status
 * Only works for the currently connected wallet
 */
export async function verifyMyAccess(
    contract: ethers.Contract,
    signer: ethers.Signer,
    creatorAddress: string
): Promise<boolean> {
    const client = await createFhenixClient({ provider: signer.provider });

    // Generate a Permission token (signed by user's wallet)
    const permission = await client.generatePermission(signer);

    // Call verifyAccess — Permission proves caller identity to FHE ACL
    const status = await contract.verifyAccess(creatorAddress, permission);
    return status === 1n;
}

/**
 * View creator's own encrypted earnings
 * Only works when called by the creator's wallet
 */
export async function getMyRevenue(
    contract: ethers.Contract,
    signer: ethers.Signer
): Promise<bigint> {
    const client = await createFhenixClient({ provider: signer.provider });
    const permission = await client.generatePermission(signer);

    const revenue = await contract.getRevenue(permission);
    return revenue;
}

/**
 * Sign a subscription authorization (user side, no direct contract call)
 * This signature is sent to the Relayer backend
 */
export async function signSubscriptionAuth(
    signer: ethers.Signer,
    relayerAddress: string,
    creatorAddress: string,
    nonce: bigint,
    deadline: bigint
): Promise<string> {
    const domain = {
        name: "OnlyFHERelayer",
        version: "1",
        chainId: (await signer.provider!.getNetwork()).chainId,
        verifyingContract: relayerAddress,
    };

    const types = {
        Subscribe: [
            { name: "creator", type: "address" },
            { name: "subscriber", type: "address" },
            { name: "nonce", type: "uint256" },
            { name: "deadline", type: "uint256" },
        ]
    };

    const value = {
        creator: creatorAddress,
        subscriber: await signer.getAddress(),
        nonce,
        deadline,
    };

    return signer.signTypedData(domain, types, value);
}
```
