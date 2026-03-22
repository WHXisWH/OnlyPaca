import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Deployment script for OnlyFHE contracts
 *
 * Deployment order:
 * 1. Deploy OnlyFHESubscription with deployer as temporary relayer
 * 2. Deploy OnlyFHERelayer pointing to subscription contract
 * 3. Update subscription contract to use real relayer
 * 4. Remove deployer from relayer whitelist
 */
async function main() {
  console.log("=".repeat(60));
  console.log("OnlyFHE Contract Deployment");
  console.log("=".repeat(60));

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();
  const balance = await ethers.provider.getBalance(deployerAddress);

  console.log("\n📋 Deployment Configuration:");
  console.log(`   Network: ${network.name}`);
  console.log(`   Chain ID: ${(await ethers.provider.getNetwork()).chainId}`);
  console.log(`   Deployer: ${deployerAddress}`);
  console.log(`   Balance: ${ethers.formatEther(balance)} ETH`);

  // Check balance
  if (balance < ethers.parseEther("0.01")) {
    console.warn("\n⚠️  Warning: Low deployer balance. Deployment may fail.");
  }

  console.log("\n" + "-".repeat(60));
  console.log("Step 1: Deploying OnlyFHESubscription");
  console.log("-".repeat(60));

  // Deploy subscription contract with deployer as initial relayer
  const SubscriptionFactory = await ethers.getContractFactory(
    "OnlyFHESubscription"
  );
  const subscription = await SubscriptionFactory.deploy(deployerAddress);
  await subscription.waitForDeployment();

  const subscriptionAddress = await subscription.getAddress();
  console.log(`   ✅ OnlyFHESubscription deployed at: ${subscriptionAddress}`);

  // Wait for confirmations on testnet
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("   ⏳ Waiting for confirmations...");
    await subscription.deploymentTransaction()?.wait(3);
    console.log("   ✅ Confirmed");
  }

  console.log("\n" + "-".repeat(60));
  console.log("Step 2: Deploying OnlyFHERelayer");
  console.log("-".repeat(60));

  // Deploy relayer contract
  const RelayerFactory = await ethers.getContractFactory("OnlyFHERelayer");
  const relayer = await RelayerFactory.deploy(subscriptionAddress);
  await relayer.waitForDeployment();

  const relayerAddress = await relayer.getAddress();
  console.log(`   ✅ OnlyFHERelayer deployed at: ${relayerAddress}`);

  // Wait for confirmations
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("   ⏳ Waiting for confirmations...");
    await relayer.deploymentTransaction()?.wait(3);
    console.log("   ✅ Confirmed");
  }

  console.log("\n" + "-".repeat(60));
  console.log("Step 3: Configuring Relayer Whitelist");
  console.log("-".repeat(60));

  // Add relayer contract to whitelist
  console.log("   Adding relayer contract to whitelist...");
  const addRelayerTx = await subscription.setRelayer(relayerAddress, true);
  await addRelayerTx.wait();
  console.log(`   ✅ Relayer contract added: ${relayerAddress}`);

  // Remove deployer from whitelist (optional, for security)
  console.log("   Removing deployer from whitelist...");
  const removeDeployerTx = await subscription.setRelayer(deployerAddress, false);
  await removeDeployerTx.wait();
  console.log(`   ✅ Deployer removed from whitelist`);

  // Verify configuration
  const isRelayerWhitelisted = await subscription.isRelayer(relayerAddress);
  const isDeployerWhitelisted = await subscription.isRelayer(deployerAddress);

  console.log("\n   Verification:");
  console.log(`   - Relayer contract whitelisted: ${isRelayerWhitelisted}`);
  console.log(`   - Deployer whitelisted: ${isDeployerWhitelisted}`);

  if (!isRelayerWhitelisted) {
    console.error("   ❌ ERROR: Relayer not properly whitelisted!");
    process.exit(1);
  }

  console.log("\n" + "-".repeat(60));
  console.log("Step 4: Saving Deployment Addresses");
  console.log("-".repeat(60));

  // Prepare deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: (await ethers.provider.getNetwork()).chainId.toString(),
    contracts: {
      subscription: subscriptionAddress,
      relayer: relayerAddress,
    },
    deployer: deployerAddress,
    deployedAt: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
  };

  // Save to file
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const filename = `${network.name}-${Date.now()}.json`;
  const filepath = path.join(deploymentsDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`   ✅ Saved to: ${filepath}`);

  // Also save as latest
  const latestPath = path.join(deploymentsDir, `${network.name}-latest.json`);
  fs.writeFileSync(latestPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`   ✅ Saved to: ${latestPath}`);

  console.log("\n" + "=".repeat(60));
  console.log("🎉 Deployment Complete!");
  console.log("=".repeat(60));
  console.log("\n📋 Contract Addresses:");
  console.log(`   OnlyFHESubscription: ${subscriptionAddress}`);
  console.log(`   OnlyFHERelayer:      ${relayerAddress}`);

  console.log("\n📋 Next Steps:");
  console.log("   1. Update frontend/.env with contract addresses");
  console.log("   2. Update relayer/.env with contract addresses");
  console.log("   3. Fund the relayer backend wallet");
  console.log("   4. Register test creators");

  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("\n📋 Verify Contracts:");
    console.log(
      `   npx hardhat verify --network ${network.name} ${subscriptionAddress} ${deployerAddress}`
    );
    console.log(
      `   npx hardhat verify --network ${network.name} ${relayerAddress} ${subscriptionAddress}`
    );
  }

  return deploymentInfo;
}

main()
  .then((result) => {
    console.log("\n✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  });
