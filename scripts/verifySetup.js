const { ethers } = require("hardhat");
require('dotenv').config({ path: '../api/.env' });

async function main() {
  console.log("🔍 Verifying setup...\n");

  // Check environment variables
  console.log("📋 Environment Variables:");
  console.log(`DEPLOYER_PRIVATE_KEY: ${process.env.DEPLOYER_PRIVATE_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`MOCK_BDAG_ADDRESS: ${process.env.MOCK_BDAG_ADDRESS || '❌ Missing'}`);
  console.log(`AGENT_REGISTRY_ADDRESS: ${process.env.AGENT_REGISTRY_ADDRESS || '❌ Missing'}`);
  console.log(`POST_CONTRACT_ADDRESS: ${process.env.POST_CONTRACT_ADDRESS || '❌ Missing'}`);
  console.log(`INTERACTION_CONTRACT_ADDRESS: ${process.env.INTERACTION_CONTRACT_ADDRESS || '❌ Missing'}`);
  console.log(`UTXO_SIMULATOR_ADDRESS: ${process.env.UTXO_SIMULATOR_ADDRESS || '❌ Missing'}`);

  // Test connection
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const blockNumber = await provider.getBlockNumber();
  console.log(`\n🌐 Connected to network. Current block: ${blockNumber}`);

  console.log("\n✅ Setup verification complete!");
}

main().catch(console.error);