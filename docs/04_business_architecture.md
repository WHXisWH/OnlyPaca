# OnlyPaca — Business Architecture

> Version: 1.0
> Last Updated: 2026-03

---

## 1. Market Position

OnlyPaca operates in the **adult creator subscription economy** — a market exceeding $5B annually, dominated by centralized platforms with a fundamental structural flaw: all subscription relationships, payment histories, and revenue data are visible to the platform, payment processors, and potentially the public.

OnlyPaca introduces a new category: **cryptographically private creator subscriptions**, where privacy is not a feature or a policy, but a mathematical property of the system.

---

## 2. Stakeholders

| Stakeholder | Role | Primary Need |
|---|---|---|
| **Fans (Subscribers)** | Pay for access to creator content | Subscribe without social exposure or traceable on-chain history |
| **Creators** | Publish content, earn revenue | Keep subscriber identity and earnings private; no platform censorship |
| **Platform (OnlyPaca)** | Operate infrastructure, collect fees | Sustainable fee revenue; cannot read encrypted data (trust-by-design) |
| **Fhenix Protocol** | FHE infrastructure provider | CoFHE coprocessor usage; ecosystem growth |

---

## 3. Revenue Model

```mermaid
flowchart LR
    Fan["Fan\n(pays subscription price)"]
    RelayerW["Relayer Wallet\n(fronts ETH on-chain)"]
    Contract["OnlyFHESubscription\n(distributes on-chain)"]
    Creator["Creator\n(receives 95%)"]
    Platform["OnlyPaca\n(receives 5%)"]

    Fan -->|"off-chain payment\nor stealth ETH"| RelayerW
    RelayerW -->|"msg.value = price"| Contract
    Contract -->|"creatorAmount = price × 95%\n(encrypted in euint64)"| Creator
    Contract -->|"platformFee = price × 5%\n(plaintext accumulation)"| Platform
```

### Fee Structure

| Item | Rate | Notes |
|---|---|---|
| Platform fee | 5% (500 bps) | Configurable, max 10% hard cap |
| Creator share | 95% | Accumulated as encrypted `euint64` |
| Gas costs | Covered by Relayer wallet | Relayer pre-funded with ETH for testnet |
| Withdrawal | No fee | Creator withdraws 100% of accumulated encrypted revenue |

---

## 4. User Journey

### 4.1 Fan Journey

```mermaid
journey
    title Fan Subscription Journey
    section Discovery
      Browse creators on Explore page: 5: Fan
      View public profile (price, subscriber count): 5: Fan
    section Subscription
      Connect wallet (MetaMask / WalletConnect): 4: Fan
      Sign EIP-712 message (no gas, no on-chain trace): 5: Fan
      Relayer submits transaction: 5: Platform
    section Access
      FHE decrypts subscription status: 4: Fan, Platform
      Content unlocks: 5: Fan
    section Ongoing
      Re-verify access anytime: 5: Fan
      Subscription history remains encrypted forever: 5: Fan
```

### 4.2 Creator Journey

```mermaid
journey
    title Creator Journey
    section Onboarding
      Register creator profile: 4: Creator
      Set subscription price and payout address: 4: Creator
      Upload content to IPFS, set contentURI: 3: Creator
    section Earning
      Subscribers activate (via Relayer): 5: Fan, Platform
      Revenue accumulates encrypted on-chain: 5: Creator
      Public subscriber count grows (social proof): 5: Creator
    section Withdrawal
      Request revenue decryption: 4: Creator
      Wait for CoFHE async result: 3: Creator
      Withdraw ETH to payout address: 5: Creator
```

---

## 5. Competitive Landscape

```mermaid
quadrantChart
    title Privacy vs Decentralization
    x-axis Centralized --> Decentralized
    y-axis Public Data --> Private Data
    quadrant-1 Ideal
    quadrant-2 Private but Centralized
    quadrant-3 Public and Centralized
    quadrant-4 Public but Decentralized
    OnlyFans: [0.05, 0.2]
    Fansly: [0.08, 0.22]
    NFT-Gated Platforms: [0.75, 0.15]
    Token-Gated Access: [0.70, 0.2]
    ZK-Proof Approaches: [0.80, 0.65]
    OnlyPaca: [0.85, 0.95]
```

| Platform | Privacy | Censorship Resistance | On-chain | FHE |
|---|---|---|---|---|
| OnlyFans | ❌ Platform sees all | ❌ Account freezing | ❌ | ❌ |
| Fansly | ❌ Platform sees all | ❌ | ❌ | ❌ |
| NFT-gated | ❌ Public ownership | ✅ | ✅ | ❌ |
| ZK-based | ✅ Partial | ✅ | ✅ | ❌ |
| **OnlyPaca** | **✅ Full FHE** | **✅** | **✅** | **✅** |

---

## 6. Value Proposition by Stakeholder

### Fans
- **No social graph exposure**: wallet-to-creator links are encrypted on-chain forever
- **No payment processor records**: subscription fee routed through Relayer, not credit card
- **Self-sovereign access**: only the fan holds the key to decrypt their own subscription status

### Creators
- **Revenue confidentiality**: competitors cannot analyze earnings or pricing via on-chain data
- **Subscriber count without identity**: public count for social proof, private identity list
- **Platform cannot censor**: no centralized account — the contract is the platform
- **Selective disclosure**: prove earnings are "above X" without revealing the exact amount (FHE range proof)

### Platform
- **Trust-by-design**: the platform operator physically cannot read encrypted state — this is a marketing advantage, not a liability
- **Sustainable fee model**: 5% on every subscription, no payment processor dependency
- **Regulatory differentiation**: subscription privacy via cryptography is distinct from mixing/tumbling

---

## 7. Growth Model

```mermaid
flowchart TD
    A["Hackathon Launch\n(Arbitrum Sepolia testnet)"]
    B["Creator Onboarding\n(early creators register,\nset price & contentURI)"]
    C["Fan Acquisition\n(privacy-conscious crypto users)"]
    D["Network Effects\n(more creators → more fans\nmore fans → more creators)"]
    E["Revenue Scaling\n(5% of growing subscription volume)"]
    F["Feature Expansion\n(Stealth Address payments,\nsubscription expiry,\ncontent-level access flags)"]
    G["Mainnet Launch\n(CoFHE mainnet support)"]

    A --> B --> C --> D --> E
    D --> F --> G
```

### Growth Phases

| Phase | Milestone | Key Metric |
|---|---|---|
| **Wave 1 (Now)** | Testnet deployment, hackathon demo | Contracts live, end-to-end flow working |
| **Wave 2 (3 months)** | Stealth Address payments, creator SDK | Subscriber privacy fully anonymous |
| **Wave 3 (6 months)** | Mainnet launch (CoFHE mainnet) | Real economic activity |
| **Protocol (12 months)** | Multi-vertical (gaming, art, music) | Cross-chain subscription portability |

---

## 8. Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| CoFHE mainnet delay | Medium | High | Testnet-first strategy; FHE is live on Arbitrum Sepolia now |
| Relayer wallet underfunded | Low | High | Monitor balance; refill before depletion; Stealth Addr solves long-term |
| Regulatory (Stealth Address) | Low | Medium | ERC-5564 is an Ethereum standard; distinct from mixing |
| Content moderation | Medium | High | IPFS-based content; creator signs legal terms on registration |
| Smart contract bug | Low | High | Testnet-first; audits before mainnet; emergency pause function |

---

## 9. Platform Metrics (Target — Wave 1)

| Metric | Target |
|---|---|
| Registered creators | 10+ |
| Active subscribers | 50+ |
| Subscription transactions relayed | 100+ |
| Average subscription price | 0.01–0.05 ETH |
| Relayer uptime | >99% |
| FHE decryption latency | <30 seconds |
