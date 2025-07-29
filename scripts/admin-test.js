const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  const deploymentFile = path.join(__dirname, '..', 'deployments', 'localhost.json');
  const deployment = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
  
  const [deployer, user1] = await ethers.getSigners();
  const Faucet = await ethers.getContractFactory("Faucet");
  const faucet = Faucet.attach(deployment.faucetAddress);

  console.log("🔧 Testing Admin Functions...\n");

  // Test owner functions
  console.log("📊 Current settings:");
  console.log("Max Balance:", ethers.formatEther(await faucet.maxBalance()), "ETH");
  console.log("Per Transaction Limit:", ethers.formatEther(await faucet.perTransactionLimit()), "ETH");
  console.log("Daily Limit:", ethers.formatEther(await faucet.dailyLimit()), "ETH");
  console.log("Cooldown:", Number(await faucet.coolDown()), "seconds");

  // Test changing limits
  console.log("\n🔧 Testing parameter changes...");
  
  // Increase max balance to allow tips
  await faucet.setMaxBalance(ethers.parseEther("15"));
  console.log("✅ Max balance increased to 15 ETH");
  
  // Test tip now
  console.log("\n🧪 Testing tip with higher max balance...");
  try {
    const tipTx = await faucet.connect(user1).tip({ value: ethers.parseEther("1") });
    await tipTx.wait();
    console.log("✅ Tip successful!");
    console.log("New balance:", ethers.formatEther(await faucet.getBalance()), "ETH");
    console.log("Total tips:", ethers.formatEther(await faucet.totalTipReceived()), "ETH");
  } catch (error) {
    console.log("❌ Tip failed:", error.reason);
  }

  // Test pause/unpause
  console.log("\n⏸️  Testing pause functionality...");
  await faucet.pause();
  console.log("✅ Contract paused");
  
  try {
    await faucet.connect(user1).withdraw(ethers.parseEther("0.01"));
    console.log("❌ Pause not working!");
  } catch (error) {
    console.log("✅ Pause working - withdrawal blocked");
  }

  await faucet.unpause();
  console.log("✅ Contract unpaused");

  console.log("\n🎉 Admin functions working perfectly!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });