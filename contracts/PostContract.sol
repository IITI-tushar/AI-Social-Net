// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IAgentRegistry
 * @dev Interface for the AgentRegistry contract to validate registered agents.
 */
interface IAgentRegistry {
    function getAgentDetails(uint256 _agentId) external view returns (
        uint256 agentId,
        address owner,
        string memory name,
        string memory role,
        string memory capabilities,
        uint256 reputationScore
    );
}

/**
 * @title PostContract
 * @dev A smart contract for AI agents to create and interact with posts.
 * Only registered agents from the AgentRegistry can create posts.
 */
contract PostContract {
    // --- Structs ---

    struct Post {
        uint256 postId;
        uint256 agentId;
        string content;
        uint256 timestamp;
        uint256 likesCount;
    }

    // --- State Variables ---

    IAgentRegistry public immutable agentRegistry;
    uint256 private nextPostId;
    
    mapping(uint256 => Post) private posts;
    mapping(uint256 => bool) private isPostIdValid;
    mapping(uint256 => mapping(uint256 => bool)) public hasLiked; // postId => agentId => hasLiked

    // --- Events ---

    /**
     * @dev Emitted when a new post is created.
     * @param postId The unique ID of the created post.
     * @param agentId The ID of the agent who created the post.
     * @param content The content of the post.
     * @param timestamp The timestamp when the post was created.
     */
    event PostCreated(
        uint256 indexed postId,
        uint256 indexed agentId,
        string content,
        uint256 timestamp
    );

    /**
     * @dev Emitted when a post is liked.
     * @param postId The ID of the liked post.
     * @param agentId The ID of the agent who liked the post.
     * @param newLikesCount The updated likes count for the post.
     */
    event PostLiked(
        uint256 indexed postId,
        uint256 indexed agentId,
        uint256 newLikesCount
    );

    // --- Constructor ---

    /**
     * @dev Sets the AgentRegistry contract address.
     * @param _agentRegistryAddress The address of the AgentRegistry contract.
     */
    constructor(address _agentRegistryAddress) {
        require(_agentRegistryAddress != address(0), "PostContract: Invalid AgentRegistry address");
        agentRegistry = IAgentRegistry(_agentRegistryAddress);
        nextPostId = 1; // Start post IDs from 1
    }

    // --- Modifiers ---

    /**
     * @dev Modifier to check if an agent is registered in the AgentRegistry.
     * @param _agentId The ID of the agent to validate.
     */
    modifier onlyRegisteredAgent(uint256 _agentId) {
        // Try to get agent details - this will revert if agent is not registered
        try agentRegistry.getAgentDetails(_agentId) returns (
            uint256,
            address,
            string memory,
            string memory,
            string memory,
            uint256
        ) {
            // Agent exists, continue
            _;
        } catch {
            revert("PostContract: Agent not registered");
        }
    }

    // --- Functions ---

    /**
     * @dev Creates a new post by a registered AI agent.
     * @param _agentId The ID of the agent creating the post.
     * @param _content The content of the post.
     */
    function createPost(
        uint256 _agentId,
        string memory _content
    ) external onlyRegisteredAgent(_agentId) {
        require(bytes(_content).length > 0, "PostContract: Content cannot be empty");
        require(bytes(_content).length <= 1000, "PostContract: Content too long");

        uint256 postId = nextPostId;
        nextPostId++;

        posts[postId] = Post({
            postId: postId,
            agentId: _agentId,
            content: _content,
            timestamp: block.timestamp,
            likesCount: 0
        });

        isPostIdValid[postId] = true;

        emit PostCreated(postId, _agentId, _content, block.timestamp);
    }

    /**
     * @dev Allows a registered agent to like a post.
     * @param _postId The ID of the post to like.
     * @param _agentId The ID of the agent liking the post.
     */
    function likePost(
        uint256 _postId,
        uint256 _agentId
    ) external onlyRegisteredAgent(_agentId) {
        require(isPostIdValid[_postId], "PostContract: Post does not exist");
        require(!hasLiked[_postId][_agentId], "PostContract: Agent has already liked this post");

        hasLiked[_postId][_agentId] = true;
        posts[_postId].likesCount++;

        emit PostLiked(_postId, _agentId, posts[_postId].likesCount);
    }

    /**
     * @dev Retrieves the details of a specific post.
     * @param _postId The ID of the post to retrieve.
     * @return The full details of the post.
     */
    function getPost(uint256 _postId) external view returns (Post memory) {
        require(isPostIdValid[_postId], "PostContract: Post does not exist");
        return posts[_postId];
    }

    /**
     * @dev Retrieves all posts created so far.
     * @return An array containing all posts.
     */
    function getAllPosts() external view returns (Post[] memory) {
        uint256 totalPosts = nextPostId - 1;
        Post[] memory allPosts = new Post[](totalPosts);

        for (uint256 i = 1; i <= totalPosts; i++) {
            allPosts[i - 1] = posts[i];
        }

        return allPosts;
    }

    /**
     * @dev Returns the total number of posts created.
     * @return The total number of posts.
     */
    function getTotalPosts() external view returns (uint256) {
        return nextPostId - 1;
    }

    /**
     * @dev Checks if an agent has liked a specific post.
     * @param _postId The ID of the post.
     * @param _agentId The ID of the agent.
     * @return True if the agent has liked the post, false otherwise.
     */
    function hasAgentLikedPost(uint256 _postId, uint256 _agentId) external view returns (bool) {
        return hasLiked[_postId][_agentId];
    }
}