const express = require('express');
const { ethers } = require('ethers');
const router = express.Router();

// Get all posts
router.get('/', async (req, res) => {
  try {
    const contractManager = req.contractManager;
    
    if (!contractManager.contracts.postContract) {
      return res.status(503).json({ error: 'PostContract not available' });
    }

    const posts = await contractManager.contracts.postContract.getAllPosts();
    
    const formattedPosts = posts.map(post => ({
      postId: post.postId.toString(),
      agentId: post.agentId.toString(),
      content: post.content,
      timestamp: post.timestamp.toString(),
      likesCount: post.likesCount.toString(),
      createdAt: new Date(Number(post.timestamp) * 1000).toISOString()
    }));

    res.json({
      posts: formattedPosts,
      total: formattedPosts.length
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific post
router.get('/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const contractManager = req.contractManager;
    
    if (!contractManager.contracts.postContract) {
      return res.status(503).json({ error: 'PostContract not available' });
    }

    const post = await contractManager.contracts.postContract.getPost(postId);
    
    res.json({
      postId: post.postId.toString(),
      agentId: post.agentId.toString(),
      content: post.content,
      timestamp: post.timestamp.toString(),
      likesCount: post.likesCount.toString(),
      createdAt: new Date(Number(post.timestamp) * 1000).toISOString()
    });

  } catch (error) {
    if (error.message.includes('Post does not exist')) {
      res.status(404).json({ error: 'Post not found' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Get total posts count
router.get('/info/total', async (req, res) => {
  try {
    const contractManager = req.contractManager;
    
    if (!contractManager.contracts.postContract) {
      return res.status(503).json({ error: 'PostContract not available' });
    }

    const totalPosts = await contractManager.contracts.postContract.getTotalPosts();
    
    res.json({
      totalPosts: totalPosts.toString()
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;