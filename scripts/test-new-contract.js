// scripts/test-new-contract.js
const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing New Contract Deployment...");
  
  // Your NEW contract address
  const FAUCET_ADDRESS = "0x84eA74d481Ee0A5332c457a4d796187F6Ba67fEB";
  
  // Get the contract instance
  const Faucet = await ethers.getContractFactory("Faucet");
  const faucet = Faucet.attach(FAUCET_ADDRESS);
  
  console.log("📄 Testing Contract at:", FAUCET_ADDRESS);
  
  // Test all the functions your frontend uses
  console.log("\n📊 Reading Contract State...");
  
  const balance = await faucet.getBalance();
  console.log("✅ getBalance():", ethers.formatEther(balance), "ETH");
  
  const totalTips = await faucet.totalTipReceived();
  console.log("✅ totalTipReceived():", ethers.formatEther(totalTips), "ETH");
  
  const owner = await faucet.owner();
  console.log("✅ owner():", owner);
  
  const maxBalance = await faucet.maxBalance();
  console.log("✅ maxBalance():", ethers.formatEther(maxBalance), "ETH");
  
  const perTxLimit = await faucet.perTransactionLimit();
  console.log("✅ perTransactionLimit():", ethers.formatEther(perTxLimit), "ETH");
  
  const dailyLimit = await faucet.dailyLimit();
  console.log("✅ dailyLimit():", ethers.formatEther(dailyLimit), "ETH");
  
  const coolDown = await faucet.coolDown();
  console.log("✅ coolDown():", coolDown.toString(), "seconds");
  
  const paused = await faucet.paused();
  console.log("✅ paused():", paused);
  
  // Test user-specific functions
  const [deployer, user1] = await ethers.getSigners();
  console.log("\n👤 Testing User Functions for:", user1.address);
  
  const userStats = await faucet.getUserStats(user1.address);
  console.log("✅ getUserStats():", {
    lastRequest: userStats[0].toString(),
    dailyWithdrawn: ethers.formatEther(userStats[1]),
    lastWithdrawnDay: userStats[2].toString()
  });
  
  const remainingLimit = await faucet.getRemainingDailyLimit(user1.address);
  console.log("✅ getRemainingDailyLimit():", ethers.formatEther(remainingLimit), "ETH");
  
  // Test a small tip to verify the tip function works
  console.log("\n💰 Testing Tip Function...");
  const tipAmount = ethers.parseEther("0.01");
  
  console.log("User balance before tip:", ethers.formatEther(await ethers.provider.getBalance(user1.address)), "ETH");
  console.log("Contract balance before tip:", ethers.formatEther(await faucet.getBalance()), "ETH");
  console.log("Total tips before:", ethers.formatEther(await faucet.totalTipReceived()), "ETH");
  
  try {
    const tipTx = await faucet.connect(user1).tip({ value: tipAmount });
    await tipTx.wait();
    console.log("✅ Tip transaction successful!");
    
    console.log("Contract balance after tip:", ethers.formatEther(await faucet.getBalance()), "ETH");
    console.log("Total tips after:", ethers.formatEther(await faucet.totalTipReceived()), "ETH");
    
  } catch (error) {
    console.log("❌ Tip failed:", error.message);
  }
  
  // Test a small withdrawal
  console.log("\n💸 Testing Withdrawal Function...");
  const withdrawAmount = ethers.parseEther("0.01");
  
  console.log("User balance before withdrawal:", ethers.formatEther(await ethers.provider.getBalance(user1.address)), "ETH");
  console.log("Contract balance before withdrawal:", ethers.formatEther(await faucet.getBalance()), "ETH");
  
  try {
    const withdrawTx = await faucet.connect(user1).withdraw(withdrawAmount);
    await withdrawTx.wait();
    console.log("✅ Withdrawal transaction successful!");
    
    console.log("User balance after withdrawal:", ethers.formatEther(await ethers.provider.getBalance(user1.address)), "ETH");
    console.log("Contract balance after withdrawal:", ethers.formatEther(await faucet.getBalance()), "ETH");
    
    // Check user stats after withdrawal
    const userStatsAfter = await faucet.getUserStats(user1.address);
    console.log("User stats after withdrawal:", {
      lastRequest: userStatsAfter[0].toString(),
      dailyWithdrawn: ethers.formatEther(userStatsAfter[1]),
      lastWithdrawnDay: userStatsAfter[2].toString()
    });
    
  } catch (error) {
    console.log("❌ Withdrawal failed:", error.message);
  }
  
  console.log("\n🎉 All tests completed!");
  console.log("🌐 Your frontend should now work with:");
  console.log("   - Contract address: " + FAUCET_ADDRESS);
  console.log("   - Updated ABI with all functions");
  console.log("   - Proper balance updates");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  });