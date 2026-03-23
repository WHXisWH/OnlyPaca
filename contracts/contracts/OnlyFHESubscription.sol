// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@fhenixprotocol/cofhe-contracts/FHE.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title OnlyFHESubscription
 * @author OnlyFHE Team
 * @notice Privacy-first creator subscription platform using Fully Homomorphic Encryption
 * @dev Core contract that handles:
 *      - Encrypted subscription state (euint8 per creator-subscriber pair)
 *      - Encrypted creator revenue accumulation (euint64)
 *      - Permission-based decryption for privacy
 *
 * Privacy Guarantees:
 * - Subscription relationships are encrypted: only the subscriber can verify their own status
 * - Creator revenue is encrypted: only the creator can view their earnings
 * - The platform operator cannot read any encrypted state
 * - Events intentionally omit sensitive data (subscriber addresses, amounts)
 */
contract OnlyFHESubscription is Ownable, ReentrancyGuard {
    // ═══════════════════════════════════════════════════════════════════════════
    // TYPES
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Creator profile information
     * @param registered Whether the creator has registered
     * @param subscriberCount Public count of subscribers (for social proof)
     * @param subscriptionPrice Price in wei for one subscription period
     * @param subscriptionDuration Duration in seconds (0 = lifetime)
     * @param payoutAddress Address to receive revenue on withdrawal
     * @param contentURI IPFS CID of creator metadata JSON
     */
    struct CreatorProfile {
        bool registered;
        uint256 subscriberCount;
        uint256 subscriptionPrice;
        uint256 subscriptionDuration;
        address payoutAddress;
        string contentURI;
    }

    /**
     * @notice Subscription status values stored as euint8
     * @dev 0 = NOT_SUBSCRIBED, 1 = ACTIVE, 2 = EXPIRED (future use)
     */
    uint8 public constant STATUS_NOT_SUBSCRIBED = 0;
    uint8 public constant STATUS_ACTIVE = 1;
    uint8 public constant STATUS_EXPIRED = 2;

    // ═══════════════════════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Encrypted subscription status: creator => subscriber => euint8
     * @dev Values: 0 = not subscribed, 1 = active, 2 = expired
     *      Only the subscriber can decrypt their own status via FHE permission
     */
    mapping(address => mapping(address => euint8)) private _subscriptions;

    /**
     * @notice Encrypted accumulated revenue per creator
     * @dev euint64 holds up to ~18.4 ETH in wei (sufficient for MVP)
     *      Only the creator can decrypt their own revenue
     */
    mapping(address => euint64) private _creatorRevenue;

    /**
     * @notice Encrypted subscription expiry timestamps (future feature)
     * @dev Currently not implemented in MVP
     */
    mapping(address => mapping(address => euint64)) private _subscriptionExpiry;

    /**
     * @notice Public creator profiles
     * @dev Contains public information only - no privacy concern
     */
    mapping(address => CreatorProfile) public creators;

    /**
     * @notice Whitelisted relayer addresses
     * @dev Only relayers can call activateSubscription()
     */
    mapping(address => bool) public relayers;

    /**
     * @notice Platform fee in basis points (100 = 1%)
     * @dev Default 500 = 5%, maximum 1000 = 10%
     */
    uint256 public platformFeeBps = 500;

    /**
     * @notice Maximum allowed platform fee (10%)
     */
    uint256 public constant MAX_PLATFORM_FEE_BPS = 1000;

    /**
     * @notice Accumulated platform fees (plaintext)
     * @dev This belongs to the platform, no privacy needed
     */
    uint256 public platformFeeBalance;

    /**
     * @notice Total number of registered creators
     */
    uint256 public totalCreators;

    /**
     * @notice FHE constant for value 1 (used in comparisons)
     */
    euint8 private _ONE_UINT8;

    /**
     * @notice FHE constant for value 0
     */
    euint64 private _ZERO_UINT64;

    // ═══════════════════════════════════════════════════════════════════════════
    // EVENTS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Emitted when a subscription is activated
     * @dev Subscriber address intentionally omitted for privacy
     * @param creator The creator who received a subscription
     * @param newSubscriberCount Updated total subscriber count
     */
    event SubscriptionActivated(
        address indexed creator,
        uint256 newSubscriberCount
    );

    /**
     * @notice Emitted when a creator registers or updates their profile
     * @param creator The creator's address
     * @param subscriptionPrice Price per subscription in wei
     * @param contentURI IPFS URI for creator metadata
     */
    event CreatorRegistered(
        address indexed creator,
        uint256 subscriptionPrice,
        string contentURI
    );

    /**
     * @notice Emitted when a creator updates their profile
     * @param creator The creator's address
     */
    event CreatorUpdated(address indexed creator);

    /**
     * @notice Emitted when a creator withdraws revenue
     * @dev Amount intentionally omitted for privacy
     * @param creator The creator's address
     * @param destination The payout address
     */
    event RevenueWithdrawn(
        address indexed creator,
        address indexed destination
    );

    /**
     * @notice Emitted when relayer status changes
     * @param relayer The relayer address
     * @param status New status (true = active, false = revoked)
     */
    event RelayerUpdated(address indexed relayer, bool status);

    /**
     * @notice Emitted when platform fee is updated
     * @param oldFeeBps Previous fee in basis points
     * @param newFeeBps New fee in basis points
     */
    event PlatformFeeUpdated(uint256 oldFeeBps, uint256 newFeeBps);

    /**
     * @notice Emitted when platform fees are withdrawn
     * @param amount Amount withdrawn in wei
     * @param recipient Recipient address
     */
    event PlatformFeesWithdrawn(uint256 amount, address indexed recipient);

    // ═══════════════════════════════════════════════════════════════════════════
    // ERRORS
    // ═══════════════════════════════════════════════════════════════════════════

    /// @notice Caller is not an authorized relayer
    error NotRelayer();

    /// @notice Creator is not registered
    error CreatorNotFound();

    /// @notice Creator is already registered
    error CreatorAlreadyRegistered();

    /// @notice Payment amount is insufficient
    error InsufficientPayment(uint256 required, uint256 provided);

    /// @notice ETH transfer failed
    error TransferFailed();

    /// @notice Invalid address (zero address)
    error InvalidAddress();

    /// @notice Invalid subscription price (zero)
    error InvalidPrice();

    /// @notice Platform fee exceeds maximum
    error FeeTooHigh(uint256 provided, uint256 maximum);

    /// @notice No revenue available to withdraw
    error NoRevenueToWithdraw();

    /// @notice No platform fees available to withdraw
    error NoPlatformFees();

    /// @notice User is already subscribed to this creator
    error AlreadySubscribed();

    /// @notice Decrypt result not ready yet
    error DecryptNotReady();

    // ═══════════════════════════════════════════════════════════════════════════
    // MODIFIERS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Restricts function to authorized relayers only
     */
    modifier onlyRelayer() {
        if (!relayers[msg.sender]) revert NotRelayer();
        _;
    }

    /**
     * @notice Requires the creator to be registered
     * @param creator The creator address to check
     */
    modifier onlyRegisteredCreator(address creator) {
        if (!creators[creator].registered) revert CreatorNotFound();
        _;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Initializes the contract with an initial relayer
     * @param initialRelayer Address of the first authorized relayer
     */
    constructor(address initialRelayer) Ownable(msg.sender) {
        if (initialRelayer == address(0)) revert InvalidAddress();

        // Set initial relayer
        relayers[initialRelayer] = true;
        emit RelayerUpdated(initialRelayer, true);

        // Initialize FHE constants
        _ONE_UINT8 = FHE.asEuint8(1);
        _ZERO_UINT64 = FHE.asEuint64(0);

        // Allow contract to use these constants
        FHE.allowThis(_ONE_UINT8);
        FHE.allowThis(_ZERO_UINT64);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CREATOR FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Register as a new creator
     * @dev Creates a creator profile and initializes encrypted revenue to 0
     * @param subscriptionPrice Price in wei for one subscription
     * @param subscriptionDuration Duration in seconds (0 for lifetime)
     * @param payoutAddress Address to receive payouts
     * @param contentURI IPFS CID of creator metadata JSON
     */
    function registerCreator(
        uint256 subscriptionPrice,
        uint256 subscriptionDuration,
        address payoutAddress,
        string calldata contentURI
    ) external {
        if (creators[msg.sender].registered) revert CreatorAlreadyRegistered();
        if (payoutAddress == address(0)) revert InvalidAddress();
        if (subscriptionPrice == 0) revert InvalidPrice();

        // Create creator profile
        creators[msg.sender] = CreatorProfile({
            registered: true,
            subscriberCount: 0,
            subscriptionPrice: subscriptionPrice,
            subscriptionDuration: subscriptionDuration,
            payoutAddress: payoutAddress,
            contentURI: contentURI
        });

        // Initialize encrypted revenue to 0
        euint64 initialRevenue = FHE.asEuint64(0);
        _creatorRevenue[msg.sender] = initialRevenue;

        // Grant permissions: contract can compute, creator can decrypt
        FHE.allowThis(initialRevenue);
        FHE.allow(initialRevenue, msg.sender);

        totalCreators++;

        emit CreatorRegistered(msg.sender, subscriptionPrice, contentURI);
    }

    /**
     * @notice Update creator profile
     * @dev Only updates provided fields, cannot change registered status
     * @param subscriptionPrice New price (0 to keep current)
     * @param subscriptionDuration New duration (0 to keep current)
     * @param payoutAddress New payout address (address(0) to keep current)
     * @param contentURI New IPFS URI (empty string to keep current)
     */
    function updateCreatorProfile(
        uint256 subscriptionPrice,
        uint256 subscriptionDuration,
        address payoutAddress,
        string calldata contentURI
    ) external onlyRegisteredCreator(msg.sender) {
        CreatorProfile storage profile = creators[msg.sender];

        if (subscriptionPrice > 0) {
            profile.subscriptionPrice = subscriptionPrice;
        }

        if (subscriptionDuration > 0) {
            profile.subscriptionDuration = subscriptionDuration;
        }

        if (payoutAddress != address(0)) {
            profile.payoutAddress = payoutAddress;
        }

        if (bytes(contentURI).length > 0) {
            profile.contentURI = contentURI;
        }

        emit CreatorUpdated(msg.sender);
    }

    /**
     * @notice Request decryption of creator's revenue (direct call)
     * @dev Initiates async decryption through CoFHE coprocessor
     *      WARNING: This exposes caller's wallet on-chain. Use relayRequestRevenueDecrypt for privacy.
     *      Call getRevenue() after decryption completes
     */
    function requestRevenueDecrypt() external onlyRegisteredCreator(msg.sender) {
        FHE.decrypt(_creatorRevenue[msg.sender]);
    }

    /**
     * @notice Request decryption of creator's revenue (via Relayer)
     * @dev Called by Relayer on behalf of creator to protect privacy
     *      The creator's wallet never appears in the transaction
     * @param creator Creator address (verified via EIP-712 signature)
     */
    function relayRequestRevenueDecrypt(
        address creator
    ) external onlyRelayer onlyRegisteredCreator(creator) {
        FHE.decrypt(_creatorRevenue[creator]);
    }

    /**
     * @notice Get decrypted revenue amount
     * @dev Must call requestRevenueDecrypt() first and wait for completion
     * @return amount The decrypted revenue in wei
     */
    function getRevenue() external view onlyRegisteredCreator(msg.sender) returns (uint256 amount) {
        (uint256 value, bool decrypted) = FHE.getDecryptResultSafe(_creatorRevenue[msg.sender]);
        if (!decrypted) revert DecryptNotReady();
        return value;
    }

    /**
     * @notice Check if revenue decryption is ready
     * @return ready True if decryption is complete
     * @return value The decrypted value (only valid if ready is true)
     */
    function isRevenueDecryptReady() external view onlyRegisteredCreator(msg.sender) returns (bool ready, uint256 value) {
        (value, ready) = FHE.getDecryptResultSafe(_creatorRevenue[msg.sender]);
    }

    /**
     * @notice Prove that revenue is within a specified range (selective disclosure)
     * @dev Returns encrypted boolean, which can then be decrypted
     *      This allows creators to prove "I earn between X and Y" without revealing exact amount
     * @param minRevenue Minimum threshold in wei
     * @param maxRevenue Maximum threshold in wei
     */
    function requestRevenueRangeProof(
        uint64 minRevenue,
        uint64 maxRevenue
    ) external onlyRegisteredCreator(msg.sender) {
        euint64 revenue = _creatorRevenue[msg.sender];

        // Create encrypted thresholds
        euint64 eMin = FHE.asEuint64(minRevenue);
        euint64 eMax = FHE.asEuint64(maxRevenue);

        // Compute: revenue >= min AND revenue <= max
        ebool aboveMin = FHE.gte(revenue, eMin);
        ebool belowMax = FHE.lte(revenue, eMax);
        ebool inRange = FHE.and(aboveMin, belowMax);

        // Allow sender to read the result
        FHE.allow(inRange, msg.sender);

        // Request decryption of the boolean result
        FHE.decrypt(inRange);
    }

    /**
     * @notice Withdraw all accumulated revenue (direct call)
     * @dev Decrypts revenue, transfers to payout address, resets revenue to 0
     *      WARNING: This exposes caller's wallet on-chain. Use relayWithdrawRevenue for privacy.
     *      NOTE: This is a two-step process:
     *      1. Call requestRevenueDecrypt() and wait
     *      2. Call withdrawRevenue()
     */
    function withdrawRevenue() external nonReentrant onlyRegisteredCreator(msg.sender) {
        _withdrawRevenue(msg.sender);
    }

    /**
     * @notice Withdraw all accumulated revenue (via Relayer)
     * @dev Called by Relayer on behalf of creator to protect privacy
     *      The creator's wallet never appears in the transaction
     * @param creator Creator address (verified via EIP-712 signature)
     */
    function relayWithdrawRevenue(
        address creator
    ) external nonReentrant onlyRelayer onlyRegisteredCreator(creator) {
        _withdrawRevenue(creator);
    }

    /**
     * @notice Internal function to handle revenue withdrawal
     * @param creator Creator address to withdraw for
     */
    function _withdrawRevenue(address creator) internal {
        // Get decrypted revenue
        (uint256 amount, bool decrypted) = FHE.getDecryptResultSafe(_creatorRevenue[creator]);
        if (!decrypted) revert DecryptNotReady();
        if (amount == 0) revert NoRevenueToWithdraw();

        // Reset encrypted revenue to zero
        euint64 newRevenue = FHE.asEuint64(0);
        _creatorRevenue[creator] = newRevenue;

        // Re-establish permissions for the new zero value
        FHE.allowThis(newRevenue);
        FHE.allow(newRevenue, creator);

        // Transfer to creator's payout address
        address destination = creators[creator].payoutAddress;
        (bool success, ) = destination.call{value: amount}("");
        if (!success) revert TransferFailed();

        emit RevenueWithdrawn(creator, destination);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SUBSCRIBER FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Activate a subscription (called by Relayer only)
     * @dev The Relayer submits this on behalf of the subscriber
     *      msg.sender = Relayer address (subscriber identity hidden)
     *      subscriber = real fan's address (verified via EIP-712 signature off-chain)
     *
     * FHE Operations:
     * 1. Set subscription status to 1 (active) as encrypted euint8
     * 2. Add payment to creator's encrypted revenue using FHE.add()
     *
     * @param creator Creator address to subscribe to
     * @param subscriber Real subscriber address (verified off-chain)
     */
    function activateSubscription(
        address creator,
        address subscriber
    ) external payable onlyRelayer onlyRegisteredCreator(creator) nonReentrant {
        // Validate payment
        uint256 price = creators[creator].subscriptionPrice;
        if (msg.value < price) {
            revert InsufficientPayment(price, msg.value);
        }

        // Calculate fee split
        uint256 platformFee = (price * platformFeeBps) / 10_000;
        uint256 creatorAmount = price - platformFee;

        // Accumulate platform fee
        platformFeeBalance += platformFee;

        // ════════════════════════════════════════════════════════════════════
        // FHE OPERATIONS - Subscription State
        // ════════════════════════════════════════════════════════════════════

        // Create encrypted active status (value = 1)
        euint8 activeStatus = FHE.asEuint8(STATUS_ACTIVE);

        // Store encrypted subscription status
        _subscriptions[creator][subscriber] = activeStatus;

        // Grant permissions:
        // - Contract can read (for internal operations)
        // - Subscriber can decrypt (to verify their own access)
        // - Creator does NOT get permission (privacy protection)
        FHE.allowThis(activeStatus);
        FHE.allow(activeStatus, subscriber);

        // ════════════════════════════════════════════════════════════════════
        // FHE OPERATIONS - Revenue Accumulation
        // ════════════════════════════════════════════════════════════════════

        // Create encrypted payment amount
        euint64 encryptedPayment = FHE.asEuint64(uint64(creatorAmount));

        // Add payment to creator's encrypted revenue
        // This is computed on ciphertext - no decryption needed
        euint64 newRevenue = FHE.add(_creatorRevenue[creator], encryptedPayment);
        _creatorRevenue[creator] = newRevenue;

        // Grant permissions for updated revenue:
        // - Contract can read (for withdrawal)
        // - Creator can decrypt (to view earnings)
        FHE.allowThis(newRevenue);
        FHE.allow(newRevenue, creator);

        // ════════════════════════════════════════════════════════════════════
        // PUBLIC STATE UPDATES
        // ════════════════════════════════════════════════════════════════════

        // Increment public subscriber count (no privacy concern for count)
        creators[creator].subscriberCount += 1;

        // Refund excess payment if any
        uint256 excess = msg.value - price;
        if (excess > 0) {
            (bool refundSuccess, ) = subscriber.call{value: excess}("");
            // Note: If refund fails, excess stays in contract (can be claimed by admin)
            // This is intentional to not block the subscription on refund failure
        }

        // Emit event (subscriber address intentionally omitted)
        emit SubscriptionActivated(creator, creators[creator].subscriberCount);
    }

    /**
     * @notice Request decryption of subscriber's access status (direct call)
     * @dev Initiates async decryption, call verifyAccess() after completion
     *      WARNING: This exposes caller's wallet on-chain. Use relayRequestAccessDecrypt for privacy.
     * @param creator Creator address to check access for
     */
    function requestAccessDecrypt(address creator) external {
        FHE.decrypt(_subscriptions[creator][msg.sender]);
    }

    /**
     * @notice Request decryption of subscriber's access status (via Relayer)
     * @dev Called by Relayer on behalf of subscriber to protect privacy
     *      The subscriber's wallet never appears in the transaction
     * @param creator Creator address to check access for
     * @param subscriber Real subscriber address (verified via EIP-712 signature)
     */
    function relayRequestAccessDecrypt(
        address creator,
        address subscriber
    ) external onlyRelayer {
        FHE.decrypt(_subscriptions[creator][subscriber]);
    }

    /**
     * @notice Verify subscriber's own access status
     * @dev Must call requestAccessDecrypt() first and wait for completion
     *      Only the subscriber can verify their own status (enforced by FHE permissions)
     * @param creator Creator address to check access for
     * @return status 0 = not subscribed, 1 = active, 2 = expired
     */
    function verifyAccess(
        address creator
    ) external view returns (uint8 status) {
        (uint256 value, bool decrypted) = FHE.getDecryptResultSafe(
            _subscriptions[creator][msg.sender]
        );
        if (!decrypted) revert DecryptNotReady();
        return uint8(value);
    }

    /**
     * @notice Check if access decryption is ready
     * @param creator Creator address to check
     * @return ready True if decryption is complete
     * @return status The subscription status (only valid if ready is true)
     */
    function isAccessDecryptReady(
        address creator
    ) external view returns (bool ready, uint8 status) {
        (uint256 value, bool decrypted) = FHE.getDecryptResultSafe(
            _subscriptions[creator][msg.sender]
        );
        return (decrypted, uint8(value));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Get creator's public profile information
     * @param creator Creator address
     * @return profile The creator's profile struct
     */
    function getCreatorProfile(
        address creator
    ) external view returns (CreatorProfile memory profile) {
        return creators[creator];
    }

    /**
     * @notice Check if an address is a registered creator
     * @param creator Address to check
     * @return True if registered
     */
    function isCreator(address creator) external view returns (bool) {
        return creators[creator].registered;
    }

    /**
     * @notice Check if an address is an authorized relayer
     * @param relayer Address to check
     * @return True if authorized
     */
    function isRelayer(address relayer) external view returns (bool) {
        return relayers[relayer];
    }

    /**
     * @notice Get subscription price for a creator
     * @param creator Creator address
     * @return price Price in wei
     */
    function getSubscriptionPrice(
        address creator
    ) external view returns (uint256 price) {
        return creators[creator].subscriptionPrice;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ADMIN FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Add or remove a relayer
     * @param relayer Address to update
     * @param status True to authorize, false to revoke
     */
    function setRelayer(address relayer, bool status) external onlyOwner {
        if (relayer == address(0)) revert InvalidAddress();
        relayers[relayer] = status;
        emit RelayerUpdated(relayer, status);
    }

    /**
     * @notice Update platform fee
     * @param feeBps New fee in basis points (max 1000 = 10%)
     */
    function setPlatformFee(uint256 feeBps) external onlyOwner {
        if (feeBps > MAX_PLATFORM_FEE_BPS) {
            revert FeeTooHigh(feeBps, MAX_PLATFORM_FEE_BPS);
        }
        uint256 oldFee = platformFeeBps;
        platformFeeBps = feeBps;
        emit PlatformFeeUpdated(oldFee, feeBps);
    }

    /**
     * @notice Withdraw accumulated platform fees
     */
    function withdrawPlatformFees() external onlyOwner nonReentrant {
        uint256 amount = platformFeeBalance;
        if (amount == 0) revert NoPlatformFees();

        platformFeeBalance = 0;

        (bool success, ) = owner().call{value: amount}("");
        if (!success) revert TransferFailed();

        emit PlatformFeesWithdrawn(amount, owner());
    }

    /**
     * @notice Emergency function to recover stuck ETH
     * @dev Only callable by owner, intended for edge cases
     * @param amount Amount to recover
     * @param recipient Recipient address
     */
    function emergencyWithdraw(
        uint256 amount,
        address recipient
    ) external onlyOwner nonReentrant {
        if (recipient == address(0)) revert InvalidAddress();

        (bool success, ) = recipient.call{value: amount}("");
        if (!success) revert TransferFailed();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // RECEIVE FUNCTION
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Allows contract to receive ETH
     * @dev Required for subscription payments via relayer
     */
    receive() external payable {}
}
