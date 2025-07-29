const { ethers } = require("hardhat");

async function main() {
  const accounts = await ethers.getSigners();
  
  console.log("Available accounts:");
  console.log("==================");
  
  for (let i = 0; i < accounts.length; i++) {
    const balance = await ethers.provider.getBalance(accounts[i].address);
    console.log(`Account ${i}: ${accounts[i].address} (${ethers.formatEther(balance)} ETH)`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });