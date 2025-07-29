// scripts/deploy-and-fund.js
const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting deployment and funding process...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contract with account:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  // Deploy the Faucet contract
  console.log("\n📄 Deploying Faucet contract...");
  const Faucet = await ethers.getContractFactory("Faucet");
  const faucet = await Faucet.deploy();
  await faucet.waitForDeployment();
  
  const faucetAddress = await faucet.getAddress();
  console.log("✅ Faucet deployed to:", faucetAddress);

  // Fund the faucet with 5 ETH
  console.log("\n💸 Funding faucet with 5 ETH...");
  const fundingAmount = ethers.parseEther("5.0");
  
  const fundTx = await deployer.sendTransaction({
    to: faucetAddress,
    value: fundingAmount
  });
  await fundTx.wait();
  
  // Verify the faucet balance
  const faucetBalance = await ethers.provider.getBalance(faucetAddress);
  console.log("✅ Faucet funded! Balance:", ethers.formatEther(faucetBalance), "ETH");
  
  // Test contract functions
  console.log("\n🧪 Testing contract functions...");
  
  // Get contract info
  const owner = await faucet.owner();
  const maxBalance = await faucet.maxBalance();
  const perTxLimit = await faucet.perTransactionLimit();
  const dailyLimit = await faucet.dailyLimit();
  const coolDown = await faucet.coolDown();
  const paused = await faucet.paused();
  
  console.log("📊 Contract Details:");
  console.log("   Owner:", owner);
  console.log("   Max Balance:", ethers.formatEther(maxBalance), "ETH");
  console.log("   Per Transaction Limit:", ethers.formatEther(perTxLimit), "ETH");
  console.log("   Daily Limit:", ethers.formatEther(dailyLimit), "ETH");
  console.log("   Cooldown:", coolDown.toString(), "seconds");
  console.log("   Paused:", paused);
  console.log("   Current Balance:", ethers.formatEther(await faucet.getBalance()), "ETH");
  console.log("   Total Tips Received:", ethers.formatEther(await faucet.totalTipReceived()), "ETH");

  // Update frontend config
  console.log("\n🔧 Update your wagmi.ts with:");
  console.log(`CONTRACT_ADDRESSES = {
  31337: '${faucetAddress}', // Updated localhost deployment
  11155111: '', // Sepolia
  1: '', // Mainnet
}`);

  console.log("\n✨ Deployment complete! Your faucet is ready to use.");
  console.log("🌐 Make sure your frontend is using the updated ABI and contract address.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });