const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting InteractionContract deployment...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  try {
    // You'll need to update these addresses based on your previous deployments
    // For now, let's deploy everything fresh
    
    console.log("🔄 Deploying MockBDAG Token...");
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const mockBDAG = await MockERC20.deploy();
    await mockBDAG.waitForDeployment();
    const mockBDAGAddress = await mockBDAG.getAddress();
    console.log("✅ MockBDAG deployed to:", mockBDAGAddress);

    console.log("\n🔄 Deploying AgentRegistry...");
    const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
    const agentRegistry = await AgentRegistry.deploy(mockBDAGAddress);
    await agentRegistry.waitForDeployment();
    const agentRegistryAddress = await agentRegistry.getAddress();
    console.log("✅ AgentRegistry deployed to:", agentRegistryAddress);

    console.log("\n🔄 Deploying PostContract...");
    const PostContract = await ethers.getContractFactory("PostContract");
    const postContract = await PostContract.deploy(agentRegistryAddress);
    await postContract.waitForDeployment();
    const postContractAddress = await postContract.getAddress();
    console.log("✅ PostContract deployed to:", postContractAddress);

    console.log("\n🔄 Deploying InteractionContract...");
    const InteractionContract = await ethers.getContractFactory("InteractionContract");
    const interactionContract = await InteractionContract.deploy(
      agentRegistryAddress,
      postContractAddress
    );
    await interactionContract.waitForDeployment();
    const interactionContractAddress = await interactionContract.getAddress();
    console.log("✅ InteractionContract deployed to:", interactionContractAddress);

    // Setup and testing
    console.log("\n🔧 Setting up test scenario...\n");

    // Approve and register agents
    const registrationFee = await agentRegistry.REGISTRATION_FEE();
    await mockBDAG.approve(agentRegistryAddress, ethers.parseUnits("100", 18));

    // Register two agents
    await agentRegistry.registerAgent(1, "Agent Alice", "Assistant", "Natural language processing");
    await agentRegistry.registerAgent(2, "Agent Bob", "Analyst", "Data analysis and insights");
    console.log("✅ Registered two test agents");

    // Create a test post
    await postContract.createPost(1, "Hello from Agent Alice! This is my first post on BlockDAG.");
    console.log("✅ Created test post");

    // Test commenting
    await interactionContract.commentOnPost(1, 2, "Great post, Alice! Welcome to BlockDAG!");
    console.log("✅ Created test comment");

    // Test direct messaging
    await interactionContract.sendDM(1, 2, "Hey Bob, thanks for the comment!");
    console.log("✅ Sent test direct message");

    // Display results
    console.log("\n📊 Test Results:");
    
    const comments = await interactionContract.getCommentsForPost(1);
    console.log(`  Comments on post 1: ${comments.length}`);
    
    const dmsForAlice = await interactionContract.getDMsForAgent(1);
    const dmsForBob = await interactionContract.getDMsForAgent(2);
    console.log(`  DMs for Agent Alice: ${dmsForAlice.length}`);
    console.log(`  DMs for Agent Bob: ${dmsForBob.length}`);

    // Deployment summary
    console.log("\n" + "=".repeat(60));
    console.log("📋 COMPLETE DEPLOYMENT SUMMARY");
    console.log("=".repeat(60));
    console.log("MockBDAG Token:", mockBDAGAddress);
    console.log("AgentRegistry:", agentRegistryAddress);
    console.log("PostContract:", postContractAddress);
    console.log("InteractionContract:", interactionContractAddress);
    console.log("=".repeat(60));

    console.log("\n🎉 InteractionContract deployment completed successfully!");

  } catch (error) {
    console.error("\n❌ Deployment failed:", error);
    process.exitCode = 1;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });