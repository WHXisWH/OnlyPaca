import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { OnlyFHESubscription, OnlyFHERelayer } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("OnlyFHE", function () {
  // ═══════════════════════════════════════════════════════════════════════════
  // TEST FIXTURES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Deploy both contracts and set up initial state
   */
  async function deployContractsFixture() {
    const [owner, relayerBackend, creator1, creator2, subscriber1, subscriber2] =
      await ethers.getSigners();

    // Deploy subscription contract with owner as initial relayer
    const SubscriptionFactory = await ethers.getContractFactory(
      "OnlyFHESubscription"
    );
    const subscription = await SubscriptionFactory.deploy(owner.address);
    await subscription.waitForDeployment();

    // Deploy relayer contract
    const RelayerFactory = await ethers.getContractFactory("OnlyFHERelayer");
    const relayer = await RelayerFactory.deploy(await subscription.getAddress());
    await relayer.waitForDeployment();

    // Configure relayer
    await subscription.setRelayer(await relayer.getAddress(), true);
    await relayer.transferOwnership(relayerBackend.address);

    return {
      subscription,
      relayer,
      owner,
      relayerBackend,
      creator1,
      creator2,
      subscriber1,
      subscriber2,
    };
  }

  /**
   * Deploy contracts and register a creator
   */
  async function deployWithCreatorFixture() {
    const base = await loadFixture(deployContractsFixture);

    const subscriptionPrice = ethers.parseEther("0.01");
    const subscriptionDuration = 30 * 24 * 60 * 60; // 30 days

    await base.subscription.connect(base.creator1).registerCreator(
      subscriptionPrice,
      subscriptionDuration,
      base.creator1.address,
      "ipfs://QmCreator1Metadata"
    );

    return { ...base, subscriptionPrice, subscriptionDuration };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SUBSCRIPTION CONTRACT TESTS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("OnlyFHESubscription", function () {
    describe("Deployment", function () {
      it("should deploy with correct owner", async function () {
        const { subscription, owner } = await loadFixture(deployContractsFixture);
        expect(await subscription.owner()).to.equal(owner.address);
      });

      it("should set initial relayer", async function () {
        const { subscription, owner } = await loadFixture(deployContractsFixture);
        expect(await subscription.isRelayer(owner.address)).to.be.true;
      });

      it("should have correct initial platform fee", async function () {
        const { subscription } = await loadFixture(deployContractsFixture);
        expect(await subscription.platformFeeBps()).to.equal(500n); // 5%
      });

      it("should revert with zero address relayer", async function () {
        const SubscriptionFactory = await ethers.getContractFactory(
          "OnlyFHESubscription"
        );
        await expect(
          SubscriptionFactory.deploy(ethers.ZeroAddress)
        ).to.be.revertedWithCustomError(SubscriptionFactory, "InvalidAddress");
      });
    });

    describe("Creator Registration", function () {
      it("should register a new creator", async function () {
        const { subscription, creator1 } = await loadFixture(deployContractsFixture);

        const price = ethers.parseEther("0.01");
        const duration = 30 * 24 * 60 * 60;
        const contentURI = "ipfs://QmTestMetadata";

        await expect(
          subscription
            .connect(creator1)
            .registerCreator(price, duration, creator1.address, contentURI)
        )
          .to.emit(subscription, "CreatorRegistered")
          .withArgs(creator1.address, price, contentURI);

        const profile = await subscription.getCreatorProfile(creator1.address);
        expect(profile.registered).to.be.true;
        expect(profile.subscriptionPrice).to.equal(price);
        expect(profile.subscriptionDuration).to.equal(duration);
        expect(profile.payoutAddress).to.equal(creator1.address);
        expect(profile.contentURI).to.equal(contentURI);
        expect(profile.subscriberCount).to.equal(0n);
      });

      it("should increment total creators count", async function () {
        const { subscription, creator1, creator2 } = await loadFixture(
          deployContractsFixture
        );

        expect(await subscription.totalCreators()).to.equal(0n);

        await subscription
          .connect(creator1)
          .registerCreator(
            ethers.parseEther("0.01"),
            0,
            creator1.address,
            "ipfs://test1"
          );
        expect(await subscription.totalCreators()).to.equal(1n);

        await subscription
          .connect(creator2)
          .registerCreator(
            ethers.parseEther("0.02"),
            0,
            creator2.address,
            "ipfs://test2"
          );
        expect(await subscription.totalCreators()).to.equal(2n);
      });

      it("should reject duplicate registration", async function () {
        const { subscription, creator1 } = await loadFixture(deployContractsFixture);

        await subscription
          .connect(creator1)
          .registerCreator(
            ethers.parseEther("0.01"),
            0,
            creator1.address,
            "ipfs://test"
          );

        await expect(
          subscription
            .connect(creator1)
            .registerCreator(
              ethers.parseEther("0.02"),
              0,
              creator1.address,
              "ipfs://test2"
            )
        ).to.be.revertedWithCustomError(subscription, "CreatorAlreadyRegistered");
      });

      it("should reject zero address payout", async function () {
        const { subscription, creator1 } = await loadFixture(deployContractsFixture);

        await expect(
          subscription
            .connect(creator1)
            .registerCreator(
              ethers.parseEther("0.01"),
              0,
              ethers.ZeroAddress,
              "ipfs://test"
            )
        ).to.be.revertedWithCustomError(subscription, "InvalidAddress");
      });

      it("should reject zero price", async function () {
        const { subscription, creator1 } = await loadFixture(deployContractsFixture);

        await expect(
          subscription
            .connect(creator1)
            .registerCreator(0, 0, creator1.address, "ipfs://test")
        ).to.be.revertedWithCustomError(subscription, "InvalidPrice");
      });
    });

    describe("Creator Profile Update", function () {
      it("should update subscription price", async function () {
        const { subscription, creator1 } = await loadFixture(
          deployWithCreatorFixture
        );

        const newPrice = ethers.parseEther("0.02");
        await subscription
          .connect(creator1)
          .updateCreatorProfile(newPrice, 0, ethers.ZeroAddress, "");

        const profile = await subscription.getCreatorProfile(creator1.address);
        expect(profile.subscriptionPrice).to.equal(newPrice);
      });

      it("should update content URI", async function () {
        const { subscription, creator1 } = await loadFixture(
          deployWithCreatorFixture
        );

        const newURI = "ipfs://QmNewMetadata";
        await subscription
          .connect(creator1)
          .updateCreatorProfile(0, 0, ethers.ZeroAddress, newURI);

        const profile = await subscription.getCreatorProfile(creator1.address);
        expect(profile.contentURI).to.equal(newURI);
      });

      it("should reject update from non-creator", async function () {
        const { subscription, subscriber1 } = await loadFixture(
          deployWithCreatorFixture
        );

        await expect(
          subscription
            .connect(subscriber1)
            .updateCreatorProfile(
              ethers.parseEther("0.01"),
              0,
              ethers.ZeroAddress,
              ""
            )
        ).to.be.revertedWithCustomError(subscription, "CreatorNotFound");
      });
    });

    describe("Subscription Activation", function () {
      it("should activate subscription via relayer", async function () {
        const { subscription, relayer, relayerBackend, creator1, subscriber1, subscriptionPrice } =
          await loadFixture(deployWithCreatorFixture);

        const relayerAddress = await relayer.getAddress();

        // Fund relayer contract
        await relayerBackend.sendTransaction({
          to: relayerAddress,
          value: subscriptionPrice,
        });

        // Activate subscription through subscription contract directly (as relayer)
        await subscription.setRelayer(relayerBackend.address, true);

        await expect(
          subscription
            .connect(relayerBackend)
            .activateSubscription(creator1.address, subscriber1.address, {
              value: subscriptionPrice,
            })
        )
          .to.emit(subscription, "SubscriptionActivated")
          .withArgs(creator1.address, 1n);

        // Check subscriber count increased
        const profile = await subscription.getCreatorProfile(creator1.address);
        expect(profile.subscriberCount).to.equal(1n);
      });

      it("should reject insufficient payment", async function () {
        const { subscription, relayerBackend, creator1, subscriber1, subscriptionPrice } =
          await loadFixture(deployWithCreatorFixture);

        await subscription.setRelayer(relayerBackend.address, true);

        const insufficientAmount = subscriptionPrice - 1n;

        await expect(
          subscription
            .connect(relayerBackend)
            .activateSubscription(creator1.address, subscriber1.address, {
              value: insufficientAmount,
            })
        ).to.be.revertedWithCustomError(subscription, "InsufficientPayment");
      });

      it("should reject non-relayer caller", async function () {
        const { subscription, subscriber1, creator1, subscriptionPrice } =
          await loadFixture(deployWithCreatorFixture);

        await expect(
          subscription
            .connect(subscriber1)
            .activateSubscription(creator1.address, subscriber1.address, {
              value: subscriptionPrice,
            })
        ).to.be.revertedWithCustomError(subscription, "NotRelayer");
      });

      it("should reject subscription to unregistered creator", async function () {
        const { subscription, relayerBackend, subscriber1, subscriber2 } =
          await loadFixture(deployWithCreatorFixture);

        await subscription.setRelayer(relayerBackend.address, true);

        await expect(
          subscription
            .connect(relayerBackend)
            .activateSubscription(subscriber2.address, subscriber1.address, {
              value: ethers.parseEther("0.01"),
            })
        ).to.be.revertedWithCustomError(subscription, "CreatorNotFound");
      });

      it("should calculate platform fee correctly", async function () {
        const { subscription, relayerBackend, creator1, subscriber1, subscriptionPrice } =
          await loadFixture(deployWithCreatorFixture);

        await subscription.setRelayer(relayerBackend.address, true);

        const initialPlatformFee = await subscription.platformFeeBalance();

        await subscription
          .connect(relayerBackend)
          .activateSubscription(creator1.address, subscriber1.address, {
            value: subscriptionPrice,
          });

        const newPlatformFee = await subscription.platformFeeBalance();
        const expectedFee = (subscriptionPrice * 500n) / 10000n; // 5%

        expect(newPlatformFee - initialPlatformFee).to.equal(expectedFee);
      });

      it("should refund excess payment", async function () {
        const { subscription, relayerBackend, creator1, subscriber1, subscriptionPrice } =
          await loadFixture(deployWithCreatorFixture);

        await subscription.setRelayer(relayerBackend.address, true);

        const excess = ethers.parseEther("0.005");
        const totalPayment = subscriptionPrice + excess;

        const subscriberBalanceBefore = await ethers.provider.getBalance(
          subscriber1.address
        );

        await subscription
          .connect(relayerBackend)
          .activateSubscription(creator1.address, subscriber1.address, {
            value: totalPayment,
          });

        const subscriberBalanceAfter = await ethers.provider.getBalance(
          subscriber1.address
        );

        // Subscriber should have received the excess as refund
        expect(subscriberBalanceAfter - subscriberBalanceBefore).to.equal(excess);
      });
    });

    describe("Admin Functions", function () {
      it("should allow owner to set relayer", async function () {
        const { subscription, owner, subscriber1 } = await loadFixture(
          deployContractsFixture
        );

        await expect(subscription.connect(owner).setRelayer(subscriber1.address, true))
          .to.emit(subscription, "RelayerUpdated")
          .withArgs(subscriber1.address, true);

        expect(await subscription.isRelayer(subscriber1.address)).to.be.true;
      });

      it("should reject non-owner setting relayer", async function () {
        const { subscription, subscriber1 } = await loadFixture(
          deployContractsFixture
        );

        await expect(
          subscription.connect(subscriber1).setRelayer(subscriber1.address, true)
        ).to.be.revertedWithCustomError(subscription, "OwnableUnauthorizedAccount");
      });

      it("should allow owner to update platform fee", async function () {
        const { subscription, owner } = await loadFixture(deployContractsFixture);

        await expect(subscription.connect(owner).setPlatformFee(300))
          .to.emit(subscription, "PlatformFeeUpdated")
          .withArgs(500, 300);

        expect(await subscription.platformFeeBps()).to.equal(300n);
      });

      it("should reject platform fee above maximum", async function () {
        const { subscription, owner } = await loadFixture(deployContractsFixture);

        await expect(
          subscription.connect(owner).setPlatformFee(1500) // 15% > 10% max
        ).to.be.revertedWithCustomError(subscription, "FeeTooHigh");
      });

      it("should allow owner to withdraw platform fees", async function () {
        const { subscription, owner, relayerBackend, creator1, subscriber1, subscriptionPrice } =
          await loadFixture(deployWithCreatorFixture);

        await subscription.setRelayer(relayerBackend.address, true);

        // Generate some platform fees
        await subscription
          .connect(relayerBackend)
          .activateSubscription(creator1.address, subscriber1.address, {
            value: subscriptionPrice,
          });

        const platformFees = await subscription.platformFeeBalance();
        expect(platformFees).to.be.gt(0n);

        const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);

        const tx = await subscription.connect(owner).withdrawPlatformFees();
        const receipt = await tx.wait();
        const gasCost = receipt!.gasUsed * receipt!.gasPrice;

        const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);

        expect(ownerBalanceAfter - ownerBalanceBefore + gasCost).to.equal(
          platformFees
        );
        expect(await subscription.platformFeeBalance()).to.equal(0n);
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // RELAYER CONTRACT TESTS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("OnlyFHERelayer", function () {
    describe("Deployment", function () {
      it("should deploy with correct subscription contract", async function () {
        const { relayer, subscription } = await loadFixture(deployContractsFixture);
        expect(await relayer.subscriptionContract()).to.equal(
          await subscription.getAddress()
        );
      });

      it("should have EIP-712 domain configured", async function () {
        const { relayer } = await loadFixture(deployContractsFixture);
        const domainSeparator = await relayer.getDomainSeparator();
        expect(domainSeparator).to.not.equal(ethers.ZeroHash);
      });

      it("should revert with zero address subscription contract", async function () {
        const RelayerFactory = await ethers.getContractFactory("OnlyFHERelayer");
        await expect(
          RelayerFactory.deploy(ethers.ZeroAddress)
        ).to.be.revertedWithCustomError(RelayerFactory, "InvalidAddress");
      });
    });

    describe("Signature Verification", function () {
      async function signSubscription(
        relayer: OnlyFHERelayer,
        subscriber: SignerWithAddress,
        creator: string,
        nonce: bigint,
        deadline: bigint
      ) {
        const domain = {
          name: "OnlyFHERelayer",
          version: "1",
          chainId: (await ethers.provider.getNetwork()).chainId,
          verifyingContract: await relayer.getAddress(),
        };

        const types = {
          Subscribe: [
            { name: "creator", type: "address" },
            { name: "subscriber", type: "address" },
            { name: "nonce", type: "uint256" },
            { name: "deadline", type: "uint256" },
          ],
        };

        const value = {
          creator,
          subscriber: subscriber.address,
          nonce,
          deadline,
        };

        return subscriber.signTypedData(domain, types, value);
      }

      it("should relay subscription with valid signature", async function () {
        const {
          subscription,
          relayer,
          relayerBackend,
          creator1,
          subscriber1,
          subscriptionPrice,
        } = await loadFixture(deployWithCreatorFixture);

        const nonce = await relayer.getNonce(subscriber1.address);
        const deadline = BigInt((await time.latest()) + 3600);

        const signature = await signSubscription(
          relayer,
          subscriber1,
          creator1.address,
          nonce,
          deadline
        );

        await expect(
          relayer
            .connect(relayerBackend)
            .relaySubscription(
              creator1.address,
              subscriber1.address,
              deadline,
              nonce,
              signature,
              { value: subscriptionPrice }
            )
        ).to.emit(relayer, "SubscriptionRelayed");

        // Check nonce incremented
        expect(await relayer.getNonce(subscriber1.address)).to.equal(nonce + 1n);

        // Check subscription activated
        const profile = await subscription.getCreatorProfile(creator1.address);
        expect(profile.subscriberCount).to.equal(1n);
      });

      it("should reject expired deadline", async function () {
        const { relayer, relayerBackend, creator1, subscriber1, subscriptionPrice } =
          await loadFixture(deployWithCreatorFixture);

        const nonce = await relayer.getNonce(subscriber1.address);
        const deadline = BigInt((await time.latest()) - 1); // Expired

        const signature = await signSubscription(
          relayer,
          subscriber1,
          creator1.address,
          nonce,
          deadline
        );

        await expect(
          relayer
            .connect(relayerBackend)
            .relaySubscription(
              creator1.address,
              subscriber1.address,
              deadline,
              nonce,
              signature,
              { value: subscriptionPrice }
            )
        ).to.be.revertedWithCustomError(relayer, "ExpiredDeadline");
      });

      it("should reject invalid nonce", async function () {
        const { relayer, relayerBackend, creator1, subscriber1, subscriptionPrice } =
          await loadFixture(deployWithCreatorFixture);

        const wrongNonce = 999n;
        const deadline = BigInt((await time.latest()) + 3600);

        const signature = await signSubscription(
          relayer,
          subscriber1,
          creator1.address,
          wrongNonce,
          deadline
        );

        await expect(
          relayer
            .connect(relayerBackend)
            .relaySubscription(
              creator1.address,
              subscriber1.address,
              deadline,
              wrongNonce,
              signature,
              { value: subscriptionPrice }
            )
        ).to.be.revertedWithCustomError(relayer, "InvalidNonce");
      });

      it("should reject signature from wrong signer", async function () {
        const {
          relayer,
          relayerBackend,
          creator1,
          subscriber1,
          subscriber2,
          subscriptionPrice,
        } = await loadFixture(deployWithCreatorFixture);

        const nonce = await relayer.getNonce(subscriber1.address);
        const deadline = BigInt((await time.latest()) + 3600);

        // Sign with subscriber2 but claim it's for subscriber1
        const signature = await signSubscription(
          relayer,
          subscriber2,
          creator1.address,
          nonce,
          deadline
        );

        await expect(
          relayer
            .connect(relayerBackend)
            .relaySubscription(
              creator1.address,
              subscriber1.address,
              deadline,
              nonce,
              signature,
              { value: subscriptionPrice }
            )
        ).to.be.revertedWithCustomError(relayer, "InvalidSignature");
      });

      it("should reject reused signature", async function () {
        const { relayer, relayerBackend, creator1, subscriber1, subscriptionPrice } =
          await loadFixture(deployWithCreatorFixture);

        const nonce = await relayer.getNonce(subscriber1.address);
        const deadline = BigInt((await time.latest()) + 3600);

        const signature = await signSubscription(
          relayer,
          subscriber1,
          creator1.address,
          nonce,
          deadline
        );

        // First use should succeed
        await relayer
          .connect(relayerBackend)
          .relaySubscription(
            creator1.address,
            subscriber1.address,
            deadline,
            nonce,
            signature,
            { value: subscriptionPrice }
          );

        // Second use should fail (even with incremented nonce)
        await expect(
          relayer
            .connect(relayerBackend)
            .relaySubscription(
              creator1.address,
              subscriber1.address,
              deadline,
              nonce + 1n,
              signature,
              { value: subscriptionPrice }
            )
        ).to.be.revertedWithCustomError(relayer, "SignatureAlreadyUsed");
      });

      it("should reject non-owner caller", async function () {
        const { relayer, subscriber1, creator1, subscriptionPrice } =
          await loadFixture(deployWithCreatorFixture);

        const nonce = await relayer.getNonce(subscriber1.address);
        const deadline = BigInt((await time.latest()) + 3600);

        const signature = await signSubscription(
          relayer,
          subscriber1,
          creator1.address,
          nonce,
          deadline
        );

        await expect(
          relayer
            .connect(subscriber1) // Not the owner
            .relaySubscription(
              creator1.address,
              subscriber1.address,
              deadline,
              nonce,
              signature,
              { value: subscriptionPrice }
            )
        ).to.be.revertedWithCustomError(relayer, "OwnableUnauthorizedAccount");
      });
    });

    describe("Admin Functions", function () {
      it("should allow owner to pause", async function () {
        const { relayer, relayerBackend } = await loadFixture(deployContractsFixture);

        await expect(relayer.connect(relayerBackend).setPaused(true))
          .to.emit(relayer, "PauseStateChanged")
          .withArgs(true);

        expect(await relayer.paused()).to.be.true;
      });

      it("should reject relay when paused", async function () {
        const { relayer, relayerBackend, creator1, subscriber1, subscriptionPrice } =
          await loadFixture(deployWithCreatorFixture);

        await relayer.connect(relayerBackend).setPaused(true);

        const nonce = await relayer.getNonce(subscriber1.address);
        const deadline = BigInt((await time.latest()) + 3600);

        const domain = {
          name: "OnlyFHERelayer",
          version: "1",
          chainId: (await ethers.provider.getNetwork()).chainId,
          verifyingContract: await relayer.getAddress(),
        };

        const types = {
          Subscribe: [
            { name: "creator", type: "address" },
            { name: "subscriber", type: "address" },
            { name: "nonce", type: "uint256" },
            { name: "deadline", type: "uint256" },
          ],
        };

        const value = {
          creator: creator1.address,
          subscriber: subscriber1.address,
          nonce,
          deadline,
        };

        const signature = await subscriber1.signTypedData(domain, types, value);

        await expect(
          relayer
            .connect(relayerBackend)
            .relaySubscription(
              creator1.address,
              subscriber1.address,
              deadline,
              nonce,
              signature,
              { value: subscriptionPrice }
            )
        ).to.be.revertedWithCustomError(relayer, "ContractPaused");
      });

      it("should allow owner to withdraw funds", async function () {
        const { relayer, relayerBackend, owner } = await loadFixture(
          deployContractsFixture
        );

        // Send some ETH to the relayer
        const amount = ethers.parseEther("1.0");
        await owner.sendTransaction({
          to: await relayer.getAddress(),
          value: amount,
        });

        const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);

        await expect(
          relayer.connect(relayerBackend).withdrawFunds(amount, owner.address)
        )
          .to.emit(relayer, "FundsWithdrawn")
          .withArgs(amount, owner.address);

        const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
        expect(ownerBalanceAfter - ownerBalanceBefore).to.equal(amount);
      });
    });

    describe("Helper Functions", function () {
      it("should compute correct subscription digest", async function () {
        const { relayer, creator1, subscriber1 } = await loadFixture(
          deployWithCreatorFixture
        );

        const nonce = 0n;
        const deadline = BigInt((await time.latest()) + 3600);

        const digest = await relayer.getSubscriptionDigest(
          creator1.address,
          subscriber1.address,
          nonce,
          deadline
        );

        expect(digest).to.not.equal(ethers.ZeroHash);
      });

      it("should track used signatures", async function () {
        const { relayer, relayerBackend, creator1, subscriber1, subscriptionPrice } =
          await loadFixture(deployWithCreatorFixture);

        const nonce = await relayer.getNonce(subscriber1.address);
        const deadline = BigInt((await time.latest()) + 3600);

        const domain = {
          name: "OnlyFHERelayer",
          version: "1",
          chainId: (await ethers.provider.getNetwork()).chainId,
          verifyingContract: await relayer.getAddress(),
        };

        const types = {
          Subscribe: [
            { name: "creator", type: "address" },
            { name: "subscriber", type: "address" },
            { name: "nonce", type: "uint256" },
            { name: "deadline", type: "uint256" },
          ],
        };

        const value = {
          creator: creator1.address,
          subscriber: subscriber1.address,
          nonce,
          deadline,
        };

        const signature = await subscriber1.signTypedData(domain, types, value);

        expect(await relayer.isSignatureUsed(signature)).to.be.false;

        await relayer
          .connect(relayerBackend)
          .relaySubscription(
            creator1.address,
            subscriber1.address,
            deadline,
            nonce,
            signature,
            { value: subscriptionPrice }
          );

        expect(await relayer.isSignatureUsed(signature)).to.be.true;
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // INTEGRATION TESTS
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Integration", function () {
    it("should complete full subscription flow", async function () {
      const {
        subscription,
        relayer,
        relayerBackend,
        creator1,
        subscriber1,
        subscriptionPrice,
      } = await loadFixture(deployWithCreatorFixture);

      // 1. Get nonce for subscriber
      const nonce = await relayer.getNonce(subscriber1.address);

      // 2. Create deadline
      const deadline = BigInt((await time.latest()) + 3600);

      // 3. Sign subscription authorization
      const domain = {
        name: "OnlyFHERelayer",
        version: "1",
        chainId: (await ethers.provider.getNetwork()).chainId,
        verifyingContract: await relayer.getAddress(),
      };

      const types = {
        Subscribe: [
          { name: "creator", type: "address" },
          { name: "subscriber", type: "address" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      };

      const value = {
        creator: creator1.address,
        subscriber: subscriber1.address,
        nonce,
        deadline,
      };

      const signature = await subscriber1.signTypedData(domain, types, value);

      // 4. Relay subscription
      await relayer
        .connect(relayerBackend)
        .relaySubscription(
          creator1.address,
          subscriber1.address,
          deadline,
          nonce,
          signature,
          { value: subscriptionPrice }
        );

      // 5. Verify subscription was activated
      const profile = await subscription.getCreatorProfile(creator1.address);
      expect(profile.subscriberCount).to.equal(1n);

      // 6. Verify nonce was incremented
      expect(await relayer.getNonce(subscriber1.address)).to.equal(1n);

      // 7. Verify platform fee was collected
      const platformFee = (subscriptionPrice * 500n) / 10000n;
      expect(await subscription.platformFeeBalance()).to.equal(platformFee);
    });

    it("should handle multiple subscriptions to same creator", async function () {
      const {
        subscription,
        relayer,
        relayerBackend,
        creator1,
        subscriber1,
        subscriber2,
        subscriptionPrice,
      } = await loadFixture(deployWithCreatorFixture);

      const domain = {
        name: "OnlyFHERelayer",
        version: "1",
        chainId: (await ethers.provider.getNetwork()).chainId,
        verifyingContract: await relayer.getAddress(),
      };

      const types = {
        Subscribe: [
          { name: "creator", type: "address" },
          { name: "subscriber", type: "address" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      };

      const deadline = BigInt((await time.latest()) + 3600);

      // Subscriber 1
      const sig1 = await subscriber1.signTypedData(domain, types, {
        creator: creator1.address,
        subscriber: subscriber1.address,
        nonce: 0n,
        deadline,
      });

      await relayer
        .connect(relayerBackend)
        .relaySubscription(
          creator1.address,
          subscriber1.address,
          deadline,
          0n,
          sig1,
          { value: subscriptionPrice }
        );

      // Subscriber 2
      const sig2 = await subscriber2.signTypedData(domain, types, {
        creator: creator1.address,
        subscriber: subscriber2.address,
        nonce: 0n,
        deadline,
      });

      await relayer
        .connect(relayerBackend)
        .relaySubscription(
          creator1.address,
          subscriber2.address,
          deadline,
          0n,
          sig2,
          { value: subscriptionPrice }
        );

      // Verify both subscriptions
      const profile = await subscription.getCreatorProfile(creator1.address);
      expect(profile.subscriberCount).to.equal(2n);
    });
  });
});
