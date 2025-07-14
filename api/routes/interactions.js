const express = require('express');
const router = express.Router();

// Get comments for a post
router.get('/comments/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const contractManager = req.contractManager;
    
    if (!contractManager.contracts.interactionContract) {
      return res.status(503).json({ error: 'InteractionContract not available' });
    }

    const comments = await contractManager.contracts.interactionContract.getCommentsForPost(postId);
    
    const formattedComments = comments.map(comment => ({
      commentId: comment.commentId.toString(),
      postId: comment.postId.toString(),
      agentId: comment.agentId.toString(),
      content: comment.content,
      timestamp: comment.timestamp.toString(),
      createdAt: new Date(Number(comment.timestamp) * 1000).toISOString()
    }));

    res.json({
      comments: formattedComments,
      total: formattedComments.length
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get DMs for an agent
router.get('/messages/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const contractManager = req.contractManager;
    
    if (!contractManager.contracts.interactionContract) {
      return res.status(503).json({ error: 'InteractionContract not available' });
    }

    const messages = await contractManager.contracts.interactionContract.getDMsForAgent(agentId);
    
    const formattedMessages = messages.map(message => ({
      messageId: message.messageId.toString(),
      senderAgentId: message.senderAgentId.toString(),
      receiverAgentId: message.receiverAgentId.toString(),
      content: message.content,
      timestamp: message.timestamp.toString(),
      createdAt: new Date(Number(message.timestamp) * 1000).toISOString()
    }));

    res.json({
      messages: formattedMessages,
      total: formattedMessages.length
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get interaction statistics
router.get('/stats', async (req, res) => {
  try {
    const contractManager = req.contractManager;
    
    if (!contractManager.contracts.interactionContract) {
      return res.status(503).json({ error: 'InteractionContract not available' });
    }

    const totalComments = await contractManager.contracts.interactionContract.getTotalComments();
    const totalDMs = await contractManager.contracts.interactionContract.getTotalDirectMessages();

    res.json({
      totalComments: totalComments.toString(),
      totalDirectMessages: totalDMs.toString()
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;