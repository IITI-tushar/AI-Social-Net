const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("InteractionContract", function () {
  let mockBDAG, agentRegistry, postContract, interactionContract;
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

    // Deploy InteractionContract
    const InteractionContract = await ethers.getContractFactory("InteractionContract");
    interactionContract = await InteractionContract.deploy(
      await agentRegistry.getAddress(),
      await postContract.getAddress()
    );
    await interactionContract.waitForDeployment();

    // Setup: Register agents and create a post
    const registrationFee = await agentRegistry.REGISTRATION_FEE();
    await mockBDAG.approve(await agentRegistry.getAddress(), ethers.parseUnits("100", 18));
    
    await agentRegistry.registerAgent(1, "Agent One", "Assistant", "AI capabilities");
    await agentRegistry.registerAgent(2, "Agent Two", "Analyzer", "Data analysis");
    
    await postContract.createPost(1, "Test post content");
  });

  describe("Comments", function () {
    it("Should allow registered agent to comment on post", async function () {
      await expect(
        interactionContract.commentOnPost(1, 2, "Great post!")
      ).to.emit(interactionContract, "CommentCreated");

      const comments = await interactionContract.getCommentsForPost(1);
      expect(comments.length).to.equal(1);
      expect(comments[0].content).to.equal("Great post!");
      expect(comments[0].agentId).to.equal(2);
    });

    it("Should revert if agent is not registered", async function () {
      await expect(
        interactionContract.commentOnPost(1, 999, "Invalid comment")
      ).to.be.revertedWith("InteractionContract: Agent not registered");
    });

    it("Should revert if post does not exist", async function () {
      await expect(
        interactionContract.commentOnPost(999, 1, "Comment on non-existent post")
      ).to.be.revertedWith("InteractionContract: Post does not exist");
    });

    it("Should revert for empty comment content", async function () {
      await expect(
        interactionContract.commentOnPost(1, 1, "")
      ).to.be.revertedWith("InteractionContract: Comment content cannot be empty");
    });
  });

  describe("Direct Messages", function () {
    it("Should allow registered agent to send DM to another agent", async function () {
      await expect(
        interactionContract.sendDM(1, 2, "Hello Agent Two!")
      ).to.emit(interactionContract, "DMReceived");

      const dmsForAgent1 = await interactionContract.getDMsForAgent(1);
      const dmsForAgent2 = await interactionContract.getDMsForAgent(2);
      
      expect(dmsForAgent1.length).to.equal(1);
      expect(dmsForAgent2.length).to.equal(1);
      expect(dmsForAgent1[0].content).to.equal("Hello Agent Two!");
    });

    it("Should revert if sender is not registered", async function () {
      await expect(
        interactionContract.sendDM(999, 2, "Invalid sender")
      ).to.be.revertedWith("InteractionContract: Agent not registered");
    });

    it("Should revert if receiver is not registered", async function () {
      await expect(
        interactionContract.sendDM(1, 999, "Invalid receiver")
      ).to.be.revertedWith("InteractionContract: Agent not registered");
    });

    it("Should revert if agent tries to send DM to themselves", async function () {
      await expect(
        interactionContract.sendDM(1, 1, "Message to self")
      ).to.be.revertedWith("InteractionContract: Cannot send message to yourself");
    });

    it("Should revert for empty message content", async function () {
      await expect(
        interactionContract.sendDM(1, 2, "")
      ).to.be.revertedWith("InteractionContract: Message content cannot be empty");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await interactionContract.commentOnPost(1, 2, "First comment");
      await interactionContract.commentOnPost(1, 1, "Second comment");
      await interactionContract.sendDM(1, 2, "First message");
      await interactionContract.sendDM(2, 1, "Reply message");
    });

    it("Should return correct number of comments for post", async function () {
      const commentsCount = await interactionContract.getCommentsCountForPost(1);
      expect(commentsCount).to.equal(2);
    });

    it("Should return correct number of DMs for agent", async function () {
      const dmsCount1 = await interactionContract.getDMsCountForAgent(1);
      const dmsCount2 = await interactionContract.getDMsCountForAgent(2);
      expect(dmsCount1).to.equal(2); // Both messages appear in agent 1's list
      expect(dmsCount2).to.equal(2); // Both messages appear in agent 2's list
    });

    it("Should return total comments and messages", async function () {
      const totalComments = await interactionContract.getTotalComments();
      const totalMessages = await interactionContract.getTotalDirectMessages();
      expect(totalComments).to.equal(2);
      expect(totalMessages).to.equal(2);
    });
  });
});