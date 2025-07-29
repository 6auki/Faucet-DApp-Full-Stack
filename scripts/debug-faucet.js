// scripts/debug-faucet.js
const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Debugging Faucet Contract...");
  
  // Contract address from your wagmi.ts
  const FAUCET_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
  try {
    // Get the contract instance
    const Faucet = await ethers.getContractFactory("Faucet");
    const faucet = Faucet.attach(FAUCET_ADDRESS);
    
    console.log("📄 Contract Address:", FAUCET_ADDRESS);
    
    // Check if contract exists
    const code = await ethers.provider.getCode(FAUCET_ADDRESS);
    if (code === "0x") {
      console.log("❌ NO CONTRACT DEPLOYED AT THIS ADDRESS!");
      console.log("🔧 You need to deploy the contract first.");
      return;
    }
    
    console.log("✅ Contract exists at address");
    
    // Get contract state
    console.log("\n📊 Contract State:");
    const balance = await ethers.provider.getBalance(FAUCET_ADDRESS);
    console.log("   ETH Balance:", ethers.formatEther(balance), "ETH");
    
    try {
      const owner = await faucet.owner();
      console.log("   Owner:", owner);
    } catch (e) {
      console.log("   ❌ Error reading owner:", e.message);
    }
    
    try {
      const contractBalance = await faucet.getBalance();
      console.log("   Contract getBalance():", ethers.formatEther(contractBalance), "ETH");
    } catch (e) {
      console.log("   ❌ Error calling getBalance():", e.message);
    }
    
    try {
      const totalTips = await faucet.totalTipReceived();
      console.log("   Total Tips:", ethers.formatEther(totalTips), "ETH");
    } catch (e) {
      console.log("   ❌ Error reading totalTipReceived:", e.message);
    }
    
    try {
      const maxBalance = await faucet.maxBalance();
      console.log("   Max Balance:", ethers.formatEther(maxBalance), "ETH");
    } catch (e) {
      console.log("   ❌ Error reading maxBalance:", e.message);
    }
    
    try {
      const perTxLimit = await faucet.perTransactionLimit();
      console.log("   Per Tx Limit:", ethers.formatEther(perTxLimit), "ETH");
    } catch (e) {
      console.log("   ❌ Error reading perTransactionLimit:", e.message);
    }
    
    try {
      const paused = await faucet.paused();
      console.log("   Paused:", paused);
    } catch (e) {
      console.log("   ❌ Error reading paused:", e.message);
    }
    
    // Test with a user account
    const [deployer, user1] = await ethers.getSigners();
    console.log("\n👤 Testing with user:", user1.address);
    console.log("   User balance:", ethers.formatEther(await ethers.provider.getBalance(user1.address)), "ETH");
    
    // Test getUserStats
    try {
      const userStats = await faucet.getUserStats(user1.address);
      console.log("   User Stats:", {
        lastRequest: userStats[0].toString(),
        dailyWithdrawn: ethers.formatEther(userStats[1]),
        lastWithdrawnDay: userStats[2].toString()
      });
    } catch (e) {
      console.log("   ❌ Error reading getUserStats:", e.message);
    }
    
    // Test getRemainingDailyLimit
    try {
      const remaining = await faucet.getRemainingDailyLimit(user1.address);
      console.log("   Remaining Daily Limit:", ethers.formatEther(remaining), "ETH");
    } catch (e) {
      console.log("   ❌ Error reading getRemainingDailyLimit:", e.message);
    }
    
    // If contract has 0 balance, fund it
    if (balance === 0n) {
      console.log("\n💰 Funding contract with 2 ETH...");
      const fundTx = await deployer.sendTransaction({
        to: FAUCET_ADDRESS,
        value: ethers.parseEther("2.0")
      });
      await fundTx.wait();
      console.log("✅ Contract funded!");
    }
    
  } catch (error) {
    console.log("❌ Error debugging contract:", error.message);
    
    if (error.message.includes("could not decode result data")) {
      console.log("🔧 This suggests ABI mismatch - your frontend ABI doesn't match the deployed contract");
    }
    
    if (error.message.includes("call revert exception")) {
      console.log("🔧 Contract call reverted - check contract state and parameters");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Debug failed:", error);
    process.exit(1);
  });