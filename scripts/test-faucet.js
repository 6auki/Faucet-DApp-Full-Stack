const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  // Load deployment info
  const deploymentFile = path.join(__dirname, '..', 'deployments', 'localhost.json');
  if (!fs.existsSync(deploymentFile)) {
    console.log("❌ No deployment found. Please deploy first:");
    console.log("npm run deploy:local");
    return;
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
  console.log("🔗 Testing faucet at:", deployment.faucetAddress);

  // Get signers
  const [deployer, user1, user2] = await ethers.getSigners();
  
  // Connect to deployed contract
  const Faucet = await ethers.getContractFactory("Faucet");
  const faucet = Faucet.attach(deployment.faucetAddress);

  console.log("\n📊 Contract Info:");
  const contractBalance = await faucet.getBalance();
  console.log("Balance:", ethers.formatEther(contractBalance), "ETH");
  console.log("Description:", await faucet.description());
  console.log("Owner:", await faucet.owner());
  console.log("Per Transaction Limit:", ethers.formatEther(await faucet.perTransactionLimit()), "ETH");
  console.log("Daily Limit:", ethers.formatEther(await faucet.dailyLimit()), "ETH");
  console.log("Cooldown:", Number(await faucet.coolDown()), "seconds");

  // Check if contract has funds
  if (contractBalance === 0n) {
    console.log("\n⚠️  Contract has no balance. Let's fund it:");
    const fundTx = await deployer.sendTransaction({
      to: deployment.faucetAddress,
      value: ethers.parseEther("5.0")
    });
    await fundTx.wait();
    console.log("✅ Funded contract with 5 ETH");
    console.log("New balance:", ethers.formatEther(await faucet.getBalance()), "ETH");
  }

  // Test withdrawal with user1
  console.log("\n🧪 Testing withdrawal with user1...");
  console.log("User1 address:", user1.address);
  
  const withdrawAmount = ethers.parseEther("0.01"); // 0.01 ETH
  const user1BalanceBefore = await ethers.provider.getBalance(user1.address);
  
  try {
    console.log("Attempting to withdraw", ethers.formatEther(withdrawAmount), "ETH...");
    const tx = await faucet.connect(user1).withdraw(withdrawAmount);
    const receipt = await tx.wait();
    
    const user1BalanceAfter = await ethers.provider.getBalance(user1.address);
    const gasUsed = receipt.gasUsed * receipt.gasPrice;
    const netReceived = user1BalanceAfter - user1BalanceBefore + gasUsed;
    
    console.log("✅ Withdrawal successful!");
    console.log("Gas used:", ethers.formatEther(gasUsed), "ETH");
    console.log("Net received:", ethers.formatEther(netReceived), "ETH");
    console.log("New faucet balance:", ethers.formatEther(await faucet.getBalance()), "ETH");

    // Test cooldown
    console.log("\n🧪 Testing cooldown (should fail)...");
    try {
      await faucet.connect(user1).withdraw(withdrawAmount);
      console.log("❌ Cooldown not working!");
    } catch (error) {
      console.log("✅ Cooldown working:", error.reason || "CooldownActive");
    }

    // Test with different user
    console.log("\n🧪 Testing with user2 (should work)...");
    const user2BalanceBefore = await ethers.provider.getBalance(user2.address);
    const tx2 = await faucet.connect(user2).withdraw(withdrawAmount);
    await tx2.wait();
    const user2BalanceAfter = await ethers.provider.getBalance(user2.address);
    console.log("✅ User2 withdrawal successful!");
    console.log("User2 net change:", ethers.formatEther(user2BalanceAfter - user2BalanceBefore), "ETH (minus gas)");

  } catch (error) {
    console.log("❌ Withdrawal failed:", error.reason || error.message);
    
    // Check common issues
    if (error.message.includes("InsufficientFunds")) {
      console.log("💡 Contract needs more funding");
    } else if (error.message.includes("CooldownActive")) {
      console.log("💡 User is in cooldown period");
    }
  }

  // Check user stats
  const [lastRequest, dailyWithdrawn, lastDay] = await faucet.getUserStats(user1.address);
  console.log("\n📈 User1 Stats:");
  if (lastRequest > 0) {
    console.log("Last request:", new Date(Number(lastRequest) * 1000).toLocaleString());
    console.log("Daily withdrawn:", ethers.formatEther(dailyWithdrawn), "ETH");
    console.log("Remaining daily limit:", ethers.formatEther(await faucet.getRemainingDailyLimit(user1.address)), "ETH");
  } else {
    console.log("No withdrawals yet");
  }

  // Test tip functionality
  console.log("\n🧪 Testing tip functionality...");
  try {
    const tipAmount = ethers.parseEther("0.1");
    const tx = await faucet.connect(user2).tip({ value: tipAmount });
    await tx.wait();
    console.log("✅ Tip successful!");
    console.log("Total tips received:", ethers.formatEther(await faucet.totalTipReceived()), "ETH");
  } catch (error) {
    console.log("❌ Tip failed:", error.reason || error.message);
  }

  console.log("\n🎉 Testing complete!");
  console.log("Final faucet balance:", ethers.formatEther(await faucet.getBalance()), "ETH");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });