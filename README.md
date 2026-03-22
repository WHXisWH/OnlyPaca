# OnlyFHE

Privacy-first creator subscription platform powered by Fhenix CoFHE (Fully Homomorphic Encryption) on Arbitrum Sepolia.

## Overview

OnlyFHE enables creators to monetize content while giving subscribers complete privacy. Subscription relationships and revenue data are encrypted on-chain using FHE — even the platform operators cannot read this data.

### Key Features

- **Hidden Subscriptions**: Subscription relationships stored as encrypted `euint8` values
- **Encrypted Revenue**: Creator earnings accumulated as encrypted `euint64` values
- **Stealth Payments**: ERC-5564 stealth addresses hide platform participation
- **Relayer Layer**: `msg.sender` is always the relayer, not the subscriber's wallet
- **Cryptographic Trust**: Privacy enforced by math, not policy

## Project Structure

```
onlyfhe/
├── contracts/     # Solidity smart contracts (Hardhat + CoFHE)
├── frontend/      # Next.js web application
├── relayer/       # Node.js relay service
└── shared/        # Shared types and constants
```

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment files
cp contracts/.env.example contracts/.env
cp frontend/.env.example frontend/.env
cp relayer/.env.example relayer/.env
```

### Development

```bash
# Compile contracts
pnpm contracts:compile

# Run contract tests (mock FHE)
pnpm contracts:test

# Start frontend dev server
pnpm frontend:dev

# Start relayer dev server
pnpm relayer:dev

# Start both frontend and relayer
pnpm dev
```

### Deployment

```bash
# Deploy contracts to Arbitrum Sepolia
pnpm contracts:deploy

# Build frontend for production
pnpm frontend:build

# Build relayer for production
pnpm relayer:build
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Smart Contracts | Solidity 0.8.25, CoFHE, OpenZeppelin |
| Contract Tooling | Hardhat, cofhe-hardhat-plugin |
| Frontend | Next.js 14, React 18, Tailwind CSS |
| Wallet | wagmi, viem, RainbowKit |
| Backend | Node.js, Express, ethers.js v6 |
| Network | Arbitrum Sepolia (testnet) |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend                                 │
│  (Next.js + RainbowKit + wagmi)                                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
┌─────────────────┐ ┌─────────────┐ ┌─────────────────┐
│  Sign EIP-712   │ │  Read Chain │ │ Verify Access   │
│  (off-chain)    │ │  (public)   │ │ (FHE decrypt)   │
└────────┬────────┘ └─────────────┘ └─────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Relayer Service                             │
│  (Express.js + ethers.js)                                       │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    OnlyFHERelayer.sol                           │
│  - Verify EIP-712 signature                                     │
│  - Forward to subscription contract                             │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                 OnlyFHESubscription.sol                         │
│  - Store encrypted subscription state (euint8)                  │
│  - Accumulate encrypted revenue (euint64)                       │
│  - Permission-based decryption                                  │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Fhenix CoFHE                                  │
│  - FHE operations on Arbitrum Sepolia                           │
│  - Coprocessor for encrypted computation                        │
└─────────────────────────────────────────────────────────────────┘
```

## Privacy Guarantees

| Data | Visibility | Protected By |
|------|------------|--------------|
| Subscription relationships | Subscriber only | FHE (`euint8`) |
| Creator revenue | Creator only | FHE (`euint64`) |
| Payment transactions | Public as normal ETH transfers | Stealth Address |
| Contract interactions | Relayer address only | Relayer pattern |
| Subscriber count | Public | Not encrypted (social proof) |

## License

MIT

## Links

- [Fhenix Protocol](https://www.fhenix.io/)
- [CoFHE Documentation](https://docs.fhenix.zone/)
- [ERC-5564 Stealth Addresses](https://eips.ethereum.org/EIPS/eip-5564)
