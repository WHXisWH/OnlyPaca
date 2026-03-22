# OnlyFHE Development Plan

> A privacy-first creator subscription platform powered by Fhenix CoFHE
> Target Network: Arbitrum Sepolia
> Language: English (all code, comments, and UI)

---

## Phase Overview

| Phase | Name | Priority | Dependencies |
|-------|------|----------|--------------|
| 1 | Project Setup | P0 | None |
| 2 | Smart Contracts | P0 | Phase 1 |
| 3 | Contract Testing | P0 | Phase 2 |
| 4 | Relayer Backend | P0 | Phase 2 |
| 5 | Frontend Core | P0 | Phase 2, 4 |
| 6 | Integration & Polish | P1 | Phase 3, 4, 5 |
| 7 | Testnet Deployment | P1 | Phase 6 |

---

## Phase 1: Project Setup

**Goal**: Initialize monorepo structure with all necessary tooling.

### Tasks

- [ ] 1.1 Create monorepo structure
  ```
  onlyfhe/
  ├── contracts/          # Hardhat + CoFHE
  ├── frontend/           # Next.js + Tailwind
  ├── relayer/            # Node.js backend service
  └── docs/               # Documentation
  ```

- [ ] 1.2 Initialize Hardhat project with CoFHE
  - Clone `cofhe-hardhat-starter`
  - Install `@fhenixprotocol/cofhe-contracts`
  - Install `@openzeppelin/contracts`
  - Configure `hardhat.config.ts` for Arbitrum Sepolia

- [ ] 1.3 Initialize Next.js frontend
  - Create Next.js app with TypeScript
  - Install Tailwind CSS
  - Install `wagmi`, `viem`, `@rainbow-me/rainbowkit`
  - Configure for Arbitrum Sepolia

- [ ] 1.4 Initialize Relayer service
  - Create Node.js/Express project
  - Install `ethers.js` v6
  - Setup basic project structure

- [ ] 1.5 Setup shared configuration
  - Create shared contract addresses config
  - Setup environment variables template

### Deliverables
- Working monorepo with all three packages
- Each package can build independently
- Shared TypeScript types for contract ABIs

---

## Phase 2: Smart Contracts

**Goal**: Implement and compile both FHE contracts.

### Tasks

- [ ] 2.1 Implement `OnlyFHESubscription.sol`
  - CreatorProfile struct and storage
  - Encrypted subscription mapping (`euint8`)
  - Encrypted revenue mapping (`euint64`)
  - `registerCreator()` function
  - `activateSubscription()` with FHE operations
  - `verifyAccess()` with Permission-based decryption
  - `getRevenue()` with Permission-based decryption
  - `withdrawRevenue()` function
  - `proveRevenueInRange()` for selective disclosure
  - Admin functions (setRelayer, setPlatformFee)

- [ ] 2.2 Implement `OnlyFHERelayer.sol`
  - EIP-712 domain and typehash setup
  - Nonce management
  - `relaySubscription()` with signature verification
  - Forward calls to subscription contract

- [ ] 2.3 Create deployment script
  - Deploy subscription contract
  - Deploy relayer contract
  - Configure relayer whitelist
  - Export deployed addresses

- [ ] 2.4 Generate TypeScript ABIs
  - Export contract ABIs for frontend
  - Export contract ABIs for relayer

### Deliverables
- Compiled contracts
- Deployment script
- TypeScript type definitions

---

## Phase 3: Contract Testing

**Goal**: Achieve full test coverage using CoFHE mock mode.

### Tasks

- [ ] 3.1 Setup test environment
  - Configure Hardhat for mock FHE
  - Create test fixtures

- [ ] 3.2 Unit tests for `OnlyFHESubscription`
  - Test creator registration
  - Test subscription activation (FHE state)
  - Test revenue accumulation (FHE addition)
  - Test `verifyAccess()` permission control
  - Test `getRevenue()` permission control
  - Test withdrawal flow
  - Test platform fee calculation
  - Test access control (onlyRelayer, onlyOwner)

- [ ] 3.3 Unit tests for `OnlyFHERelayer`
  - Test EIP-712 signature verification
  - Test nonce management
  - Test deadline expiry
  - Test subscription forwarding

- [ ] 3.4 Integration tests
  - Full subscription flow (user → relayer → contract)
  - Revenue accumulation across multiple subscriptions
  - Creator withdrawal with FHE decrypt

### Deliverables
- Test suite with >90% coverage
- All tests passing in mock mode

---

## Phase 4: Relayer Backend

**Goal**: Build the backend service that relays user subscriptions.

### Tasks

- [ ] 4.1 Core relayer service
  - Express.js server setup
  - Contract interaction layer (ethers.js)
  - Wallet management for relayer EOA

- [ ] 4.2 API endpoints
  - `POST /api/subscribe` - Accept user signature, relay to contract
  - `GET /api/nonce/:address` - Get current nonce for user
  - `GET /api/creators` - List registered creators
  - `GET /api/creator/:address` - Get creator profile

- [ ] 4.3 Signature verification
  - EIP-712 signature validation
  - Deadline and nonce checks

- [ ] 4.4 Transaction management
  - Gas estimation
  - Transaction submission and monitoring
  - Error handling and retry logic

- [ ] 4.5 (Optional) Stealth Address scanner
  - Monitor chain for stealth payments
  - Trigger subscription activation on detection

### Deliverables
- Running relayer service
- API documentation
- Health check endpoint

---

## Phase 5: Frontend Core

**Goal**: Build the user-facing web application.

### Tasks

- [ ] 5.1 Layout and navigation
  - App shell with header/footer
  - Wallet connect button (RainbowKit)
  - Navigation: Home, Explore, Dashboard

- [ ] 5.2 Home / Landing page
  - Hero section explaining privacy benefits
  - How it works section
  - CTA to explore creators

- [ ] 5.3 Creator listing page
  - Grid of creator cards
  - Display: avatar, name, subscriber count, price
  - Link to individual creator page

- [ ] 5.4 Creator profile page (`/creator/[address]`)
  - Creator info and content preview
  - Subscription price display
  - Subscribe button
  - Subscription flow modal:
    1. Sign EIP-712 authorization
    2. Send to relayer
    3. Wait for confirmation
    4. Show success / unlock content

- [ ] 5.5 Subscriber dashboard
  - List of subscribed creators
  - Access verification (`verifyAccess()`)
  - Unlock content based on access status

- [ ] 5.6 Creator dashboard
  - Register as creator form
  - View encrypted revenue (with Permission)
  - Subscriber count display
  - Withdrawal button

- [ ] 5.7 FHE integration
  - CoFHE SDK setup
  - Permission generation for decryption
  - `verifyAccess()` implementation
  - `getRevenue()` implementation

### Deliverables
- Fully functional frontend
- Mobile-responsive design
- All user flows working

---

## Phase 6: Integration & Polish

**Goal**: End-to-end testing and UX improvements.

### Tasks

- [ ] 6.1 End-to-end testing
  - Full subscription flow on local mock
  - Creator registration and revenue viewing
  - Withdrawal flow

- [ ] 6.2 Error handling
  - Transaction failure states
  - Network error handling
  - Loading states and optimistic UI

- [ ] 6.3 UI polish
  - Consistent styling
  - Animations and transitions
  - Toast notifications

- [ ] 6.4 Demo mode
  - Side-by-side comparison: encrypted vs plaintext
  - Visualization of privacy guarantees

### Deliverables
- Production-ready application
- Demo-ready presentation

---

## Phase 7: Testnet Deployment

**Goal**: Deploy to Arbitrum Sepolia and verify functionality.

### Tasks

- [ ] 7.1 Deploy contracts
  - Deploy to Arbitrum Sepolia
  - Verify on block explorer
  - Update frontend config with addresses

- [ ] 7.2 Deploy relayer
  - Deploy to cloud provider (e.g., Railway, Render)
  - Configure environment variables
  - Setup monitoring

- [ ] 7.3 Deploy frontend
  - Deploy to Vercel or similar
  - Configure domain
  - Test all flows on testnet

- [ ] 7.4 Documentation
  - Update README with deployment info
  - Create user guide
  - Record demo video

### Deliverables
- Live testnet deployment
- Public demo URL
- Documentation

---

## Recommended Execution Order

For a hackathon timeline, I recommend this parallel execution strategy:

```
Week 1:
├── Day 1-2: Phase 1 (Setup)
├── Day 2-4: Phase 2 (Contracts) ──────────┐
└── Day 3-5: Phase 4 (Relayer) ────────────┤
                                           │
Week 2:                                    │
├── Day 1-2: Phase 3 (Testing) ←───────────┘
├── Day 1-4: Phase 5 (Frontend)
├── Day 4-5: Phase 6 (Integration)
└── Day 5-6: Phase 7 (Deployment)
```

### Why This Order?

1. **Contracts first** - Everything depends on the contract interface
2. **Relayer in parallel** - Can be developed alongside contracts using the same interface
3. **Frontend after contracts** - Needs ABIs and contract addresses
4. **Testing throughout** - Write tests as you implement features
5. **Integration last** - Combine all pieces when individual components work

---

## Tech Stack Summary

| Layer | Technology |
|-------|------------|
| Smart Contracts | Solidity 0.8.24, CoFHE, OpenZeppelin |
| Contract Tooling | Hardhat, cofhe-hardhat-plugin |
| Backend | Node.js, Express, ethers.js v6 |
| Frontend | Next.js 14, React, TypeScript |
| Styling | Tailwind CSS |
| Wallet | wagmi, viem, RainbowKit |
| FHE Client | @cofhe/sdk (cofhejs) |
| Network | Arbitrum Sepolia |

---

## File Naming Conventions

All files, variables, and comments in English:

```
// Good
const subscriberCount = await contract.getSubscriberCount();

// Bad
const 订阅数 = await contract.getSubscriberCount();
```

UI text should also be in English:

```tsx
// Good
<Button>Subscribe Now</Button>

// Bad
<Button>立即订阅</Button>
```

---

## Questions to Resolve Before Starting

1. **Content storage**: Where will actual creator content be stored? (IPFS, Arweave, centralized CDN?)
2. **Authentication**: How will creators verify identity? (Sign message, OAuth?)
3. **Subscription period**: Is this a one-time payment or recurring? (MVP: one-time is simpler)
4. **Stealth Address**: Full implementation or simulated for MVP?

---

## Next Steps

Ready to begin? Start with:

```bash
# Create project structure
mkdir -p onlyfhe/{contracts,frontend,relayer,docs}
cd onlyfhe

# Initialize contracts package
cd contracts
git clone https://github.com/fhenixprotocol/cofhe-hardhat-starter.git .
pnpm install
```

Let me know when you want to proceed with Phase 1!
