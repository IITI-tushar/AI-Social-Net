const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting UTXOSimulator deployment...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
  // Check deployer balance
  const deployerBalance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(deployerBalance), "ETH\n");

  try {
    // Deploy UTXOSimulator
    console.log("🔄 Deploying UTXOSimulator...");
    const UTXOSimulator = await ethers.getContractFactory("UTXOSimulator");
    const utxoSimulator = await UTXOSimulator.deploy();
    await utxoSimulator.waitForDeployment();
    
    const utxoSimulatorAddress = await utxoSimulator.getAddress();
    console.log("✅ UTXOSimulator deployed to:", utxoSimulatorAddress);

    // Log deployment summary
    console.log("\n" + "=".repeat(50));
    console.log("📋 DEPLOYMENT SUMMARY");
    console.log("=".repeat(50));
    console.log("UTXOSimulator:", utxoSimulatorAddress);
    console.log("Deployer:", deployer.address);
    console.log("=".repeat(50));

    // Test the UTXOSimulator functionality
    console.log("\n🔧 Testing UTXOSimulator functionality...\n");

    // Record some example UTXO transactions
    console.log("📝 Recording example UTXO transactions...");

    // Transaction 1
    const txHash1 = ethers.keccak256(ethers.toUtf8Bytes("example_utxo_tx_1"));
    const sender1 = "0x1234567890123456789012345678901234567890";
    const receiver1 = "0x0987654321098765432109876543210987654321";
    const amount1 = ethers.parseUnits("100", 18);

    await utxoSimulator.recordUTXOTransaction(txHash1, sender1, receiver1, amount1);
    console.log("✅ Recorded UTXO transaction 1");

    // Transaction 2
    const txHash2 = ethers.keccak256(ethers.toUtf8Bytes("example_utxo_tx_2"));
    const sender2 = receiver1; // Chain transactions
    const receiver2 = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd";
    const amount2 = ethers.parseUnits("50", 18);

    await utxoSimulator.recordUTXOTransaction(txHash2, sender2, receiver2, amount2);
    console.log("✅ Recorded UTXO transaction 2");

    // Transaction 3
    const txHash3 = ethers.keccak256(ethers.toUtf8Bytes("example_utxo_tx_3"));
    const sender3 = deployer.address;
    const receiver3 = receiver1;
    const amount3 = ethers.parseUnits("25.5", 18);

    await utxoSimulator.recordUTXOTransaction(txHash3, sender3, receiver3, amount3);
    console.log("✅ Recorded UTXO transaction 3");

    // Display results
    console.log("\n📊 UTXO Transaction Statistics:");
    
    const totalTransactions = await utxoSimulator.getTotalTransactions();
    console.log(`  Total transactions recorded: ${totalTransactions}`);

    // Get all transactions
    const allTransactions = await utxoSimulator.getAllUTXOTransactions();
    console.log("\n📋 All UTXO Transactions:");
    
    for (let i = 0; i < allTransactions.length; i++) {
      const tx = allTransactions[i];
      console.log(`  Transaction ${i + 1}:`);
      console.log(`    Hash: ${tx.transactionHash}`);
      console.log(`    From: ${tx.senderAddress}`);
      console.log(`    To: ${tx.receiverAddress}`);
      console.log(`    Amount: ${ethers.formatUnits(tx.amount, 18)} tokens`);
      console.log(`    Timestamp: ${new Date(Number(tx.timestamp) * 1000).toLocaleString()}`);
      console.log(`    Block Number: ${tx.blockNumber}`);
      console.log("");
    }

    // Test transaction lookup
    console.log("🔍 Testing transaction lookup:");
    const retrievedTx = await utxoSimulator.getUTXOTransaction(txHash1);
    console.log(`  Retrieved transaction 1 amount: ${ethers.formatUnits(retrievedTx.amount, 18)} tokens`);

    // Test address-based search
    console.log("\n🔎 Testing address-based search:");
    const txsByAddress = await utxoSimulator.getTransactionsByAddress(receiver1);
    console.log(`  Transactions involving ${receiver1}: ${txsByAddress.length}`);

    // Test pagination
    console.log("\n📄 Testing pagination:");
    const paginatedTxs = await utxoSimulator.getUTXOTransactionsPaginated(0, 2);
    console.log(`  First 2 transactions retrieved: ${paginatedTxs.length}`);

    console.log("\n🎉 UTXOSimulator deployment and testing completed successfully!");

  } catch (error) {
    console.error("\n❌ Deployment failed:", error);
    process.exitCode = 1;
  }
}

// Helper functions for interacting with UTXOSimulator
async function recordUTXOTransaction(contractAddress, txHash, sender, receiver, amount) {
  const utxoSimulator = await ethers.getContractAt("UTXOSimulator", contractAddress);
  
  const tx = await utxoSimulator.recordUTXOTransaction(txHash, sender, receiver, amount);
  await tx.wait();
  console.log(`UTXO transaction recorded: ${txHash}`);
}

async function getUTXOStats(contractAddress) {
  const utxoSimulator = await ethers.getContractAt("UTXOSimulator", contractAddress);
  
  const totalTransactions = await utxoSimulator.getTotalTransactions();
  console.log(`Total UTXO transactions: ${totalTransactions}`);
  
  return totalTransactions;
}

// Run the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

// Export helper functions
module.exports = {
  recordUTXOTransaction,
  getUTXOStats
};