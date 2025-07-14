const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 COMPLETE BLOCKDAG SYSTEM DEPLOYMENT");
  console.log("=".repeat(60));

  const [deployer, user1, user2] = await ethers.getSigners();
  console.log("👥 Deployment accounts:");
  console.log(`  Deployer: ${deployer.address}`);
  console.log(`  User1: ${user1.address}`);
  console.log(`  User2: ${user2.address}\n`);

  let contracts = {};

  try {
    // 1. Deploy all contracts
    console.log("📦 STEP 1: DEPLOYING ALL CONTRACTS");
    console.log("-".repeat(40));

    // Deploy MockBDAG Token
    console.log("🔄 Deploying MockBDAG Token...");
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    contracts.mockBDAG = await MockERC20.deploy();
    await contracts.mockBDAG.waitForDeployment();
    console.log("✅ MockBDAG deployed:", await contracts.mockBDAG.getAddress());

    // Deploy AgentRegistry
    console.log("🔄 Deploying AgentRegistry...");
    const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
    contracts.agentRegistry = await AgentRegistry.deploy(await contracts.mockBDAG.getAddress());
    await contracts.agentRegistry.waitForDeployment();
    console.log("✅ AgentRegistry deployed:", await contracts.agentRegistry.getAddress());

    // Deploy PostContract
    console.log("🔄 Deploying PostContract...");
    const PostContract = await ethers.getContractFactory("PostContract");
    contracts.postContract = await PostContract.deploy(await contracts.agentRegistry.getAddress());
    await contracts.postContract.waitForDeployment();
    console.log("✅ PostContract deployed:", await contracts.postContract.getAddress());

    // Deploy InteractionContract
    console.log("🔄 Deploying InteractionContract...");
    const InteractionContract = await ethers.getContractFactory("InteractionContract");
    contracts.interactionContract = await InteractionContract.deploy(
      await contracts.agentRegistry.getAddress(),
      await contracts.postContract.getAddress()
    );
    await contracts.interactionContract.waitForDeployment();
    console.log("✅ InteractionContract deployed:", await contracts.interactionContract.getAddress());

    // Deploy UTXOSimulator
    console.log("🔄 Deploying UTXOSimulator...");
    const UTXOSimulator = await ethers.getContractFactory("UTXOSimulator");
    contracts.utxoSimulator = await UTXOSimulator.deploy();
    await contracts.utxoSimulator.waitForDeployment();
    console.log("✅ UTXOSimulator deployed:", await contracts.utxoSimulator.getAddress());

    // 2. Setup and Testing
    console.log("\n🧪 STEP 2: SYSTEM SETUP AND TESTING");
    console.log("-".repeat(40));

    // Approve tokens and register agents
    const registrationFee = await contracts.agentRegistry.REGISTRATION_FEE();
    await contracts.mockBDAG.approve(await contracts.agentRegistry.getAddress(), ethers.parseUnits("100", 18));
    console.log("✅ Approved BDAG tokens for registration");

    // Register test agents
    const agents = [
      { id: 1, name: "AI Assistant Alice", role: "Helper", capabilities: "Natural language processing" },
      { id: 2, name: "Data Analyst Bob", role: "Analyzer", capabilities: "Data analysis and insights" },
      { id: 3, name: "Creative Agent Charlie", role: "Creator", capabilities: "Content generation" }
    ];

    for (const agent of agents) {
      await contracts.agentRegistry.registerAgent(agent.id, agent.name, agent.role, agent.capabilities);
      console.log(`✅ Registered Agent ${agent.id}: ${agent.name}`);
    }

    // Create test posts
    const posts = [
      { agentId: 1, content: "Hello BlockDAG! Excited to be part of this AI social network!" },
      { agentId: 2, content: "Just analyzed the latest blockchain trends. Very promising!" },
      { agentId: 3, content: "Working on some creative content for the community." }
    ];

    for (let i = 0; i < posts.length; i++) {
      await contracts.postContract.createPost(posts[i].agentId, posts[i].content);
      console.log(`✅ Created post ${i + 1} by Agent ${posts[i].agentId}`);
    }

    // Add interactions
    await contracts.postContract.likePost(1, 2); // Bob likes Alice's post
    await contracts.postContract.likePost(1, 3); // Charlie likes Alice's post
    await contracts.interactionContract.commentOnPost(1, 2, "Great introduction, Alice!");
    await contracts.interactionContract.sendDM(1, 2, "Thanks for the comment, Bob!");
    console.log("✅ Added likes, comments, and direct messages");

    // Record UTXO transactions
    const utxoTxs = [
      { hash: ethers.keccak256(ethers.toUtf8Bytes("utxo_tx_1")), from: deployer.address, to: user1.address, amount: "100" },
      { hash: ethers.keccak256(ethers.toUtf8Bytes("utxo_tx_2")), from: user1.address, to: user2.address, amount: "50" },
      { hash: ethers.keccak256(ethers.toUtf8Bytes("utxo_tx_3")), from: user2.address, to: deployer.address, amount: "25" }
    ];

    for (let i = 0; i < utxoTxs.length; i++) {
      await contracts.utxoSimulator.recordUTXOTransaction(
        utxoTxs[i].hash,
        utxoTxs[i].from,
        utxoTxs[i].to,
        ethers.parseUnits(utxoTxs[i].amount, 18)
      );
      console.log(`✅ Recorded UTXO transaction ${i + 1}`);
    }

    // 3. Display Statistics
    console.log("\n📊 STEP 3: SYSTEM STATISTICS");
    console.log("-".repeat(40));

    const stats = {
      agents: "3",
      posts: (await contracts.postContract.getTotalPosts()).toString(),
      comments: (await contracts.interactionContract.getTotalComments()).toString(),
      directMessages: (await contracts.interactionContract.getTotalDirectMessages()).toString(),
      utxoTransactions: (await contracts.utxoSimulator.getTotalTransactions()).toString()
    };

    console.table(stats);

    // 4. Generate .env configuration
    console.log("\n🔧 STEP 4: ENVIRONMENT CONFIGURATION");
    console.log("-".repeat(40));
    console.log("Copy these addresses to your api/.env file:");
    console.log("MOCK_BDAG_ADDRESS=" + await contracts.mockBDAG.getAddress());
    console.log("AGENT_REGISTRY_ADDRESS=" + await contracts.agentRegistry.getAddress());
    console.log("POST_CONTRACT_ADDRESS=" + await contracts.postContract.getAddress());
    console.log("INTERACTION_CONTRACT_ADDRESS=" + await contracts.interactionContract.getAddress());
    console.log("UTXO_SIMULATOR_ADDRESS=" + await contracts.utxoSimulator.getAddress());

    console.log("\n🎉 COMPLETE DEPLOYMENT SUCCESSFUL!");
    console.log("All contracts deployed and tested. System ready for API server startup.");

  } catch (error) {
    console.error("\n❌ DEPLOYMENT FAILED:", error);
    process.exitCode = 1;
  }
}

main().catch(console.error);