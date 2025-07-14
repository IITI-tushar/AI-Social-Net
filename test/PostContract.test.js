const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PostContract", function () {
  let mockBDAG, agentRegistry, postContract;
  let deployer, user1, user2;

  beforeEach(async function () {
    [deployer, user1, user2] = await ethers.getSigners();

    // Deploy MockBDAG
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockBDAG = await MockERC20.deploy();
    await mockBDAG.waitForDeployment();

    // Deploy AgentRegistry
    const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
    agentRegistry = await AgentRegistry.deploy(await mockBDAG.getAddress());
    await agentRegistry.waitForDeployment();

    // Deploy PostContract
    const PostContract = await ethers.getContractFactory("PostContract");
    postContract = await PostContract.deploy(await agentRegistry.getAddress());
    await postContract.waitForDeployment();

    // Setup: Register agents
    const registrationFee = await agentRegistry.REGISTRATION_FEE();
    await mockBDAG.approve(await agentRegistry.getAddress(), ethers.parseUnits("50", 18));
    
    await agentRegistry.registerAgent(1, "Agent One", "Assistant", "AI capabilities");
    await agentRegistry.registerAgent(2, "Agent Two", "Analyzer", "Data analysis");
  });

  describe("Deployment", function () {
    it("Should set the correct AgentRegistry address", async function () {
      expect(await postContract.agentRegistry()).to.equal(await agentRegistry.getAddress());
    });

    it("Should initialize with zero posts", async function () {
      expect(await postContract.getTotalPosts()).to.equal(0);
    });
  });

  describe("Post Creation", function () {
    it("Should allow registered agent to create a post", async function () {
      const content = "Hello World!";
      
      await expect(postContract.createPost(1, content))
        .to.emit(postContract, "PostCreated")
        .withArgs(1, 1, content, await ethers.provider.getBlock('latest').then(b => b.timestamp + 1));

      const totalPosts = await postContract.getTotalPosts();
      expect(totalPosts).to.equal(1);

      const post = await postContract.getPost(1);
      expect(post.postId).to.equal(1);
      expect(post.agentId).to.equal(1);
      expect(post.content).to.equal(content);
      expect(post.likesCount).to.equal(0);
    });

    it("Should revert if agent is not registered", async function () {
      await expect(
        postContract.createPost(999, "Invalid post")
      ).to.be.revertedWith("PostContract: Agent not registered");
    });

    it("Should revert for empty content", async function () {
      await expect(
        postContract.createPost(1, "")
      ).to.be.revertedWith("PostContract: Content cannot be empty");
    });

    it("Should revert for content too long", async function () {
      const longContent = "a".repeat(1001); // 1001 characters
      await expect(
        postContract.createPost(1, longContent)
      ).to.be.revertedWith("PostContract: Content too long");
    });

    it("Should allow content with exactly 1000 characters", async function () {
      const maxContent = "a".repeat(1000); // Exactly 1000 characters
      await expect(postContract.createPost(1, maxContent))
        .to.emit(postContract, "PostCreated");
    });

    it("Should increment post IDs correctly", async function () {
      await postContract.createPost(1, "First post");
      await postContract.createPost(2, "Second post");
      
      expect(await postContract.getTotalPosts()).to.equal(2);
      
      const post1 = await postContract.getPost(1);
      const post2 = await postContract.getPost(2);
      
      expect(post1.postId).to.equal(1);
      expect(post2.postId).to.equal(2);
    });
  });

  describe("Post Likes", function () {
    beforeEach(async function () {
      await postContract.createPost(1, "Test post for likes");
    });

    it("Should allow registered agent to like a post", async function () {
      await expect(postContract.likePost(1, 2))
        .to.emit(postContract, "PostLiked")
        .withArgs(1, 2, 1);

      const post = await postContract.getPost(1);
      expect(post.likesCount).to.equal(1);

      const hasLiked = await postContract.hasAgentLikedPost(1, 2);
      expect(hasLiked).to.be.true;
    });

    it("Should prevent double-liking by same agent", async function () {
      await postContract.likePost(1, 2);
      
      await expect(
        postContract.likePost(1, 2)
      ).to.be.revertedWith("PostContract: Agent has already liked this post");
    });

    it("Should allow multiple agents to like the same post", async function () {
      await postContract.likePost(1, 2);
      await postContract.likePost(1, 1); // Post creator can like their own post
      
      const post = await postContract.getPost(1);
      expect(post.likesCount).to.equal(2);
    });

    it("Should revert if post does not exist", async function () {
      await expect(
        postContract.likePost(999, 1)
      ).to.be.revertedWith("PostContract: Post does not exist");
    });

    it("Should revert if agent is not registered", async function () {
      await expect(
        postContract.likePost(1, 999)
      ).to.be.revertedWith("PostContract: Agent not registered");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await postContract.createPost(1, "First post by agent 1");
      await postContract.createPost(2, "First post by agent 2");
      await postContract.createPost(1, "Second post by agent 1");
      
      await postContract.likePost(1, 2);
      await postContract.likePost(2, 1);
      await postContract.likePost(3, 2);
    });

    it("Should return correct post details", async function () {
      const post = await postContract.getPost(1);
      expect(post.postId).to.equal(1);
      expect(post.agentId).to.equal(1);
      expect(post.content).to.equal("First post by agent 1");
      expect(post.likesCount).to.equal(1);
    });

    it("Should return all posts", async function () {
      const allPosts = await postContract.getAllPosts();
      expect(allPosts.length).to.equal(3);
      expect(allPosts[0].postId).to.equal(1);
      expect(allPosts[1].postId).to.equal(2);
      expect(allPosts[2].postId).to.equal(3);
    });

    it("Should return correct total posts count", async function () {
      expect(await postContract.getTotalPosts()).to.equal(3);
    });

    it("Should correctly check if agent has liked post", async function () {
      expect(await postContract.hasAgentLikedPost(1, 2)).to.be.true;
      expect(await postContract.hasAgentLikedPost(1, 1)).to.be.false;
      expect(await postContract.hasAgentLikedPost(2, 1)).to.be.true;
    });

    it("Should revert when getting non-existent post", async function () {
      await expect(
        postContract.getPost(999)
      ).to.be.revertedWith("PostContract: Post does not exist");
    });
  });

  describe("Multiple Posts and Interactions", function () {
    it("Should handle multiple posts and likes correctly", async function () {
      // Create multiple posts
      for (let i = 1; i <= 5; i++) {
        await postContract.createPost(1, `Post number ${i}`);
      }

      // Agent 2 likes all posts
      for (let i = 1; i <= 5; i++) {
        await postContract.likePost(i, 2);
      }

      expect(await postContract.getTotalPosts()).to.equal(5);

      // Check all posts have 1 like
      for (let i = 1; i <= 5; i++) {
        const post = await postContract.getPost(i);
        expect(post.likesCount).to.equal(1);
        expect(await postContract.hasAgentLikedPost(i, 2)).to.be.true;
      }
    });
  });
});