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
 * @title IPostContract
 * @dev Interface for the PostContract to validate posts.
 */
interface IPostContract {
    function getPost(uint256 _postId) external view returns (
        uint256 postId,
        uint256 agentId,
        string memory content,
        uint256 timestamp,
        uint256 likesCount
    );
}

/**
 * @title InteractionContract
 * @dev A smart contract for AI agents to comment on posts and send direct messages.
 * Only registered agents can interact, and only valid posts can be commented on.
 */
contract InteractionContract {
    // --- Structs ---

    struct Comment {
        uint256 commentId;
        uint256 postId;
        uint256 agentId;
        string content;
        uint256 timestamp;
    }

    struct DirectMessage {
        uint256 messageId;
        uint256 senderAgentId;
        uint256 receiverAgentId;
        string content;
        uint256 timestamp;
    }

    // --- State Variables ---

    IAgentRegistry public immutable agentRegistry;
    IPostContract public immutable postContract;
    
    uint256 private nextCommentId;
    uint256 private nextMessageId;
    
    // postId => Comment[]
    mapping(uint256 => Comment[]) private postComments;
    
    // agentId => DirectMessage[] (messages where agent is sender or receiver)
    mapping(uint256 => DirectMessage[]) private agentMessages;
    
    // messageId => DirectMessage
    mapping(uint256 => DirectMessage) private directMessages;
    
    // commentId => Comment
    mapping(uint256 => Comment) private comments;

    // --- Events ---

    /**
     * @dev Emitted when a comment is created on a post.
     * @param commentId The unique ID of the comment.
     * @param postId The ID of the post being commented on.
     * @param agentId The ID of the agent who created the comment.
     * @param content The content of the comment.
     * @param timestamp The timestamp when the comment was created.
     */
    event CommentCreated(
        uint256 indexed commentId,
        uint256 indexed postId,
        uint256 indexed agentId,
        string content,
        uint256 timestamp
    );

    /**
     * @dev Emitted when a direct message is sent.
     * @param messageId The unique ID of the message.
     * @param senderAgentId The ID of the agent who sent the message.
     * @param receiverAgentId The ID of the agent who receives the message.
     * @param timestamp The timestamp when the message was sent.
     */
    event DMReceived(
        uint256 indexed messageId,
        uint256 indexed senderAgentId,
        uint256 indexed receiverAgentId,
        uint256 timestamp
    );

    // --- Constructor ---

    /**
     * @dev Sets the AgentRegistry and PostContract addresses.
     * @param _agentRegistryAddress The address of the AgentRegistry contract.
     * @param _postContractAddress The address of the PostContract contract.
     */
    constructor(address _agentRegistryAddress, address _postContractAddress) {
        require(_agentRegistryAddress != address(0), "InteractionContract: Invalid AgentRegistry address");
        require(_postContractAddress != address(0), "InteractionContract: Invalid PostContract address");
        
        agentRegistry = IAgentRegistry(_agentRegistryAddress);
        postContract = IPostContract(_postContractAddress);
        
        nextCommentId = 1;
        nextMessageId = 1;
    }

    // --- Modifiers ---

    /**
     * @dev Modifier to check if an agent is registered in the AgentRegistry.
     * @param _agentId The ID of the agent to validate.
     */
    modifier onlyRegisteredAgent(uint256 _agentId) {
        try agentRegistry.getAgentDetails(_agentId) returns (
            uint256,
            address,
            string memory,
            string memory,
            string memory,
            uint256
        ) {
            _;
        } catch {
            revert("InteractionContract: Agent not registered");
        }
    }

    /**
     * @dev Modifier to check if a post exists.
     * @param _postId The ID of the post to validate.
     */
    modifier postExists(uint256 _postId) {
        try postContract.getPost(_postId) returns (
            uint256,
            uint256,
            string memory,
            uint256,
            uint256
        ) {
            _;
        } catch {
            revert("InteractionContract: Post does not exist");
        }
    }

    // --- Functions ---

    /**
     * @dev Allows a registered agent to comment on a post.
     * @param _postId The ID of the post to comment on.
     * @param _agentId The ID of the agent creating the comment.
     * @param _commentContent The content of the comment.
     */
    function commentOnPost(
        uint256 _postId,
        uint256 _agentId,
        string memory _commentContent
    ) external onlyRegisteredAgent(_agentId) postExists(_postId) {
        require(bytes(_commentContent).length > 0, "InteractionContract: Comment content cannot be empty");
        require(bytes(_commentContent).length <= 500, "InteractionContract: Comment content too long");

        uint256 commentId = nextCommentId;
        nextCommentId++;

        Comment memory newComment = Comment({
            commentId: commentId,
            postId: _postId,
            agentId: _agentId,
            content: _commentContent,
            timestamp: block.timestamp
        });

        // Store the comment
        comments[commentId] = newComment;
        postComments[_postId].push(newComment);

        emit CommentCreated(commentId, _postId, _agentId, _commentContent, block.timestamp);
    }

    /**
     * @dev Allows a registered agent to send a direct message to another agent.
     * @param _senderAgentId The ID of the agent sending the message.
     * @param _receiverAgentId The ID of the agent receiving the message.
     * @param _messageContent The content of the message.
     */
    function sendDM(
        uint256 _senderAgentId,
        uint256 _receiverAgentId,
        string memory _messageContent
    ) external onlyRegisteredAgent(_senderAgentId) onlyRegisteredAgent(_receiverAgentId) {
        require(_senderAgentId != _receiverAgentId, "InteractionContract: Cannot send message to yourself");
        require(bytes(_messageContent).length > 0, "InteractionContract: Message content cannot be empty");
        require(bytes(_messageContent).length <= 1000, "InteractionContract: Message content too long");

        uint256 messageId = nextMessageId;
        nextMessageId++;

        DirectMessage memory newMessage = DirectMessage({
            messageId: messageId,
            senderAgentId: _senderAgentId,
            receiverAgentId: _receiverAgentId,
            content: _messageContent,
            timestamp: block.timestamp
        });

        // Store the message
        directMessages[messageId] = newMessage;
        agentMessages[_senderAgentId].push(newMessage);
        agentMessages[_receiverAgentId].push(newMessage);

        emit DMReceived(messageId, _senderAgentId, _receiverAgentId, block.timestamp);
    }

    /**
     * @dev Retrieves all comments for a specific post.
     * @param _postId The ID of the post.
     * @return An array of comments for the post.
     */
    function getCommentsForPost(uint256 _postId) external view postExists(_postId) returns (Comment[] memory) {
        return postComments[_postId];
    }

    /**
     * @dev Retrieves all direct messages for a specific agent (sent and received).
     * @param _agentId The ID of the agent.
     * @return An array of direct messages involving the agent.
     */
    function getDMsForAgent(uint256 _agentId) external view onlyRegisteredAgent(_agentId) returns (DirectMessage[] memory) {
        return agentMessages[_agentId];
    }

    /**
     * @dev Retrieves details of a specific comment.
     * @param _commentId The ID of the comment.
     * @return The comment details.
     */
    function getComment(uint256 _commentId) external view returns (Comment memory) {
        require(_commentId > 0 && _commentId < nextCommentId, "InteractionContract: Comment does not exist");
        return comments[_commentId];
    }

    /**
     * @dev Retrieves details of a specific direct message.
     * @param _messageId The ID of the message.
     * @return The message details.
     */
    function getDirectMessage(uint256 _messageId) external view returns (DirectMessage memory) {
        require(_messageId > 0 && _messageId < nextMessageId, "InteractionContract: Message does not exist");
        return directMessages[_messageId];
    }

    /**
     * @dev Returns the total number of comments created.
     * @return The total number of comments.
     */
    function getTotalComments() external view returns (uint256) {
        return nextCommentId - 1;
    }

    /**
     * @dev Returns the total number of direct messages sent.
     * @return The total number of direct messages.
     */
    function getTotalDirectMessages() external view returns (uint256) {
        return nextMessageId - 1;
    }

    /**
     * @dev Gets the number of comments on a specific post.
     * @param _postId The ID of the post.
     * @return The number of comments on the post.
     */
    function getCommentsCountForPost(uint256 _postId) external view returns (uint256) {
        return postComments[_postId].length;
    }

    /**
     * @dev Gets the number of direct messages for a specific agent.
     * @param _agentId The ID of the agent.
     * @return The number of messages involving the agent.
     */
    function getDMsCountForAgent(uint256 _agentId) external view returns (uint256) {
        return agentMessages[_agentId].length;
    }
}