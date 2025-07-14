const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AgentRegistry", function () {
  let agentRegistry;
  let bdagToken;
  let owner;
  let addr1;
  let addr2;
  const REGISTRATION_FEE = ethers.parseUnits("10", 18);

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy mock BDAG token
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    bdagToken = await MockERC20.deploy();
    
    // Transfer some tokens to addr1 for testing
    await bdagToken.transfer(addr1.address, ethers.parseUnits("100", 18));

    // Deploy AgentRegistry
    const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
    agentRegistry = await AgentRegistry.deploy(await bdagToken.getAddress());
  });

  describe("Deployment", function () {
    it("Should set the correct BDAG token address", async function () {
      expect(await agentRegistry.bdagToken()).to.equal(await bdagToken.getAddress());
    });

    it("Should set the correct registration fee", async function () {
      expect(await agentRegistry.REGISTRATION_FEE()).to.equal(REGISTRATION_FEE);
    });

    it("Should revert if BDAG token address is zero", async function () {
      const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
      await expect(AgentRegistry.deploy(ethers.ZeroAddress))
        .to.be.revertedWith("AgentRegistry: Invalid BDAG token address");
    });
  });

  describe("Agent Registration", function () {
    const agentId = 1;
    const agentName = "Test Agent";
    const agentRole = "AI Assistant";
    const agentCapabilities = "Natural language processing, data analysis";

    beforeEach(async function () {
      // Approve the contract to spend tokens
      await bdagToken.connect(addr1).approve(await agentRegistry.getAddress(), REGISTRATION_FEE);
    });

    it("Should register a new agent successfully", async function () {
      await expect(
        agentRegistry.connect(addr1).registerAgent(agentId, agentName, agentRole, agentCapabilities)
      )
        .to.emit(agentRegistry, "AgentRegistered")
        .withArgs(agentId, addr1.address, agentName, REGISTRATION_FEE);

      // Verify agent details
      const agent = await agentRegistry.getAgentDetails(agentId);
      expect(agent.agentId).to.equal(agentId);
      expect(agent.owner).to.equal(addr1.address);
      expect(agent.name).to.equal(agentName);
      expect(agent.role).to.equal(agentRole);
      expect(agent.capabilities).to.equal(agentCapabilities);
      expect(agent.reputationScore).to.equal(0);

      // Verify token balances
      expect(await bdagToken.balanceOf(addr1.address)).to.equal(ethers.parseUnits("90", 18));
      expect(await bdagToken.balanceOf(await agentRegistry.getAddress())).to.equal(REGISTRATION_FEE);
    });

    it("Should fail if agent ID is already registered", async function () {
      // Register first agent
      await agentRegistry.connect(addr1).registerAgent(agentId, agentName, agentRole, agentCapabilities);

      // Try to register with same ID
      await expect(
        agentRegistry.connect(addr1).registerAgent(agentId, "Another Agent", "Different Role", "Other capabilities")
      ).to.be.revertedWith("AgentRegistry: Agent ID already registered");
    });

    it("Should fail if allowance is insufficient", async function () {
      // Set insufficient allowance
      await bdagToken.connect(addr1).approve(await agentRegistry.getAddress(), ethers.parseUnits("5", 18));

      await expect(
        agentRegistry.connect(addr1).registerAgent(agentId, agentName, agentRole, agentCapabilities)
      ).to.be.revertedWith("AgentRegistry: Insufficient BDAG allowance. Please approve the contract to spend tokens.");
    });

    it("Should fail if user has insufficient balance", async function () {
      // Transfer all tokens away from addr2 (who has 0 balance)
      await expect(
        agentRegistry.connect(addr2).registerAgent(agentId, agentName, agentRole, agentCapabilities)
      ).to.be.revertedWith("AgentRegistry: Insufficient BDAG allowance. Please approve the contract to spend tokens.");
    });

    it("Should allow multiple agents with different IDs", async function () {
      const agentId2 = 2;
      
      // Register first agent
      await agentRegistry.connect(addr1).registerAgent(agentId, agentName, agentRole, agentCapabilities);
      
      // Approve for second registration
      await bdagToken.connect(addr1).approve(await agentRegistry.getAddress(), REGISTRATION_FEE);
      
      // Register second agent
      await expect(
        agentRegistry.connect(addr1).registerAgent(agentId2, "Second Agent", "Another Role", "Different capabilities")
      ).to.emit(agentRegistry, "AgentRegistered");

      // Verify both agents exist
      const agent1 = await agentRegistry.getAgentDetails(agentId);
      const agent2 = await agentRegistry.getAgentDetails(agentId2);
      
      expect(agent1.agentId).to.equal(agentId);
      expect(agent2.agentId).to.equal(agentId2);
    });
  });

  describe("Get Agent Details", function () {
    const agentId = 1;
    const agentName = "Test Agent";
    const agentRole = "AI Assistant";
    const agentCapabilities = "Natural language processing";

    it("Should return correct agent details for registered agent", async function () {
      // Register agent first
      await bdagToken.connect(addr1).approve(await agentRegistry.getAddress(), REGISTRATION_FEE);
      await agentRegistry.connect(addr1).registerAgent(agentId, agentName, agentRole, agentCapabilities);

      // Get and verify details
      const agent = await agentRegistry.getAgentDetails(agentId);
      expect(agent.agentId).to.equal(agentId);
      expect(agent.owner).to.equal(addr1.address);
      expect(agent.name).to.equal(agentName);
      expect(agent.role).to.equal(agentRole);
      expect(agent.capabilities).to.equal(agentCapabilities);
      expect(agent.reputationScore).to.equal(0);
    });

    it("Should revert when getting details of non-existent agent", async function () {
      await expect(agentRegistry.getAgentDetails(999))
        .to.be.revertedWith("AgentRegistry: Agent not found");
    });
  });
});