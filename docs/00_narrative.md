# OnlyPaca — Problem Narrative & Product Thesis

> *"things that probably shouldn't be on-chain… on-chain anyway"*

---

## 1. Why creator economies belong on-chain

OnlyFans and its competitors prove there is massive, sustained demand for a direct creator-to-fan economic relationship. But the current infrastructure has a fundamental flaw: **it is built on trust in centralized intermediaries**, and that trust has repeatedly been broken.

### What Web2 platforms get wrong

**Platform censorship is arbitrary and irreversible.**
In December 2021, OnlyFans reversed a decision to ban adult content only after public pressure — but the damage was done. Creators lost income overnight. The decision was made by payment processors (Visa, Mastercard), not the platform, and not the creators. The creator had zero recourse.

**The platform holds all the leverage.**
When a creator negotiates fee splits or pricing, the platform knows exactly how much revenue that creator generates. There is no information asymmetry — it all flows one way. Creators negotiate blind; platforms negotiate with full data.

**Your subscriber list is not yours.**
A central database of who subscribes to what is an asset the platform controls. It can be sold, subpoenaed, leaked in a data breach, or used internally to optimize the platform's own competing products.

**What blockchain solves here:**
- No single entity controls the subscription relationship
- No payment processor can unilaterally censor a creator
- Creator owns their economic relationship with fans, verifiably and permanently
- Censorship resistance is a cryptographic property, not a policy promise

This is why creator economies belong on-chain. **The ownership problem is solved.**

---

## 2. Why naive on-chain is worse than Web2

Moving to a public blockchain solves censorship. But it creates a privacy catastrophe that makes things measurably worse for fans and creators alike.

### The public ledger problem

A standard EVM transaction revealing a subscription looks like this:

```
tx.from:   0xFanWallet
tx.to:     CreatorSubscriptionContract
method:    subscribe(creatorAddress)
value:     0.01 ETH
```

This is **permanently, immutably public**. Anyone can:

1. Write a script that queries all `subscribe()` calls to the contract
2. Build a complete social graph: which wallets subscribe to which creators
3. Correlate wallets with real identities through CEX withdrawals, ENS names, or other on-chain activity
4. Monitor creator earnings in real time by watching incoming transfers

**For fans:** The social exposure risk is higher than with a credit card. A credit card charge can be disputed and records are not permanently public. An on-chain subscription is permanent, globally visible, and machine-readable forever.

**For creators:** Their total revenue, subscriber count trends, and withdrawal amounts are all public. A competitor can watch a creator find a pricing sweet spot and undercut them within hours. A creator's withdrawal address becomes a surveillance target.

### The comparison

| Property | Web2 (OnlyFans) | Naked On-Chain | OnlyPaca (FHE) |
|---|---|---|---|
| Subscriber identity | Platform sees all | **Fully public** | Encrypted — nobody knows |
| Subscription relationship | Database record | **On-chain forever** | FHE ciphertext only |
| Creator earnings | Platform sees all | **Public balance** | `euint64` — creator-eyes only |
| Payment censorship | Visa / bank risk | Permissionless | Permissionless |
| Account freeze risk | Anytime | None | None |
| Platform data leverage | Total | Total (public) | **Zero — math enforces it** |

Public blockchain solves censorship resistance but makes privacy worse than Web2. **Both problems need to be solved simultaneously.**

---

## 3. Why FHE is the only viable solution

Several privacy approaches exist. All of them fail for this use case except FHE.

### Why NFT gating fails

NFT ownership is public. If access to a creator's content requires holding a specific NFT, anyone can query who holds that NFT. The subscription relationship is fully visible.

### Why ZK proofs alone fail

ZK proofs can prove "I am a member of this set" without revealing which member. But they cannot maintain ongoing encrypted **state** on-chain. A ZK proof proves a fact at one point in time; it cannot represent a subscription that persists across blocks, accumulates revenue, and can be queried later without revealing the underlying data.

### Why token-gating fails

Holding a creator's token as a subscription mechanism makes the holder list public. Anyone can call `balanceOf()` on any address.

### Why FHE is different

Fully Homomorphic Encryption allows **computation on encrypted data without decrypting it**. This means:

```solidity
// The contract can do this — on ciphertext — without knowing the values
euint64 newRevenue = FHE.add(_creatorRevenue[creator], encryptedPayment);

// The subscription flag is written as ciphertext
euint8 activeStatus = FHE.asEuint8(1);
_subscriptions[creator][subscriber] = activeStatus;
```

The resulting on-chain storage slot contains only ciphertext. The chain is fully transparent — anyone can read the slot — but reading it reveals nothing. The underlying value can only be decrypted by the specific address that holds the CoFHE permission for that ciphertext.

**This is the only approach that satisfies all three requirements simultaneously:**
1. Subscription state persists on-chain (blockchain property)
2. Subscription state can be verified by the subscriber (FHE permission system)
3. Subscription state is unreadable by anyone else, including the platform operator (FHE encryption)

### The thesis

> *Without FHE, this product does not exist.*
>
> Remove FHE and replace with a regular `mapping(address => mapping(address => bool))`. Now any indexer, any script, any curious observer can enumerate every creator, query every subscriber, and reconstruct a permanent social graph. The entire value proposition collapses.
>
> FHE is not a feature of OnlyPaca. It is the reason OnlyPaca is possible.

---

## 4. The three-layer privacy architecture

OnlyPaca implements three independent privacy layers that together cover the full attack surface.

### Layer 1: Relayer pattern (identity)

The fan never submits a transaction directly to the contract. They sign an EIP-712 message off-chain (no gas, no on-chain trace). The platform Relayer submits the transaction with `msg.sender = Relayer`.

**What this protects:** The link between a fan's wallet address and the subscription contract. On-chain, the call appears to come from the Relayer — the fan's wallet is never associated with the contract interaction.

### Layer 2: FHE encrypted state (relationship)

The subscription relationship is stored as `euint8` ciphertext. The creator's accumulated revenue is stored as `euint64` ciphertext. FHE arithmetic (`FHE.add()`) allows revenue to accumulate without ever decrypting the running total.

**What this protects:** The subscription relationship itself. Even if someone reads the contract's storage, they see only ciphertext. Neither the platform operator nor any third party can determine who is subscribed to whom, or how much a creator has earned.

**What is intentionally public:** The subscriber count (`uint256 subscriberCount`) is public. This is a deliberate design decision — subscriber count provides social proof for potential subscribers without revealing who those subscribers are.

### Layer 3: Permission-based decryption (access control)

CoFHE's ACL system ensures that only authorized addresses can trigger decryption:

```solidity
// Only the subscriber can decrypt their own access status
FHE.allow(activeStatus, subscriber);
// Creator does NOT receive permission (cannot see who subscribed)

// Only the creator can decrypt their own revenue
FHE.allow(newRevenue, creator);
```

**What this protects:** Even within the system, data is siloed. The creator knows they have 1,200 subscribers but cannot see who they are. The platform operator can process subscriptions but cannot read any of the encrypted state. The subscriber can verify their own access but cannot see anyone else's.

---

## 5. Honest limitations

**CEX entry point:** If a fan funds their wallet from a KYC'd exchange, the exchange has a record. This is a problem at the ETH layer, not the OnlyPaca layer, and applies to all on-chain privacy solutions.

**Platform participation is visible:** Interacting with the Relayer is visible on-chain. The current MVP uses a Relayer that partially mitigates this (the fan's wallet does not touch the subscription contract), but wallet interaction with the Relayer itself could be observed. Stealth Addresses (ERC-5564) are the next-layer solution, planned for Wave 2.

**National-level surveillance:** Nation-state adversaries with access to exchange KYC data can correlate on-chain activity to real identities. OnlyPaca is not designed to protect against this threat model. It is designed to protect against the realistic threat: platform data breaches, competitive intelligence scraping, and social exposure within peer and professional networks.

---

## 6. Why now

FHE has been theoretically possible for decades but computationally impractical. Fhenix's CoFHE coprocessor makes FHE operations feasible in a production smart contract environment for the first time. The Fhenix team describes this as the "cryptographic readiness" moment — the same moment that ZK proofs had circa 2019–2020.

OnlyPaca is built specifically to demonstrate what this new primitive unlocks: a category of application — sensitive, relationship-based, economically significant — that was simply impossible on-chain before CoFHE existed.
