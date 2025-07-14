
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IERC20
 * @dev Interface for the ERC20 token standard.
 */
interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
}

/**
 * @title AgentRegistry
 * @dev A smart contract for registering AI agents on the blockchain.
 * Registration requires a fee in BDAG tokens.
 */
contract AgentRegistry {
    // --- Structs ---

    struct Agent {
        uint256 agentId;
        address owner;
        string name;
        string role;
        string capabilities;
        uint256 reputationScore;
    }

    // --- State Variables ---

    IERC20 public immutable bdagToken;
    uint256 public constant REGISTRATION_FEE = 10 * 10**18; // 10 BDAG with 18 decimals

    mapping(uint256 => Agent) private agents;
    mapping(uint256 => bool) private isAgentIdRegistered;

    // --- Events ---

    /**
     * @dev Emitted when a new agent is successfully registered.
     * @param agentId The unique ID of the registered agent.
     * @param owner The address of the agent's owner.
     * @param name The name of the agent.
     * @param bdagAmountPaid The amount of BDAG tokens paid for registration.
     */
    event AgentRegistered(
        uint256 indexed agentId,
        address indexed owner,
        string name,
        uint256 bdagAmountPaid
    );

    // --- Constructor ---

    /**
     * @dev Sets the BDAG token address.
     * @param _bdagTokenAddress The address of the BDAG ERC20 token contract.
     */
    constructor(address _bdagTokenAddress) {
        require(_bdagTokenAddress != address(0), "AgentRegistry: Invalid BDAG token address");
        bdagToken = IERC20(_bdagTokenAddress);
    }

    // --- Functions ---

    /**
     * @dev Registers a new AI agent.
     * The caller must approve the contract to spend REGISTRATION_FEE BDAG tokens beforehand.
     * @param _agentId A unique identifier for the agent.
     * @param _name The name of the agent.
     * @param _role The designated role of the agent.
     * @param _capabilities A description of the agent's capabilities.
     */
    function registerAgent(
        uint256 _agentId,
        string memory _name,
        string memory _role,
        string memory _capabilities
    ) external {
        // Check for registration requirements
        require(!isAgentIdRegistered[_agentId], "AgentRegistry: Agent ID already registered");
        
        uint256 allowance = bdagToken.allowance(msg.sender, address(this));
        require(allowance >= REGISTRATION_FEE, "AgentRegistry: Insufficient BDAG allowance. Please approve the contract to spend tokens.");

        // Transfer the registration fee
        bool success = bdagToken.transferFrom(msg.sender, address(this), REGISTRATION_FEE);
        require(success, "AgentRegistry: BDAG transfer failed");

        // Create and store the new agent
        agents[_agentId] = Agent({
            agentId: _agentId,
            owner: msg.sender,
            name: _name,
            role: _role,
            capabilities: _capabilities,
            reputationScore: 0 // Initial reputation score
        });

        isAgentIdRegistered[_agentId] = true;

        // Emit the registration event
        emit AgentRegistered(_agentId, msg.sender, _name, REGISTRATION_FEE);
    }

    /**
     * @dev Retrieves the details of a registered agent.
     * @param _agentId The ID of the agent to look up.
     * @return The full details of the agent.
     */
    function getAgentDetails(uint256 _agentId) external view returns (Agent memory) {
        require(isAgentIdRegistered[_agentId], "AgentRegistry: Agent not found");
        return agents[_agentId];
    }
}
