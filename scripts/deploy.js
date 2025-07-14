const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting deployment process...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  
  // Check deployer balance
  const deployerBalance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(deployerBalance), "ETH\n");

  try {
    // Deploy MockBDAG Token
    console.log("🔄 Deploying MockBDAG Token...");
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const mockBDAG = await MockERC20.deploy();
    await mockBDAG.waitForDeployment();
    
    const mockBDAGAddress = await mockBDAG.getAddress();
    console.log("✅ MockBDAG Token deployed to:", mockBDAGAddress);

    // Deploy AgentRegistry
    console.log("\n🔄 Deploying AgentRegistry...");
    const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
    const agentRegistry = await AgentRegistry.deploy(mockBDAGAddress);
    await agentRegistry.waitForDeployment();
    
    const agentRegistryAddress = await agentRegistry.getAddress();
    console.log("✅ AgentRegistry deployed to:", agentRegistryAddress);

    // Log deployment summary
    console.log("\n" + "=".repeat(50));
    console.log("📋 DEPLOYMENT SUMMARY");
    console.log("=".repeat(50));
    console.log("MockBDAG Token:", mockBDAGAddress);
    console.log("AgentRegistry:", agentRegistryAddress);
    console.log("Deployer:", deployer.address);
    console.log("=".repeat(50));

    // Contract interaction examples
    console.log("\n🔧 Running interaction examples...\n");

    // Check deployer's BDAG balance
    const deployerBDAGBalance = await mockBDAG.balanceOf(deployer.address);
    console.log("💰 Deployer's BDAG balance:", ethers.formatUnits(deployerBDAGBalance, 18), "BDAG");

    // Get registration fee
    const registrationFee = await agentRegistry.REGISTRATION_FEE();
    console.log("💳 Agent registration fee:", ethers.formatUnits(registrationFee, 18), "BDAG");

    // Approve AgentRegistry to spend BDAG tokens
    console.log("\n🔄 Approving AgentRegistry to spend BDAG tokens...");
    const approveAmount = ethers.parseUnits("50", 18); // Approve 50 BDAG
    const approveTx = await mockBDAG.approve(agentRegistryAddress, approveAmount);
    await approveTx.wait();
    console.log("✅ Approved", ethers.formatUnits(approveAmount, 18), "BDAG for AgentRegistry");

    // Check allowance
    const allowance = await mockBDAG.allowance(deployer.address, agentRegistryAddress);
    console.log("📊 Current allowance:", ethers.formatUnits(allowance, 18), "BDAG");

    // Register an example agent
    console.log("\n🔄 Registering example agent...");
    const agentId = 1;
    const agentName = "BlockDAG Assistant";
    const agentRole = "AI Helper";
    const agentCapabilities = "Natural language processing, blockchain analysis, smart contract assistance";

    const registerTx = await agentRegistry.registerAgent(
      agentId,
      agentName,
      agentRole,
      agentCapabilities
    );
    await registerTx.wait();
    console.log("✅ Agent registered successfully!");

    // Get agent details
    const agentDetails = await agentRegistry.getAgentDetails(agentId);
    console.log("\n📋 Registered Agent Details:");
    console.log("  Agent ID:", agentDetails.agentId.toString());
    console.log("  Name:", agentDetails.name);
    console.log("  Role:", agentDetails.role);
    console.log("  Owner:", agentDetails.owner);
    console.log("  Capabilities:", agentDetails.capabilities);
    console.log("  Reputation Score:", agentDetails.reputationScore.toString());

    // Check balances after registration
    const deployerBDAGBalanceAfter = await mockBDAG.balanceOf(deployer.address);
    const contractBDAGBalance = await mockBDAG.balanceOf(agentRegistryAddress);
    
    console.log("\n💰 Post-Registration Balances:");
    console.log("  Deployer BDAG balance:", ethers.formatUnits(deployerBDAGBalanceAfter, 18), "BDAG");
    console.log("  Contract BDAG balance:", ethers.formatUnits(contractBDAGBalance, 18), "BDAG");

    // Save deployment info to file
    const deploymentInfo = {
      network: "localhost", // Update this based on your network
      timestamp: new Date().toISOString(),
      contracts: {
        MockBDAG: {
          address: mockBDAGAddress,
          name: "BlockDAG Token",
          symbol: "BDAG",
          decimals: 18
        },
        AgentRegistry: {
          address: agentRegistryAddress,
          registrationFee: ethers.formatUnits(registrationFee, 18) + " BDAG"
        }
      },
      deployer: deployer.address,
      exampleAgent: {
        id: agentId,
        name: agentName,
        role: agentRole
      }
    };

    // You can uncomment this to save deployment info to a JSON file
    // const fs = require('fs');
    // fs.writeFileSync('./deployment-info.json', JSON.stringify(deploymentInfo, null, 2));
    // console.log("\n📁 Deployment info saved to deployment-info.json");

    console.log("\n🎉 Deployment and setup completed successfully!");

  } catch (error) {
    console.error("\n❌ Deployment failed:", error);
    process.exitCode = 1;
  }
}

// Additional helper functions for post-deployment interactions
async function registerAdditionalAgent(agentRegistryAddress, mockBDAGAddress, agentData) {
  const [deployer] = await ethers.getSigners();
  
  const mockBDAG = await ethers.getContractAt("MockERC20", mockBDAGAddress);
  const agentRegistry = await ethers.getContractAt("AgentRegistry", agentRegistryAddress);
  
  const registrationFee = await agentRegistry.REGISTRATION_FEE();
  
  // Approve tokens
  await mockBDAG.approve(agentRegistryAddress, registrationFee);
  
  // Register agent
  const tx = await agentRegistry.registerAgent(
    agentData.id,
    agentData.name,
    agentData.role,
    agentData.capabilities
  );
  
  await tx.wait();
  console.log(`Agent ${agentData.name} registered with ID ${agentData.id}`);
}

async function getAgentInfo(agentRegistryAddress, agentId) {
  const agentRegistry = await ethers.getContractAt("AgentRegistry", agentRegistryAddress);
  
  try {
    const agent = await agentRegistry.getAgentDetails(agentId);
    return {
      id: agent.agentId.toString(),
      name: agent.name,
      role: agent.role,
      owner: agent.owner,
      capabilities: agent.capabilities,
      reputationScore: agent.reputationScore.toString()
    };
  } catch (error) {
    console.log(`Agent with ID ${agentId} not found`);
    return null;
  }
}

// Run the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

// Export helper functions for use in other scripts
module.exports = {
  registerAdditionalAgent,
  getAgentInfo
};