const { ethers } = require('ethers');
require('dotenv').config();

// Contract ABIs (simplified versions - you can get full ABIs from compilation artifacts)
const AGENT_REGISTRY_ABI = [
  "function registerAgent(uint256 _agentId, string memory _name, string memory _role, string memory _capabilities) external",
  "function getAgentDetails(uint256 _agentId) external view returns (tuple(uint256 agentId, address owner, string name, string role, string capabilities, uint256 reputationScore))",
  "function REGISTRATION_FEE() external view returns (uint256)",
  "event AgentRegistered(uint256 indexed agentId, address indexed owner, string name, uint256 bdagAmountPaid)"
];

const POST_CONTRACT_ABI = [
  "function createPost(uint256 _agentId, string memory _content) external",
  "function likePost(uint256 _postId, uint256 _agentId) external",
  "function getPost(uint256 _postId) external view returns (tuple(uint256 postId, uint256 agentId, string content, uint256 timestamp, uint256 likesCount))",
  "function getAllPosts() external view returns (tuple(uint256 postId, uint256 agentId, string content, uint256 timestamp, uint256 likesCount)[])",
  "function getTotalPosts() external view returns (uint256)",
  "function hasAgentLikedPost(uint256 _postId, uint256 _agentId) external view returns (bool)",
  "event PostCreated(uint256 indexed postId, uint256 indexed agentId, string content, uint256 timestamp)",
  "event PostLiked(uint256 indexed postId, uint256 indexed agentId, uint256 newLikesCount)"
];

const INTERACTION_CONTRACT_ABI = [
  "function commentOnPost(uint256 _postId, uint256 _agentId, string memory _commentContent) external",
  "function sendDM(uint256 _senderAgentId, uint256 _receiverAgentId, string memory _messageContent) external",
  "function getCommentsForPost(uint256 _postId) external view returns (tuple(uint256 commentId, uint256 postId, uint256 agentId, string content, uint256 timestamp)[])",
  "function getDMsForAgent(uint256 _agentId) external view returns (tuple(uint256 messageId, uint256 senderAgentId, uint256 receiverAgentId, string content, uint256 timestamp)[])",
  "function getTotalComments() external view returns (uint256)",
  "function getTotalDirectMessages() external view returns (uint256)",
  "event CommentCreated(uint256 indexed commentId, uint256 indexed postId, uint256 indexed agentId, string content, uint256 timestamp)",
  "event DMReceived(uint256 indexed messageId, uint256 indexed senderAgentId, uint256 indexed receiverAgentId, uint256 timestamp)"
];

const UTXO_SIMULATOR_ABI = [
  "function recordUTXOTransaction(bytes32 _transactionHash, address _senderAddress, address _receiverAddress, uint256 _amount) external",
  "function getUTXOTransaction(bytes32 _transactionHash) external view returns (tuple(bytes32 transactionHash, address senderAddress, address receiverAddress, uint256 amount, uint256 timestamp, uint256 blockNumber))",
  "function getAllUTXOTransactions() external view returns (tuple(bytes32 transactionHash, address senderAddress, address receiverAddress, uint256 amount, uint256 timestamp, uint256 blockNumber)[])",
  "function getTotalTransactions() external view returns (uint256)",
  "event UTXOTransactionRecorded(bytes32 indexed transactionHash, address indexed senderAddress, address indexed receiverAddress, uint256 amount, uint256 timestamp, uint256 blockNumber)"
];

const MOCK_ERC20_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function approve(address spender, uint256 value) external returns (bool)",
  "function transfer(address to, uint256 value) external returns (bool)",
  "function transferFrom(address from, address to, uint256 value) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function totalSupply() external view returns (uint256)",
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)"
];

class ContractManager {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contracts = {};
    this.addresses = {
      mockBDAG: process.env.MOCK_BDAG_ADDRESS,
      agentRegistry: process.env.AGENT_REGISTRY_ADDRESS,
      postContract: process.env.POST_CONTRACT_ADDRESS,
      interactionContract: process.env.INTERACTION_CONTRACT_ADDRESS,
      utxoSimulator: process.env.UTXO_SIMULATOR_ADDRESS
    };
  }

  async initialize() {
    try {
      // Set up provider
      this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
      
      // Set up signer
      if (process.env.DEPLOYER_PRIVATE_KEY) {
        this.signer = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, this.provider);
      }

      // Initialize contract instances
      await this.initializeContracts();
      
      console.log('✅ Contract manager initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize contract manager:', error);
      throw error;
    }
  }

  async initializeContracts() {
    const contractConfigs = [
      { name: 'mockBDAG', address: this.addresses.mockBDAG, abi: MOCK_ERC20_ABI },
      { name: 'agentRegistry', address: this.addresses.agentRegistry, abi: AGENT_REGISTRY_ABI },
      { name: 'postContract', address: this.addresses.postContract, abi: POST_CONTRACT_ABI },
      { name: 'interactionContract', address: this.addresses.interactionContract, abi: INTERACTION_CONTRACT_ABI },
      { name: 'utxoSimulator', address: this.addresses.utxoSimulator, abi: UTXO_SIMULATOR_ABI }
    ];

    for (const config of contractConfigs) {
      if (config.address && config.address !== '0x0000000000000000000000000000000000000000') {
        try {
          this.contracts[config.name] = new ethers.Contract(
            config.address,
            config.abi,
            this.signer || this.provider
          );
          console.log(`📄 ${config.name} contract loaded at ${config.address}`);
        } catch (error) {
          console.warn(`⚠️ Failed to load ${config.name} contract:`, error.message);
        }
      } else {
        console.warn(`⚠️ No address configured for ${config.name}`);
      }
    }
  }

  getContract(name) {
    if (!this.contracts[name]) {
      throw new Error(`Contract ${name} not initialized`);
    }
    return this.contracts[name];
  }

  async getNetworkInfo() {
    try {
      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();
      
      return {
        chainId: network.chainId.toString(),
        name: network.name,
        blockNumber,
        rpcUrl: process.env.RPC_URL
      };
    } catch (error) {
      console.error('Failed to get network info:', error);
      throw error;
    }
  }

  async checkContractDeployment() {
    const results = {};
    
    for (const [name, address] of Object.entries(this.addresses)) {
      if (address && address !== '0x0000000000000000000000000000000000000000') {
        try {
          const code = await this.provider.getCode(address);
          results[name] = {
            address,
            deployed: code !== '0x',
            hasContract: this.contracts[name] !== undefined
          };
        } catch (error) {
          results[name] = {
            address,
            deployed: false,
            error: error.message
          };
        }
      } else {
        results[name] = {
          address: 'Not configured',
          deployed: false
        };
      }
    }
    
    return results;
  }
}

module.exports = {
  ContractManager,
  AGENT_REGISTRY_ABI,
  POST_CONTRACT_ABI,
  INTERACTION_CONTRACT_ABI,
  UTXO_SIMULATOR_ABI,
  MOCK_ERC20_ABI
};