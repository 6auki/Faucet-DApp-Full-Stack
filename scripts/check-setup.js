const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking deployment setup...\n");

  // Check if we can connect to the network
  try {
    const blockNumber = await ethers.provider.getBlockNumber();
    console.log("✅ Connected to network");
    console.log("📦 Current block number:", blockNumber);
  } catch (error) {
    console.log("❌ Cannot connect to network");
    console.log("Make sure you have 'npx hardhat node' running");
    return;
  }

  // Check deployer account
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);
  
  console.log("\n👤 Deployer Account Info:");
  console.log("Address:", deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH");

  // Check if contract is already deployed
  const fs = require('fs');
  const path = require('path');
  const deploymentFile = path.join(__dirname, '..', 'deployments', 'localhost.json');
  
  if (fs.existsSync(deploymentFile)) {
    const deployment = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
    console.log("\n📄 Found existing deployment:");
    console.log("Contract Address:", deployment.faucetAddress);
    console.log("Deployed at:", deployment.deployedAt);
    
    // Check if contract is still accessible
    try {
      const contractBalance = await ethers.provider.getBalance(deployment.faucetAddress);
      console.log("Contract Balance:", ethers.formatEther(contractBalance), "ETH");
      console.log("✅ Contract is accessible");
    } catch (error) {
      console.log("❌ Contract not accessible - may need to redeploy");
    }
  } else {
    console.log("\n📄 No deployment found");
    console.log("Run: npx hardhat run scripts/deploy.js --network localhost");
  }

  console.log("\n🚀 Ready to deploy!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });