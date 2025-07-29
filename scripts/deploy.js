const { ethers, network } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("=== Deployment Info ===");
  console.log("Network:", network.name);
  console.log("Chain ID:", network.config.chainId);
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  // Deploy Faucet
  const Faucet = await ethers.getContractFactory("Faucet");
  console.log("\nDeploying Faucet...");
  
  const faucet = await Faucet.deploy();
  await faucet.waitForDeployment();

  const faucetAddress = await faucet.getAddress();
  console.log("✅ Faucet deployed to:", faucetAddress);

  // Set initial description based on network
  const networkDescriptions = {
    hardhat: "Local Hardhat Faucet - Development Testing",
    localhost: "Local Development Faucet",
    sepolia: "Sepolia ETH Faucet - Get test ETH for development",
    goerli: "Goerli ETH Faucet - Get test ETH for development"
  };

  const description = networkDescriptions[network.name] || "ETH Faucet";
  console.log("Setting description:", description);
  await faucet.setDescription(description);
  
  // Fund the faucet with initial ETH
  const fundAmount = network.name === "hardhat" || network.name === "localhost" 
    ? ethers.parseEther("10") // More for local testing
    : ethers.parseEther("0.1"); // Less for testnets

  console.log("Funding faucet with", ethers.formatEther(fundAmount), "ETH...");
  
  const fundTx = await deployer.sendTransaction({
    to: faucetAddress,
    value: fundAmount
  });
  await fundTx.wait();

  console.log("\n=== Deployment Summary ===");
  console.log("🌐 Network:", network.name);
  console.log("📄 Faucet Address:", faucetAddress);
  console.log("👤 Owner Address:", deployer.address);
  console.log("💰 Initial Balance:", ethers.formatEther(await ethers.provider.getBalance(faucetAddress)), "ETH");
  console.log("📊 Contract Settings:");
  console.log("  - Max Balance:", ethers.formatEther(await faucet.maxBalance()), "ETH");
  console.log("  - Per Transaction Limit:", ethers.formatEther(await faucet.perTransactionLimit()), "ETH");
  console.log("  - Daily Limit:", ethers.formatEther(await faucet.dailyLimit()), "ETH");
  console.log("  - Cooldown:", await faucet.coolDown(), "seconds");

  // Save deployment info to file
  const deploymentInfo = {
    network: network.name,
    chainId: network.config.chainId,
    faucetAddress: faucetAddress,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    txHash: fundTx.hash
  };

  const fs = require('fs');
  const path = require('path');
  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }
  
  fs.writeFileSync(
    path.join(deploymentsDir, `${network.name}.json`),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n💾 Deployment info saved to:", `deployments/${network.name}.json`);

  // Verification info for testnets
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("\n=== Contract Verification ===");
    console.log("To verify on Etherscan, run:");
    console.log(`npx hardhat verify --network ${network.name} ${faucetAddress}`);
  }

  // Local network info
  if (network.name === "localhost") {
    console.log("\n=== Frontend Connection Info ===");
    console.log("Add this network to MetaMask:");
    console.log("- Network Name: Localhost 8545");
    console.log("- RPC URL: http://127.0.0.1:8545");
    console.log("- Chain ID: 31337");
    console.log("- Currency Symbol: ETH");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });