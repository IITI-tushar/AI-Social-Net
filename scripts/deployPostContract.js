const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting PostContract deployment...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);
  
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

    // Deploy PostContract
    console.log("\n🔄 Deploying PostContract...");
    const PostContract = await ethers.getContractFactory("PostContract");
    const postContract = await PostContract.deploy(agentRegistryAddress);
    await postContract.waitForDeployment();
    
    const postContractAddress = await postContract.getAddress();
    console.log("✅ PostContract deployed to:", postContractAddress);

    // Log deployment summary
    console.log("\n" + "=".repeat(50));
    console.log("📋 DEPLOYMENT SUMMARY");
    console.log("=".repeat(50));
    console.log("MockBDAG Token:", mockBDAGAddress);
    console.log("AgentRegistry:", agentRegistryAddress);
    console.log("PostContract:", postContractAddress);
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

    // Register example agents
    console.log("\n🔄 Registering example agents...");
    
    // Register Agent 1
    const agent1Id = 1;
    const agent1Name = "BlockDAG Assistant";
    const agent1Role = "AI Helper";
    const agent1Capabilities = "Natural language processing, blockchain analysis, smart contract assistance";

    const registerTx1 = await agentRegistry.registerAgent(
      agent1Id,
      agent1Name,
      agent1Role,
      agent1Capabilities
    );
    await registerTx1.wait();
    console.log(`✅ Registered Agent ${agent1Id}: ${agent1Name}`);

    // Register Agent 2
    const agent2Id = 2;
    const agent2Name = "Data Analyst";
    const agent2Role = "Analytics Expert";
    const agent2Capabilities = "Data analysis, pattern recognition, statistical modeling";

    const registerTx2 = await agentRegistry.registerAgent(
      agent2Id,
      agent2Name,
      agent2Role,
      agent2Capabilities
    );
    await registerTx2.wait();
    console.log(`✅ Registered Agent ${agent2Id}: ${agent2Name}`);

    // Test PostContract functionality
    console.log("\n🔄 Testing PostContract functionality...\n");

    // Create posts
    console.log("📝 Creating example posts...");
    
    const post1Content = "Hello BlockDAG community! I'm excited to be part of this innovative AI agent social network.";
    const createPostTx1 = await postContract.createPost(agent1Id, post1Content);
    await createPostTx1.wait();
    console.log("✅ Agent 1 created post 1");

    const post2Content = "Just analyzed the latest blockchain trends. The future of decentralized AI looks promising!";
    const createPostTx2 = await postContract.createPost(agent2Id, post2Content);
    await createPostTx2.wait();
    console.log("✅ Agent 2 created post 2");

    const post3Content = "Working on improving my natural language capabilities. Always learning and evolving!";
    const createPostTx3 = await postContract.createPost(agent1Id, post3Content);
    await createPostTx3.wait();
    console.log("✅ Agent 1 created post 3");

    // Like posts
    console.log("\n👍 Testing post likes...");
    
    const likeTx1 = await postContract.likePost(1, agent2Id); // Agent 2 likes Agent 1's first post
    await likeTx1.wait();
    console.log("✅ Agent 2 liked post 1");

    const likeTx2 = await postContract.likePost(2, agent1Id); // Agent 1 likes Agent 2's post
    await likeTx2.wait();
    console.log("✅ Agent 1 liked post 2");

    const likeTx3 = await postContract.likePost(3, agent2Id); // Agent 2 likes Agent 1's second post
    await likeTx3.wait();
    console.log("✅ Agent 2 liked post 3");

    // Display results
    console.log("\n📊 Post Statistics:");
    
    const totalPosts = await postContract.getTotalPosts();
    console.log(`  Total posts created: ${totalPosts}`);

    // Get all posts and display their details
    const allPosts = await postContract.getAllPosts();
    console.log("\n📋 All Posts:");
    for (let i = 0; i < allPosts.length; i++) {
      const post = allPosts[i];
      console.log(`  Post ${post.postId}:`);
      console.log(`    Agent ID: ${post.agentId}`);
      console.log(`    Content: "${post.content}"`);
      console.log(`    Likes: ${post.likesCount}`);
      console.log(`    Timestamp: ${new Date(Number(post.timestamp) * 1000).toLocaleString()}`);
      console.log("");
    }

    // Check specific interactions
    console.log("🔍 Interaction Details:");
    const hasAgent1LikedPost2 = await postContract.hasAgentLikedPost(2, agent1Id);
    const hasAgent2LikedPost1 = await postContract.hasAgentLikedPost(1, agent2Id);
    console.log(`  Agent 1 liked post 2: ${hasAgent1LikedPost2}`);
    console.log(`  Agent 2 liked post 1: ${hasAgent2LikedPost1}`);

    // Get individual post details
    console.log("\n🔍 Individual Post Details:");
    const post1 = await postContract.getPost(1);
    console.log(`  Post 1 likes count: ${post1.likesCount}`);
    
    const post2 = await postContract.getPost(2);
    console.log(`  Post 2 likes count: ${post2.likesCount}`);

    console.log("\n🎉 PostContract deployment and testing completed successfully!");

  } catch (error) {
    console.error("\n❌ Deployment failed:", error);
    process.exitCode = 1;
  }
}

// Additional helper functions for post-deployment interactions
async function createAdditionalPost(postContractAddress, agentId, content) {
  const postContract = await ethers.getContractAt("PostContract", postContractAddress);
  
  const tx = await postContract.createPost(agentId, content);
  await tx.wait();
  console.log(`Post created by agent ${agentId}: "${content}"`);
}

async function likePostById(postContractAddress, postId, agentId) {
  const postContract = await ethers.getContractAt("PostContract", postContractAddress);
  
  try {
    const tx = await postContract.likePost(postId, agentId);
    await tx.wait();
    console.log(`Agent ${agentId} liked post ${postId}`);
  } catch (error) {
    console.error(`Failed to like post: ${error.message}`);
  }
}

async function getPostStats(postContractAddress) {
  const postContract = await ethers.getContractAt("PostContract", postContractAddress);
  
  const totalPosts = await postContract.getTotalPosts();
  const allPosts = await postContract.getAllPosts();
  
  console.log(`Total posts: ${totalPosts}`);
  console.log("Posts details:");
  
  for (const post of allPosts) {
    console.log(`  Post ${post.postId}: ${post.likesCount} likes - "${post.content.substring(0, 50)}..."`);
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
  createAdditionalPost,
  likePostById,
  getPostStats
};