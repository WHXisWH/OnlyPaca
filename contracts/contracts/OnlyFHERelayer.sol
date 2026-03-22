// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title IOnlyFHESubscription
 * @notice Interface for the main subscription contract
 */
interface IOnlyFHESubscription {
    function activateSubscription(
        address creator,
        address subscriber
    ) external payable;

    function creators(
        address creator
    )
        external
        view
        returns (
            bool registered,
            uint256 subscriberCount,
            uint256 subscriptionPrice,
            uint256 subscriptionDuration,
            address payoutAddress,
            string memory contentURI
        );

    function isCreator(address creator) external view returns (bool);
}

/**
 * @title OnlyFHERelayer
 * @author OnlyFHE Team
 * @notice Trusted relayer contract for private subscriptions
 * @dev This contract breaks the on-chain link between subscriber wallet and contract call:
 *      - User signs an EIP-712 message authorizing subscription
 *      - Relayer backend verifies signature and submits transaction
 *      - On-chain, msg.sender is always this contract, not the user
 *      - The relayer CANNOT read any encrypted state (no FHE permissions)
 *
 * Security Model:
 * - Only owner can call relaySubscription (controlled by backend)
 * - EIP-712 signatures prevent replay and ensure user consent
 * - Nonces prevent signature reuse
 * - Deadlines prevent stale signatures
 */
contract OnlyFHERelayer is EIP712, Ownable, ReentrancyGuard {
    using ECDSA for bytes32;

    // ═══════════════════════════════════════════════════════════════════════════
    // CONSTANTS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice EIP-712 typehash for Subscribe message
     * @dev keccak256("Subscribe(address creator,address subscriber,uint256 nonce,uint256 deadline)")
     */
    bytes32 private constant SUBSCRIBE_TYPEHASH =
        keccak256(
            "Subscribe(address creator,address subscriber,uint256 nonce,uint256 deadline)"
        );

    /**
     * @notice Maximum allowed deadline extension from current time
     * @dev Prevents signatures valid for unreasonably long periods (24 hours)
     */
    uint256 public constant MAX_DEADLINE_EXTENSION = 24 hours;

    // ═══════════════════════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Reference to the main subscription contract
     */
    IOnlyFHESubscription public subscriptionContract;

    /**
     * @notice Nonce for each user to prevent signature replay
     * @dev Incremented after each successful subscription
     */
    mapping(address => uint256) public nonces;

    /**
     * @notice Mapping to track used signatures (additional replay protection)
     * @dev signatureHash => used
     */
    mapping(bytes32 => bool) public usedSignatures;

    /**
     * @notice Total number of subscriptions relayed
     */
    uint256 public totalRelayed;

    /**
     * @notice Pause state for emergency
     */
    bool public paused;

    // ═══════════════════════════════════════════════════════════════════════════
    // EVENTS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Emitted when a subscription is successfully relayed
     * @dev Subscriber address intentionally omitted for privacy
     * @param creator The creator who received the subscription
     * @param timestamp Block timestamp of the relay
     * @param nonce The nonce used for this subscription
     */
    event SubscriptionRelayed(
        address indexed creator,
        uint256 timestamp,
        uint256 nonce
    );

    /**
     * @notice Emitted when subscription contract address is updated
     * @param oldContract Previous contract address
     * @param newContract New contract address
     */
    event SubscriptionContractUpdated(
        address indexed oldContract,
        address indexed newContract
    );

    /**
     * @notice Emitted when contract is paused or unpaused
     * @param paused New pause state
     */
    event PauseStateChanged(bool paused);

    /**
     * @notice Emitted when funds are withdrawn from the contract
     * @param amount Amount withdrawn
     * @param recipient Recipient address
     */
    event FundsWithdrawn(uint256 amount, address indexed recipient);

    // ═══════════════════════════════════════════════════════════════════════════
    // ERRORS
    // ═══════════════════════════════════════════════════════════════════════════

    /// @notice Invalid or tampered EIP-712 signature
    error InvalidSignature();

    /// @notice Signature deadline has passed
    error ExpiredDeadline();

    /// @notice Deadline is too far in the future
    error DeadlineTooFar();

    /// @notice Nonce does not match expected value
    error InvalidNonce(uint256 expected, uint256 provided);

    /// @notice Payment amount is insufficient
    error InsufficientFunds(uint256 required, uint256 provided);

    /// @notice Creator is not registered
    error CreatorNotRegistered();

    /// @notice Signature has already been used
    error SignatureAlreadyUsed();

    /// @notice Contract is paused
    error ContractPaused();

    /// @notice Invalid address (zero address)
    error InvalidAddress();

    /// @notice ETH transfer failed
    error TransferFailed();

    // ═══════════════════════════════════════════════════════════════════════════
    // MODIFIERS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Ensures contract is not paused
     */
    modifier whenNotPaused() {
        if (paused) revert ContractPaused();
        _;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CONSTRUCTOR
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Initialize the relayer contract
     * @param _subscriptionContract Address of the OnlyFHESubscription contract
     */
    constructor(
        address _subscriptionContract
    ) EIP712("OnlyFHERelayer", "1") Ownable(msg.sender) {
        if (_subscriptionContract == address(0)) revert InvalidAddress();
        subscriptionContract = IOnlyFHESubscription(_subscriptionContract);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // CORE FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Relay a subscription on behalf of a subscriber
     * @dev This function:
     *      1. Validates the deadline hasn't passed
     *      2. Validates the nonce matches expected value
     *      3. Verifies the EIP-712 signature was signed by the subscriber
     *      4. Marks signature as used (replay protection)
     *      5. Increments the subscriber's nonce
     *      6. Calls subscriptionContract.activateSubscription()
     *
     * The relayer backend is responsible for:
     *      - Collecting the signed message from the user
     *      - Providing sufficient ETH (msg.value >= subscription price)
     *      - Monitoring for stealth address payments (optional)
     *
     * @param creator The creator address to subscribe to
     * @param subscriber The real subscriber's address
     * @param deadline Unix timestamp after which signature is invalid
     * @param nonce Anti-replay nonce (must match nonces[subscriber])
     * @param signature EIP-712 signature from the subscriber
     */
    function relaySubscription(
        address creator,
        address subscriber,
        uint256 deadline,
        uint256 nonce,
        bytes calldata signature
    ) external payable onlyOwner whenNotPaused nonReentrant {
        // ════════════════════════════════════════════════════════════════════
        // VALIDATION
        // ════════════════════════════════════════════════════════════════════

        // Check deadline hasn't passed
        if (block.timestamp > deadline) {
            revert ExpiredDeadline();
        }

        // Check deadline isn't too far in the future (prevents indefinite signatures)
        if (deadline > block.timestamp + MAX_DEADLINE_EXTENSION) {
            revert DeadlineTooFar();
        }

        // Check nonce matches expected value
        uint256 expectedNonce = nonces[subscriber];
        if (nonce != expectedNonce) {
            revert InvalidNonce(expectedNonce, nonce);
        }

        // Check creator is registered
        if (!subscriptionContract.isCreator(creator)) {
            revert CreatorNotRegistered();
        }

        // Get subscription price
        (, , uint256 price, , , ) = subscriptionContract.creators(creator);
        if (msg.value < price) {
            revert InsufficientFunds(price, msg.value);
        }

        // ════════════════════════════════════════════════════════════════════
        // SIGNATURE VERIFICATION
        // ════════════════════════════════════════════════════════════════════

        // Construct EIP-712 struct hash
        bytes32 structHash = keccak256(
            abi.encode(SUBSCRIBE_TYPEHASH, creator, subscriber, nonce, deadline)
        );

        // Get full EIP-712 digest
        bytes32 digest = _hashTypedDataV4(structHash);

        // Check signature hasn't been used before (additional protection)
        bytes32 signatureHash = keccak256(signature);
        if (usedSignatures[signatureHash]) {
            revert SignatureAlreadyUsed();
        }

        // Recover signer address from signature
        address recoveredSigner = digest.recover(signature);

        // Verify signer matches subscriber
        if (recoveredSigner != subscriber) {
            revert InvalidSignature();
        }

        // ════════════════════════════════════════════════════════════════════
        // STATE UPDATES
        // ════════════════════════════════════════════════════════════════════

        // Mark signature as used
        usedSignatures[signatureHash] = true;

        // Increment nonce to prevent replay
        nonces[subscriber] = expectedNonce + 1;

        // Increment total relayed counter
        totalRelayed++;

        // ════════════════════════════════════════════════════════════════════
        // FORWARD TO SUBSCRIPTION CONTRACT
        // ════════════════════════════════════════════════════════════════════

        // Call activateSubscription with the subscription price
        // Any excess ETH remains in this contract (can be withdrawn by owner)
        subscriptionContract.activateSubscription{value: price}(
            creator,
            subscriber
        );

        // Emit event (subscriber omitted for privacy)
        emit SubscriptionRelayed(creator, block.timestamp, nonce);
    }

    /**
     * @notice Get the current nonce for a subscriber
     * @param subscriber Address to check
     * @return Current nonce value
     */
    function getNonce(address subscriber) external view returns (uint256) {
        return nonces[subscriber];
    }

    /**
     * @notice Check if a signature has been used
     * @param signature The signature bytes to check
     * @return True if the signature has been used
     */
    function isSignatureUsed(
        bytes calldata signature
    ) external view returns (bool) {
        return usedSignatures[keccak256(signature)];
    }

    /**
     * @notice Get the EIP-712 domain separator
     * @return The domain separator hash
     */
    function getDomainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    /**
     * @notice Compute the EIP-712 digest for a subscription
     * @dev Useful for frontend to construct the message to sign
     * @param creator Creator address
     * @param subscriber Subscriber address
     * @param nonce Nonce value
     * @param deadline Deadline timestamp
     * @return The EIP-712 digest to sign
     */
    function getSubscriptionDigest(
        address creator,
        address subscriber,
        uint256 nonce,
        uint256 deadline
    ) external view returns (bytes32) {
        bytes32 structHash = keccak256(
            abi.encode(SUBSCRIBE_TYPEHASH, creator, subscriber, nonce, deadline)
        );
        return _hashTypedDataV4(structHash);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ADMIN FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Update the subscription contract address
     * @param newContract New contract address
     */
    function setSubscriptionContract(address newContract) external onlyOwner {
        if (newContract == address(0)) revert InvalidAddress();

        address oldContract = address(subscriptionContract);
        subscriptionContract = IOnlyFHESubscription(newContract);

        emit SubscriptionContractUpdated(oldContract, newContract);
    }

    /**
     * @notice Pause or unpause the contract
     * @param _paused New pause state
     */
    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit PauseStateChanged(_paused);
    }

    /**
     * @notice Withdraw accumulated ETH from the contract
     * @dev ETH can accumulate from excess payments or direct transfers
     * @param amount Amount to withdraw (use address(this).balance for all)
     * @param recipient Recipient address
     */
    function withdrawFunds(
        uint256 amount,
        address recipient
    ) external onlyOwner nonReentrant {
        if (recipient == address(0)) revert InvalidAddress();
        if (amount > address(this).balance) {
            amount = address(this).balance;
        }

        (bool success, ) = recipient.call{value: amount}("");
        if (!success) revert TransferFailed();

        emit FundsWithdrawn(amount, recipient);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // RECEIVE FUNCTION
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * @notice Allows contract to receive ETH
     * @dev Required for relayer backend to fund the contract
     */
    receive() external payable {}
}
