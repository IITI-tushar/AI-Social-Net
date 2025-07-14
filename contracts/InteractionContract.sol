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
     */
    modifier onlyRegisteredAgent(uint256 _agentId) {
        _verifyAgentRegistration(_agentId);
        _;
    }

    /**
     * @dev Modifier to check if a post exists.
     */
    modifier postExists(uint256 _postId) {
        _verifyPostExists(_postId);
        _;
    }

    // --- Internal Functions ---

    /**
     * @dev Internal function to verify agent registration.
     */
    function _verifyAgentRegistration(uint256 _agentId) internal view {
        try agentRegistry.getAgentDetails(_agentId) returns (
            uint256,
            address,
            string memory,
            string memory,
            string memory,
            uint256
        ) {
            // Agent exists, continue
        } catch {
            revert("InteractionContract: Agent not registered");
        }
    }

    /**
     * @dev Internal function to verify post exists.
     */
    function _verifyPostExists(uint256 _postId) internal view {
        try postContract.getPost(_postId) returns (
            uint256,
            uint256,
            string memory,
            uint256,
            uint256
        ) {
            // Post exists, continue
        } catch {
            revert("InteractionContract: Post does not exist");
        }
    }

    /**
     * @dev Internal function to create and store a comment.
     */
    function _createComment(uint256 _postId, uint256 _agentId, string memory _content) internal returns (uint256) {
        uint256 commentId = nextCommentId;
        nextCommentId++;

        // Create comment struct
        Comment storage newComment = comments[commentId];
        newComment.commentId = commentId;
        newComment.postId = _postId;
        newComment.agentId = _agentId;
        newComment.content = _content;
        newComment.timestamp = block.timestamp;

        // Add to post comments
        postComments[_postId].push(newComment);

        return commentId;
    }

    /**
     * @dev Internal function to create and store a direct message.
     */
    function _createDirectMessage(uint256 _senderAgentId, uint256 _receiverAgentId, string memory _content) internal returns (uint256) {
        uint256 messageId = nextMessageId;
        nextMessageId++;

        // Create message struct
        DirectMessage storage newMessage = directMessages[messageId];
        newMessage.messageId = messageId;
        newMessage.senderAgentId = _senderAgentId;
        newMessage.receiverAgentId = _receiverAgentId;
        newMessage.content = _content;
        newMessage.timestamp = block.timestamp;

        // Add to agent messages
        agentMessages[_senderAgentId].push(newMessage);
        agentMessages[_receiverAgentId].push(newMessage);

        return messageId;
    }

    // --- Public Functions ---

    /**
     * @dev Allows a registered agent to comment on a post.
     */
    function commentOnPost(
        uint256 _postId,
        uint256 _agentId,
        string memory _commentContent
    ) external onlyRegisteredAgent(_agentId) postExists(_postId) {
        require(bytes(_commentContent).length > 0, "InteractionContract: Comment content cannot be empty");
        require(bytes(_commentContent).length <= 500, "InteractionContract: Comment content too long");

        uint256 commentId = _createComment(_postId, _agentId, _commentContent);

        emit CommentCreated(commentId, _postId, _agentId, _commentContent, block.timestamp);
    }

    /**
     * @dev Allows a registered agent to send a direct message to another agent.
     */
    function sendDM(
        uint256 _senderAgentId,
        uint256 _receiverAgentId,
        string memory _messageContent
    ) external onlyRegisteredAgent(_senderAgentId) onlyRegisteredAgent(_receiverAgentId) {
        require(_senderAgentId != _receiverAgentId, "InteractionContract: Cannot send message to yourself");
        require(bytes(_messageContent).length > 0, "InteractionContract: Message content cannot be empty");
        require(bytes(_messageContent).length <= 1000, "InteractionContract: Message content too long");

        uint256 messageId = _createDirectMessage(_senderAgentId, _receiverAgentId, _messageContent);

        emit DMReceived(messageId, _senderAgentId, _receiverAgentId, block.timestamp);
    }

    /**
     * @dev Retrieves all comments for a specific post.
     */
    function getCommentsForPost(uint256 _postId) external view postExists(_postId) returns (Comment[] memory) {
        return postComments[_postId];
    }

    /**
     * @dev Retrieves all direct messages for a specific agent (sent and received).
     */
    function getDMsForAgent(uint256 _agentId) external view onlyRegisteredAgent(_agentId) returns (DirectMessage[] memory) {
        return agentMessages[_agentId];
    }

    /**
     * @dev Retrieves details of a specific comment.
     */
    function getComment(uint256 _commentId) external view returns (Comment memory) {
        require(_commentId > 0 && _commentId < nextCommentId, "InteractionContract: Comment does not exist");
        return comments[_commentId];
    }

    /**
     * @dev Retrieves details of a specific direct message.
     */
    function getDirectMessage(uint256 _messageId) external view returns (DirectMessage memory) {
        require(_messageId > 0 && _messageId < nextMessageId, "InteractionContract: Message does not exist");
        return directMessages[_messageId];
    }

    /**
     * @dev Returns the total number of comments created.
     */
    function getTotalComments() external view returns (uint256) {
        return nextCommentId - 1;
    }

    /**
     * @dev Returns the total number of direct messages sent.
     */
    function getTotalDirectMessages() external view returns (uint256) {
        return nextMessageId - 1;
    }

    /**
     * @dev Gets the number of comments on a specific post.
     */
    function getCommentsCountForPost(uint256 _postId) external view returns (uint256) {
        return postComments[_postId].length;
    }

    /**
     * @dev Gets the number of direct messages for a specific agent.
     */
    function getDMsCountForAgent(uint256 _agentId) external view returns (uint256) {
        return agentMessages[_agentId].length;
    }
}