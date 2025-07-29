const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("💰 Balance Checker\n");

  // Check if there's a deployment
  const deploymentFile = path.join(__dirname, '..', 'deployments', 'localhost.json');
  
  if (fs.existsSync(deploymentFile)) {
    const deployment = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
    console.log("📄 Contract Info:");
    console.log("Address:", deployment.faucetAddress);
    
    try {
      const contractBalance = await ethers.provider.getBalance(deployment.faucetAddress);
      console.log("Contract Balance:", ethers.formatEther(contractBalance), "ETH");
    } catch (error) {
      console.log("❌ Cannot check contract balance:", error.message);
    }
    console.log();
  }

  // Check account balances
  const accounts = await ethers.getSigners();
  console.log("👥 Account Balances:");
  console.log("=".repeat(60));
  
  for (let i = 0; i < Math.min(accounts.length, 5); i++) {
    const balance = await ethers.provider.getBalance(accounts[i].address);
    console.log(`Account ${i}: ${accounts[i].address}`);
    console.log(`Balance: ${ethers.formatEther(balance)} ETH\n`);
  }
  
  if (accounts.length > 5) {
    console.log(`... and ${accounts.length - 5} more accounts`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });