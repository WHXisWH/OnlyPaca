# OnlyFHE — Product Definition and Requirements

> Version: 0.1 (Hackathon MVP)
> Network: Arbitrum Sepolia (Fhenix CoFHE)
> Last Updated: 2026-03

---

## 1. Product Overview

### 1.1 Background

The adult content creator economy is a multi-billion dollar market dominated by centralized platforms (OnlyFans, Fansly, etc.). These platforms share a fundamental architectural flaw: **everything is visible to everyone by default**.

On traditional blockchains, this problem is even worse. Every transaction, every subscription relationship, every payment amount is permanently recorded on a public ledger. Building a creator economy on-chain — without privacy — is not just impractical, it is harmful to users.

Fhenix CoFHE (Co-processor for Fully Homomorphic Encryption) enables computation on encrypted data without ever decrypting it. This is the cryptographic primitive that makes a truly private on-chain creator platform possible for the first time.

### 1.2 Vision

**OnlyFHE** is a privacy-first adult content platform where:
- Fans can subscribe and pay without anyone knowing who they subscribed to
- Creators can earn revenue without competitors knowing how much they make
- The platform itself cannot read subscription relationships or exact earnings
- All privacy guarantees are enforced by cryptography, not policy

> "Not your keys, not your privacy." — OnlyFHE is built on the principle that privacy should be a property of the system, not a promise from a company.

### 1.3 Value Proposition

| Stakeholder | Value |
|---|---|
| **Fans** | Subscribe without fear of social exposure; no one can link your wallet to your subscriptions |
| **Creators** | Keep revenue data confidential; competitors cannot analyze your pricing or income |
| **Platform** | Even the platform operator cannot read subscription relationships; trust is cryptographic |
| **Ecosystem** | First adult content dApp on Fhenix; demonstrates FHE's real-world applicability |

---

## 2. Problem Statement

### 2.1 Privacy Pain Points

#### For Fans (Subscribers)

**Problem 1: Subscription Relationship Exposure**
On any public blockchain without FHE, a subscription transaction reveals:
- `tx.from` → the subscriber's wallet address
- `tx.to` → the creator's contract address (publicly known)
- `tx.value` → the exact amount paid

Anyone can query the chain and know: "Wallet 0xABC paid creator 0xDEF on [date] for [amount]."

**Problem 2: Platform-Level Exposure**
Even with FHE hiding the creator's identity, the contract address itself is public. Anyone scanning the chain can see that a wallet interacted with the OnlyFHE contract — revealing platform participation.

**Problem 3: Social Graph Construction**
Without privacy, on-chain subscriptions create a permanent, immutable social graph linking fans to creators. This data can be sold, leaked, or used for targeted harassment.

#### For Creators

**Problem 4: Revenue Transparency**
On a public chain, any competitor can see:
- Total revenue earned by a creator
- Exact earnings per time period
- Which content performed best (by correlating payments)
- How many subscribers a creator has

This eliminates competitive advantage and exposes creators to pricing attacks.

**Problem 5: Withdrawal Deanonymization**
Even if on-chain state is encrypted, the act of withdrawing funds reveals income: `contract → creator_wallet: 5 ETH`. Competitors monitor creator wallets and reverse-engineer monthly income.

**Problem 6: Platform Dependency and Data Leverage**
Centralized platforms hold subscriber data and use it as leverage. Creators cannot leave without losing subscriber relationships. On a naive on-chain implementation, the problem persists.

### 2.2 Existing Solutions and Their Gaps

| Solution | Approach | Gap |
|---|---|---|
| OnlyFans (Web2) | Centralized, card payments | Platform controls all data; can freeze accounts; payment processors can censor |
| NFT-gated content | NFT ownership = access | All ownership is public; no subscription privacy |
| Token-gated platforms | Hold token = access | Token holdings are public; who holds what is visible |
| Tornado Cash style mixing | Break transaction links | Regulatory risk; mixing != subscription privacy; not purpose-built |
| ZK-based approaches | Prove membership without revealing identity | Cannot compute on hidden state; no revenue aggregation without revealing data |
| **OnlyFHE (FHE-based)** | Encrypt state + compute on ciphertext | **First solution to provide both subscription privacy AND encrypted analytics simultaneously** |

---

## 3. Product Goals

### 3.1 MVP Goals (Wave 1 — Hackathon Scope)

- [ ] Deploy core FHE subscription contract on Arbitrum Sepolia
- [ ] Implement encrypted subscription state (`euint8` per creator-subscriber pair)
- [ ] Implement encrypted creator revenue accumulation (`euint64`)
- [ ] Implement Stealth Address payment flow (ERC-5564) for platform-level anonymity
- [ ] Implement Relayer layer so `msg.sender` is never the user's real wallet
- [ ] Basic frontend: connect wallet → pay → verify access → view content
- [ ] Creator dashboard: view encrypted total earnings (decrypt on demand)
- [ ] Demo comparing on-chain visibility: OnlyFHE vs naive implementation

### 3.2 Mid-Term Goals (Post-Hackathon, 3 months)

- [ ] Selective disclosure: creator can share revenue range with fans without revealing exact amount
- [ ] Reverse Stealth Address for creator withdrawals
- [ ] Content access control: encrypted per-content access flags
- [ ] Subscriber count: public count (social proof) with private identity list
- [ ] Mobile-responsive UI with wallet abstraction (reduce UX friction)
- [ ] Encrypted analytics dashboard (total revenue, subscriber growth — all computed on ciphertext)

### 3.3 Long-Term Goals (Protocol)

- [ ] Become the reference implementation for private creator economy on FHE chains
- [ ] Support multiple content verticals (not just adult content)
- [ ] Cross-chain subscription portability
- [ ] Creator governance: encrypted voting on platform policy
- [ ] Privacy-preserving content recommendation (AI inference on encrypted engagement data)

---

## 4. Target Users

### 4.1 User Personas

#### Persona A: "The Privacy-Conscious Fan"
- **Profile**: 25–40, crypto-native, has existing wallets with real assets
- **Fear**: Being associated with adult content platforms publicly
- **Pain**: OnlyFans charges to credit card (visible to bank); public chain subscriptions visible to anyone
- **Need**: Subscribe without leaving a traceable on-chain trail
- **Technical comfort**: Can use MetaMask; understands basic crypto concepts

#### Persona B: "The Professional Creator"
- **Profile**: Full-time content creator, earns $5k–$50k/month
- **Fear**: Competitors analyzing income and undercutting pricing
- **Fear 2**: Platform censorship or account freezing
- **Need**: Keep revenue private, have credible ownership of subscriber relationships
- **Technical comfort**: Comfortable with crypto wallets; not a developer

#### Persona C: "The Anonymous Creator"
- **Profile**: Creator who cannot publicly associate their real identity with adult content
- **Fear**: Being deanonymized through on-chain activity
- **Need**: Receive payments without the receiving address being linkable to their public identity
- **Technical comfort**: High; actively manages opsec

### 4.2 Use Cases

| Use Case | User | Privacy Layer Used |
|---|---|---|
| Subscribe to a creator | Fan (A) | Stealth Address + Relayer + FHE encrypted state |
| Verify own access to content | Fan (A) | FHE permit-based decryption (self only) |
| View total earnings | Creator (B) | FHE decrypt with creator's permission |
| Prove earnings > $X to a third party | Creator (B) | FHE range proof (selective disclosure) |
| Receive monthly payout | Creator (C) | Reverse Stealth Address withdrawal |
| Withdraw to hardware wallet | Creator (C) | Stealth Address + no on-chain link |

---

## 5. Core Features

### Feature A: Encrypted Subscription State

**Description**: When a fan subscribes to a creator, the subscription relationship is stored on-chain as an encrypted value. The ciphertext is stored in the contract; neither the platform nor any observer can determine who is subscribed to whom.

**Technical implementation**:
- FHE type: `euint8` (0 = not subscribed, 1 = subscribed)
- Storage: `mapping(address => mapping(address => euint8)) private _subscriptions`
- Access: Only the subscriber can decrypt their own status via `Permission` (CoFHE ACL)

**User experience**: Fan pays → receives no visible confirmation on-chain → frontend calls `verifyAccess()` → decrypts their own status → content unlocks

### Feature B: Encrypted Creator Revenue

**Description**: Each subscription payment is encrypted and added to the creator's running encrypted total. The creator can decrypt their total at any time. Competitors see only ciphertext.

**Technical implementation**:
- FHE type: `euint64` (sufficient for ETH amounts in wei)
- Operation: `FHE.add(currentRevenue, paymentAmount)` — addition performed on ciphertext
- Access: Only the creator (matched address) can decrypt via `onlySender(perm)`

### Feature C: Stealth Address Payment (Platform Anonymity)

**Description**: Fans do not call the OnlyFHE contract directly. Instead, they compute a Stealth Address (ERC-5564) and send a standard ETH transfer. The platform backend detects the payment and triggers the subscription via Relayer.

**Technical implementation**:
- Standard: ERC-5564 (Stealth Address)
- Client-side: User computes `stealthAddress = hash(ephemeralKey × metaAddress)` locally
- On-chain: User sends `tx.to = stealthAddress, value = price, data = ""` — indistinguishable from a regular transfer
- Platform: Scans chain for stealth payments, triggers `activateSubscription()` via Relayer

### Feature D: Relayer Layer

**Description**: All contract interactions are submitted by a platform-operated Relayer, not by the user's real wallet. On-chain, `msg.sender` is always the Relayer address. The Relayer has no power to read encrypted subscription state.

**Technical implementation**:
- User signs a typed message (EIP-712) off-chain authorizing the subscription
- Relayer verifies signature, submits transaction
- Contract verifies signature and processes subscription for the real user address

### Feature E: Public Subscriber Count / Private Identity List

**Description**: Creator's subscriber count is a public `uint256` (enables social proof). The list of who is subscribed is encrypted (protects individual privacy). Creators can display "1,247 subscribers" without revealing a single name.

### Feature F: Creator Dashboard (Selective Disclosure)

**Description**: Creator can choose what to reveal:
- **Level 0**: Full privacy — only they see earnings
- **Level 1**: Revenue range — "I earn between 1–5 ETH/month" (FHE range proof)
- **Level 2**: Full public — opt-in transparency for marketing purposes

---

## 6. User Flow

### 6.1 Fan Subscription Flow

```
1. Fan opens OnlyFHE frontend
2. Fan connects wallet (MetaMask / WalletConnect)
3. Fan browses creator profiles (public: name, content previews, subscriber count)
4. Fan clicks "Subscribe" on a creator
5. Frontend computes a Stealth Address locally (never sent to server)
6. Frontend prompts fan to send ETH to the computed Stealth Address
   → This looks like a normal ETH transfer on-chain
7. Fan signs an authorization message (EIP-712) off-chain
8. Platform Relayer detects the Stealth payment
9. Relayer submits activateSubscription() on fan's behalf
   → msg.sender = Relayer (not fan's wallet)
   → Fan's subscription state written as encrypted euint8(1)
   → Creator's encrypted revenue updated with FHE.add()
10. Frontend polls contract, calls verifyAccess() with fan's Permission
11. FHE decrypts subscription status (only fan can read this)
12. Content unlocks for fan
```

### 6.2 Creator Revenue View Flow

```
1. Creator connects wallet to dashboard
2. Creator clicks "View Earnings"
3. Frontend generates a Permission (signed by creator)
4. Frontend calls getRevenue(permission) on contract
5. FHE decrypts creator's euint64 revenue
   → Only creator's signed Permission can trigger this
6. Dashboard displays decrypted earnings
7. Creator optionally enables "Revenue Range" for public display
   → FHE computes: is revenue in [min, max]? → returns ebool
   → Only boolean result is revealed, not the number
```

### 6.3 Creator Withdrawal Flow

```
1. Creator requests withdrawal
2. Creator provides a Stealth Meta-Address for receiving funds
3. Platform Relayer computes ephemeral Stealth Address for the payout
4. Platform sends funds to that Stealth Address
   → On-chain: Relayer → random-looking address
   → No link between the payout and the creator's public profile
5. Creator uses their private key to claim funds from the Stealth Address
```

---

## 7. Functional Requirements

### Must-Have (Wave 1 / MVP)

| ID | Requirement |
|---|---|
| FR-01 | Contract deployed on Arbitrum Sepolia with CoFHE integration |
| FR-02 | `subscribe()` writes encrypted `euint8(1)` to creator-subscriber mapping |
| FR-03 | `subscribe()` increments encrypted `euint64` creator revenue with `FHE.add()` |
| FR-04 | `verifyAccess()` allows only the subscriber to decrypt their own status |
| FR-05 | `getRevenue()` allows only the creator to decrypt their own earnings |
| FR-06 | Public `subscriberCount` increments on each subscription (plaintext, no privacy needed) |
| FR-07 | Relayer address is whitelisted; only Relayer can call `activateSubscription()` |
| FR-08 | Frontend: wallet connect → creator browse → subscribe flow |
| FR-09 | Frontend: creator dashboard with decrypted earnings display |
| FR-10 | Demo mode: side-by-side comparison of encrypted vs plaintext on-chain state |

### Should-Have (Wave 2)

| ID | Requirement |
|---|---|
| FR-11 | ERC-5564 Stealth Address payment flow fully implemented |
| FR-12 | Reverse Stealth Address for creator withdrawals |
| FR-13 | `proveEarningsRange()` for selective disclosure |
| FR-14 | Content-level access flags (`euint8` per content item) |
| FR-15 | Subscription expiry using encrypted timestamps |

---

## 8. Non-Functional Requirements

### Performance
- FHE operations on CoFHE coprocessor: accept up to 5-second latency for encrypted state updates
- Frontend must show optimistic UI updates while awaiting FHE confirmation
- Stealth address computation must be client-side and complete in < 500ms

### Security
- No plaintext subscription data ever stored on-chain or in platform backend
- Relayer cannot decrypt any encrypted state (no access to user or creator permissions)
- All permission tokens (CoFHE `Permission`) are signed by the user's private key and scoped to specific function calls
- EIP-712 signatures used for all off-chain authorization

### Scalability
- Contract design must support up to 10,000 creator-subscriber pairs per creator in MVP
- Revenue accumulation: `euint64` supports up to ~18.4 ETH worth of wei — use `euint128` for production

### Reliability
- If Relayer fails, user's Stealth payment is not lost; Relayer retries on next scan cycle
- Frontend must gracefully handle CoFHE coprocessor delays with clear status messaging

---

## 9. Constraints

### Technical Constraints
- **FHE gas costs**: FHE operations cost significantly more gas than standard EVM operations. MVP limits FHE operations to: one `FHE.add()` per subscription, one encrypted comparison per access check.
- **Supported networks**: Arbitrum Sepolia only for MVP (Fhenix CoFHE is live on Arbitrum, Base, and Ethereum Sepolia)
- **No mainnet**: CoFHE mainnet support is forthcoming; MVP is testnet-only
- **FHE types**: Use `euint8` for boolean-like flags, `euint64` for amounts. Avoid `euint256` (very expensive)
- **CoFHE ACL**: All encrypted values must call `FHE.allowThis()` and `FHE.allowSender()` (or specific address) immediately after creation

### Business Constraints
- **Content moderation**: Platform must implement age verification and basic content moderation; FHE protects subscriber privacy but does not protect creators who upload illegal content
- **Regulatory**: Stealth Addresses (ERC-5564) are an Ethereum standard proposed by Vitalik Buterin; this is distinct from mixing/tumbling and does not carry Tornado Cash regulatory risk
- **Hackathon scope**: Wave 1 submission must have a working demo on testnet; full Stealth Address flow can be mocked/simulated if needed for time
