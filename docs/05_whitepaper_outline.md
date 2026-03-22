# OnlyPaca — Whitepaper Outline

> Working Title: *OnlyPaca: Cryptographically Private Creator Subscriptions Using Fully Homomorphic Encryption*
> Version: 0.1 (Outline)
> Authors: OnlyPaca Team
> Date: 2026-03

---

## Abstract

> *OnlyPaca is a decentralized adult content subscription platform that leverages Fully Homomorphic Encryption (FHE) to provide cryptographically guaranteed privacy for both subscribers and creators. Built on Arbitrum Sepolia using Fhenix's CoFHE co-processor, OnlyPaca stores subscription relationships and creator revenue as encrypted on-chain state. Neither the platform operator, the public, nor any third party can determine who subscribes to whom or how much a creator earns. This paper describes the system design, privacy model, economic structure, and security properties of the OnlyPaca protocol.*

---

## 1. Introduction

### 1.1 The Creator Economy Privacy Problem

The adult content creator economy generates over $5 billion annually. Existing platforms — centralized services built on traditional payment infrastructure — share a fundamental architectural flaw: subscription relationships are visible to the platform operator, payment processors, banks, and in blockchain-based implementations, to the entire public. This creates systemic risks for both subscribers (social exposure, targeted harassment) and creators (competitive intelligence, revenue transparency, censorship).

### 1.2 Why Existing Solutions Fail

- **Centralized platforms**: Platform controls all data; subject to censorship, data breaches, regulatory pressure
- **NFT-gated access**: Token ownership is public; who holds what is visible on-chain
- **ZK-proof approaches**: Can prove membership without revealing identity, but cannot compute on hidden state or aggregate revenue without revealing data
- **Mixing/tumbling**: Breaks transaction links but is not purpose-built for subscription relationships; carries regulatory risk

### 1.3 The FHE Opportunity

Fully Homomorphic Encryption enables arbitrary computation on encrypted data without decryption. Applied to a creator subscription platform, FHE allows:

1. Subscription status to be stored encrypted — the contract can compute on it without anyone reading it
2. Revenue to accumulate via encrypted addition — `FHE.add(encryptedTotal, encryptedPayment)` — without any party knowing the running total
3. Access verification — subscribers prove their own status to themselves, with no one else able to read the result

This is the first application of FHE to the creator subscription model.

---

## 2. Background

### 2.1 Fully Homomorphic Encryption

- Definition and properties
- Bootstrapping and the evolution of practical FHE (BFV, CKKS, TFHE)
- The TFHE scheme and why it is suited for boolean/small-integer operations
- Computational overhead and the role of co-processors

### 2.2 Fhenix CoFHE

- Co-processor architecture: EVM handles control flow, CoFHE handles FHE operations off-chain
- Encrypted types: `euint8`, `euint16`, `euint32`, `euint64`, `euint128`, `ebool`, `eaddress`
- Access Control List (ACL): `FHE.allow()` and `FHE.allowThis()` for permission scoping
- Async decrypt model: `FHE.decrypt()` → `FHE.getDecryptResultSafe()`
- Supported networks: Arbitrum Sepolia, Base Sepolia, Ethereum Sepolia

### 2.3 EIP-712: Typed Structured Data Signing

- Off-chain signing to authorize on-chain actions
- Domain separator, struct hash, digest construction
- Role in OnlyPaca's Relayer pattern: subscriber signs authorization without paying gas

### 2.4 The Relayer Pattern

- Why `msg.sender` matters for on-chain privacy
- Meta-transaction patterns (EIP-2771, custom relayer)
- OnlyPaca's approach: trusted relayer with EIP-712 verification

---

## 3. System Design

### 3.1 Architecture Overview

```
User → signs EIP-712 off-chain
     → Relayer Backend verifies & submits
     → OnlyFHERelayer contract verifies signature
     → OnlyFHESubscription stores FHE-encrypted state
     → Fhenix CoFHE computes on ciphertext
```

### 3.2 OnlyFHESubscription Contract

- `CreatorProfile` struct (public metadata: price, count, contentURI)
- `_subscriptions[creator][subscriber]` → `euint8` (0: inactive, 1: active)
- `_creatorRevenue[creator]` → `euint64` (encrypted accumulated wei)
- `activateSubscription()`: FHE write operations and ACL grants
- `requestAccessDecrypt()` + `verifyAccess()`: async decrypt pattern
- `requestRevenueDecrypt()` + `getRevenue()`: creator-only decrypt
- `requestRevenueRangeProof()`: selective disclosure via encrypted comparison
- `withdrawRevenue()`: read decrypted amount, reset to zero, transfer ETH

### 3.3 OnlyFHERelayer Contract

- EIP-712 domain: `OnlyFHERelayer` v1
- `SUBSCRIBE_TYPEHASH`: `Subscribe(address creator, address subscriber, uint256 nonce, uint256 deadline)`
- Replay protection: nonce mapping + `usedSignatures` hash mapping
- Deadline validation: expired + max extension (24h) checks
- `relaySubscription()`: verify → increment nonce → forward to subscription contract

### 3.4 Relayer Backend Service

- Express.js REST API
- Endpoints: `POST /api/subscribe`, `GET /api/subscribe/nonce/:address`, `GET /api/creators`, `GET /api/creators/:address`
- Wallet management: single hot wallet, pre-funded with ETH for subscription payments
- Input validation: zod schema validation on all endpoints
- Rate limiting: 100 requests / 15 minutes per IP

### 3.5 Frontend Application

- Next.js 14 App Router with SSR
- wagmi + RainbowKit for wallet connection and EIP-712 signing
- `useSubscribe` hook: nonce fetch → sign → POST to relayer → poll for confirmation
- Access verification: `requestAccessDecrypt()` → poll `isAccessDecryptReady()` → unlock content
- Creator dashboard: encrypted revenue display, withdrawal flow

---

## 4. Privacy Analysis

### 4.1 Subscription Privacy Guarantees

| Observer | Can see creator exists? | Can see subscriber identity? | Can see subscription relationship? |
|---|---|---|---|
| Public (blockchain) | ✅ (contract is public) | ❌ (not in any event) | ❌ (encrypted ciphertext) |
| Platform operator | ✅ | ❌ (no ACL permission) | ❌ |
| Creator | ✅ (their own profile) | ❌ | ❌ (no ACL permission) |
| Relayer | ✅ | ✅ (submits tx) | ❌ (no ACL permission) |
| Subscriber | ✅ | ✅ (themselves only) | ✅ (their own status only) |

### 4.2 Revenue Privacy Guarantees

| Observer | Can see revenue exists? | Can see exact revenue? | Can see subscriber count? |
|---|---|---|---|
| Public | ✅ (encrypted handle) | ❌ | ✅ (public uint256) |
| Platform operator | ✅ | ❌ | ✅ |
| Creator | ✅ | ✅ (after decrypt) | ✅ |
| Other creators | ✅ | ❌ | ✅ |

### 4.3 Information Leakage Residuals

- **Subscriber count** is intentionally public (social proof value)
- **Subscription events** emit `(creator, newSubscriberCount)` — no subscriber address
- **Withdrawal events** emit `(creator, destination)` — no amount
- **Relayer wallet** knows `(creator, subscriber)` pairs at relay time — trust assumption
- **Timing analysis**: subscription timing is visible on-chain; mitigation requires Stealth Address batching (Wave 2)

### 4.4 Cryptographic Assumptions

- Security of TFHE scheme under standard LWE hardness assumption
- Security of EIP-712 under ECDSA and keccak256 collision resistance
- Security of Arbitrum Sepolia L2 derivation from Ethereum L1

---

## 5. Economic Model

### 5.1 Fee Distribution

```
Subscription Price P
├── Platform Fee = P × 5%   → platformFeeBalance (plaintext, withdrawable by owner)
└── Creator Share = P × 95% → _creatorRevenue[creator] (encrypted euint64)
```

### 5.2 Relayer Economics

- Relayer wallet fronts ETH for subscription payments
- In the current model (MVP): relayer is pre-funded; user sends ETH to relayer off-chain or via direct transfer
- In Wave 2 (Stealth Address model): user sends ETH to a stealth address; relayer detects payment and relays subscription; payment is self-funding

### 5.3 Creator Incentives

- Public subscriber count provides social proof without privacy compromise
- Selective disclosure (`requestRevenueRangeProof`) allows marketing ("I earn over X ETH/month") without revealing exact earnings
- No platform lock-in: creator's subscriber data is on-chain and portable

### 5.4 Platform Sustainability

- 5% fee on all subscription volume
- Configurable (owner-controlled, max 10% cap)
- Gas costs borne by relayer (subsidized at testnet stage; fee model for mainnet)

---

## 6. Security Analysis

### 6.1 Smart Contract Security

- **Reentrancy**: All ETH-moving functions protected by `ReentrancyGuard`
- **Access control**: `onlyOwner` (OpenZeppelin), `onlyRelayer` (whitelist mapping)
- **Input validation**: address zero checks, price > 0, fee ≤ 10%
- **Overflow**: Solidity 0.8.x built-in checked arithmetic
- **Emergency**: `setPaused()` on Relayer, `emergencyWithdraw()` on Subscription

### 6.2 Relayer Security

- EIP-712 signature verification on-chain (not just off-chain)
- Nonce + deadline prevent replay attacks
- `usedSignatures` mapping prevents signature reuse even if nonce is somehow reused
- `onlyOwner` on `relaySubscription()` — only the relayer backend wallet can call it

### 6.3 Known Limitations (Wave 1)

- Relayer knows `(subscriber, creator)` pairs — trust requirement on relayer operator
- User must pay ETH to the relayer (not fully private at the payment layer without Stealth Addresses)
- FHE decrypt latency is async — UX requires polling or websocket

### 6.4 Planned Mitigations (Wave 2+)

- **ERC-5564 Stealth Address payments**: subscriber computes ephemeral address, sends standard ETH transfer; relayer scans chain for stealth payments — relayer learns subscriber address but not the stealth address linkage
- **Multiple relayers**: competitive relayer market reduces single-operator trust
- **Reverse Stealth Addresses for withdrawals**: creator receives payout at an unlinkable address

---

## 7. Comparison with Prior Work

| System | FHE | Subscription | Revenue Privacy | Decentralized |
|---|---|---|---|---|
| OnlyFans | ❌ | ✅ | ❌ | ❌ |
| Zora (creator coins) | ❌ | Partial | ❌ | ✅ |
| Secret Network (SNIP-20) | Partial (TEE) | ❌ | Partial | ✅ |
| Tornado Cash | ❌ | ❌ | N/A | ✅ |
| ERC-5564 alone | ❌ | ❌ | ❌ | ✅ |
| **OnlyPaca** | **✅ TFHE** | **✅** | **✅** | **✅** |

---

## 8. Future Work

### 8.1 Short Term (Wave 2)

- ERC-5564 Stealth Address payment integration
- Subscription expiry using encrypted timestamps (`euint64`)
- Per-content access flags (`euint8` per content item per user)
- Content-level revenue tracking
- Reverse Stealth Address withdrawals

### 8.2 Medium Term

- Multi-relayer architecture (reduce single-operator trust)
- Encrypted subscriber analytics (count per time period — computed on ciphertext)
- Mobile-responsive creator SDK
- IPFS-pinning service integration for content metadata

### 8.3 Long Term (Protocol)

- Cross-chain subscription portability
- Encrypted governance voting (creator community decisions)
- Privacy-preserving recommendation engine (AI inference on encrypted engagement data)
- Mainnet deployment when CoFHE mainnet is available
- Support for non-adult content verticals (art, music, education)

---

## 9. Conclusion

OnlyPaca demonstrates that Fully Homomorphic Encryption is practical for real-world creator economy applications today. By deploying on Arbitrum Sepolia with Fhenix's CoFHE co-processor, we achieve the first system where:

1. Subscription relationships are encrypted on-chain and cannot be read by any party except the subscriber
2. Creator revenue accumulates via FHE arithmetic and cannot be read by any party except the creator
3. Access verification is self-sovereign — only the subscriber can prove their own status
4. The platform operator is cryptographically excluded from reading any private state

Privacy is not a promise. It is a mathematical property of the system.

---

## References

- Gentry, C. (2009). *A Fully Homomorphic Encryption Scheme*. Stanford PhD Thesis.
- Chillotti, I. et al. (2020). *TFHE: Fast Fully Homomorphic Encryption over the Torus*.
- Ethereum Improvement Proposal 712: *Typed structured data hashing and signing*.
- Ethereum Improvement Proposal 5564: *Stealth Addresses*.
- Fhenix Protocol. (2024). *CoFHE: Co-processor for Fully Homomorphic Encryption*. https://www.fhenix.io/
- Fhenix Developer Docs. https://docs.fhenix.zone/
