# OnlyPaca — Technical Architecture

> Version: 1.0
> Network: Arbitrum Sepolia
> FHE Layer: Fhenix CoFHE
> Last Updated: 2026-03

---

## 1. System Overview

OnlyPaca is a privacy-first creator subscription platform built as a monorepo with three independently deployable layers: smart contracts (Arbitrum Sepolia), a relayer backend (Node.js), and a frontend application (Next.js). All three layers communicate through well-defined interfaces, and the FHE coprocessor is an external service provided by Fhenix Protocol.

---

## 2. Monorepo Structure

```
onlypaca/
├── contracts/          # Hardhat + CoFHE — Solidity 0.8.25
├── frontend/           # Next.js 14 + wagmi + RainbowKit
├── relayer/            # Node.js + Express + ethers.js v6
├── shared/             # Shared ABIs, types, constants
└── docs/               # Project documentation
```

---

## 3. Layer Architecture

### 3.1 Smart Contract Layer

| Contract | Address (Arb Sepolia) | Role |
|---|---|---|
| `OnlyFHESubscription` | `0x2451c1c2D71eBec5f63e935670c4bb0Ce19381f5` | Core FHE logic: encrypted state, revenue accumulation, access control |
| `OnlyFHERelayer` | `0xbd546CD2fc7A9F614c51fcE7AfE60464D39f9cC0` | EIP-712 signature verification, forwards calls on behalf of subscribers |

Both contracts are deployed on **Arbitrum Sepolia (chainId: 421614)** and integrated with the **Fhenix CoFHE coprocessor** which processes FHE operations off-chain and writes encrypted results back on-chain.

### 3.2 FHE Data Layer

| Variable | FHE Type | Who Can Decrypt |
|---|---|---|
| `_subscriptions[creator][subscriber]` | `euint8` | Subscriber only (`FHE.allow(value, subscriber)`) |
| `_creatorRevenue[creator]` | `euint64` | Creator only (`FHE.allow(value, creator)`) |

Decryption is **asynchronous**: the contract calls `FHE.decrypt()` to request decryption from the CoFHE coprocessor, and the result is read back via `FHE.getDecryptResultSafe()`.

### 3.3 Relayer Backend

- **Runtime**: Node.js 20, TypeScript, compiled to CommonJS
- **Framework**: Express.js with helmet, cors, morgan, express-rate-limit
- **Chain interaction**: ethers.js v6, JsonRpcProvider
- **Deployment**: Render (Web Service, free tier for testnet)

### 3.4 Frontend

- **Framework**: Next.js 14 (App Router, SSR enabled)
- **Wallet**: wagmi v2 + RainbowKit + WalletConnect
- **Chain interaction**: viem (reads), wagmi hooks (writes/signing)
- **Deployment**: Vercel

---

## 4. Full System Flow

```mermaid
sequenceDiagram
    actor Fan
    participant Frontend as Frontend (Vercel)
    participant Relayer as Relayer Backend (Render)
    participant RelayerContract as OnlyFHERelayer (Arb Sepolia)
    participant SubscriptionContract as OnlyFHESubscription (Arb Sepolia)
    participant CoFHE as Fhenix CoFHE Coprocessor

    Fan->>Frontend: Connect wallet (RainbowKit)
    Fan->>Frontend: Click Subscribe on creator

    Frontend->>Relayer: GET /api/subscribe/nonce/:address
    Relayer->>RelayerContract: nonces(subscriber)
    RelayerContract-->>Relayer: nonce value
    Relayer-->>Frontend: { nonce }

    Frontend->>Fan: Prompt EIP-712 signature (no gas, off-chain)
    Fan-->>Frontend: signature

    Frontend->>Relayer: POST /api/subscribe { creator, subscriber, deadline, nonce, signature }
    Relayer->>Relayer: Validate signature format (zod)
    Relayer->>RelayerContract: relaySubscription(creator, subscriber, deadline, nonce, sig) + value=price
    RelayerContract->>RelayerContract: Verify EIP-712 signature
    RelayerContract->>RelayerContract: Verify deadline & nonce
    RelayerContract->>SubscriptionContract: activateSubscription(creator, subscriber) + value=price

    SubscriptionContract->>CoFHE: FHE.asEuint8(1) — encrypt subscription status
    SubscriptionContract->>CoFHE: FHE.add(revenue, payment) — add to encrypted revenue
    CoFHE-->>SubscriptionContract: Encrypted handles written to state
    SubscriptionContract->>SubscriptionContract: FHE.allowThis() + FHE.allow(value, subscriber/creator)
    SubscriptionContract->>SubscriptionContract: subscriberCount++

    Relayer-->>Frontend: { transactionHash }
    Frontend-->>Fan: Show success + content unlocked
```

---

## 5. Access Verification Flow

```mermaid
sequenceDiagram
    actor Fan
    participant Frontend as Frontend
    participant SubscriptionContract as OnlyFHESubscription
    participant CoFHE as Fhenix CoFHE Coprocessor

    Fan->>Frontend: Visit creator page (already subscribed)
    Frontend->>SubscriptionContract: requestAccessDecrypt(creator) — tx from Fan wallet
    SubscriptionContract->>CoFHE: FHE.decrypt(_subscriptions[creator][fan])
    CoFHE-->>SubscriptionContract: Write decrypted result to TaskManager
    Note over CoFHE,SubscriptionContract: Async — takes ~5-30 seconds

    Frontend->>SubscriptionContract: isAccessDecryptReady(creator) — poll
    SubscriptionContract-->>Frontend: { ready: true, status: 1 }
    Frontend-->>Fan: Content unlocked ✓
```

---

## 6. Creator Revenue Flow

```mermaid
sequenceDiagram
    actor Creator
    participant Frontend as Frontend
    participant SubscriptionContract as OnlyFHESubscription
    participant CoFHE as Fhenix CoFHE Coprocessor

    Creator->>Frontend: Click "View Earnings"
    Frontend->>SubscriptionContract: requestRevenueDecrypt() — tx from Creator wallet
    SubscriptionContract->>CoFHE: FHE.decrypt(_creatorRevenue[creator])
    CoFHE-->>SubscriptionContract: Write decrypted revenue to TaskManager

    Frontend->>SubscriptionContract: isRevenueDecryptReady() — poll
    SubscriptionContract-->>Frontend: { ready: true, value: 9500000000000000 }
    Frontend-->>Creator: Display "0.0095 ETH earned"

    Creator->>Frontend: Click "Withdraw"
    Frontend->>SubscriptionContract: withdrawRevenue() — tx from Creator wallet
    SubscriptionContract->>SubscriptionContract: Read decrypted value, reset encrypted revenue to 0
    SubscriptionContract->>Creator: Transfer ETH to payoutAddress
```

---

## 7. Deployment Architecture

```mermaid
graph TB
    subgraph User["User Device"]
        Browser["Browser / MetaMask"]
    end

    subgraph Vercel["Vercel (Frontend)"]
        NextApp["Next.js App\nnext build → static + SSR"]
    end

    subgraph Render["Render (Backend)"]
        RelayerAPI["Relayer API\nNode.js Express\nPort 10000"]
    end

    subgraph ArbitrumSepolia["Arbitrum Sepolia (L2)"]
        RelayerC["OnlyFHERelayer\n0xbd546..."]
        SubscriptionC["OnlyFHESubscription\n0x2451..."]
    end

    subgraph Fhenix["Fhenix Infrastructure"]
        CoProcessor["CoFHE Coprocessor\nFHE operations off-chain"]
        TaskManager["TaskManager Contract\nDecrypt result registry"]
    end

    Browser -->|"HTTPS"| NextApp
    Browser -->|"WalletConnect / MetaMask"| ArbitrumSepolia
    NextApp -->|"REST API"| RelayerAPI
    RelayerAPI -->|"ethers.js RPC"| RelayerC
    RelayerC -->|"internal call"| SubscriptionC
    SubscriptionC <-->|"FHE opcodes"| CoProcessor
    CoProcessor -->|"write result"| TaskManager
    SubscriptionC -->|"read result"| TaskManager
```

---

## 8. API Reference (Relayer)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Liveness check |
| `POST` | `/api/subscribe` | Relay a subscription (body: creator, subscriber, deadline, nonce, signature) |
| `GET` | `/api/subscribe/nonce/:address` | Get current EIP-712 nonce for a subscriber |
| `GET` | `/api/creators` | List all registered creators (scans on-chain events) |
| `GET` | `/api/creators/:address` | Get specific creator profile |

---

## 9. Security Model

| Threat | Mitigation |
|---|---|
| Subscriber identity exposure | Relayer is always `msg.sender`; user wallet never touches subscription contract |
| Signature replay | EIP-712 nonces + deadline + `usedSignatures` mapping |
| Creator revenue exposure | `euint64` encrypted on-chain; only creator can trigger decryption |
| Relayer unauthorized call | `onlyOwner` modifier on `relaySubscription()` |
| Reentrancy | `ReentrancyGuard` on all ETH-moving functions |
| Excessive platform fee | `MAX_PLATFORM_FEE_BPS = 1000` (10%) hard cap |
| Contract emergency | `emergencyWithdraw()` owner-only; relayer `setPaused()` |

---

## 10. Tech Stack Summary

| Layer | Technology |
|---|---|
| Smart Contracts | Solidity 0.8.25, `@fhenixprotocol/cofhe-contracts` v0.0.13, OpenZeppelin v5 |
| Contract Tooling | Hardhat 2.22, `cofhe-hardhat-plugin` v0.3.1, `cofhejs` v0.3.1 |
| Relayer Backend | Node.js 20, Express 4, ethers.js 6, TypeScript 5, zod |
| Frontend | Next.js 14, React, TypeScript, Tailwind CSS 3 |
| Wallet & Chain | wagmi v2, viem, RainbowKit, WalletConnect |
| Network | Arbitrum Sepolia (chainId: 421614) |
| FHE | Fhenix CoFHE (co-processor model) |
| Deployment | Vercel (frontend), Render (relayer) |
