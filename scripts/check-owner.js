const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  // Load deployment info
  const deploymentFile = path.join(__dirname, '..', 'deployments', 'localhost.json');
  const deployment = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
  
  // Get all accounts
  const accounts = await ethers.getSigners();
  
  // Connect to contract
  const Faucet = await ethers.getContractFactory("Faucet");
  const faucet = Faucet.attach(deployment.faucetAddress);
  
  console.log("🔍 Contract Owner Information");
  console.log("=" .repeat(50));
  console.log("Contract Address:", deployment.faucetAddress);
  console.log("Contract Owner:", await faucet.owner());
  console.log("Deployer (from deployment):", deployment.deployer);
  console.log();
  
  console.log("📋 Available Accounts:");
  console.log("=" .repeat(50));
  for (let i = 0; i < Math.min(accounts.length, 5); i++) {
    const isOwner = accounts[i].address.toLowerCase() === (await faucet.owner()).toLowerCase();
    console.log(`Account ${i}: ${accounts[i].address} ${isOwner ? '👑 OWNER' : ''}`);
  }
  
  console.log();
  console.log("💡 To be the owner in MetaMask:");
  console.log("Import the private key of the account marked with 👑 OWNER");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });