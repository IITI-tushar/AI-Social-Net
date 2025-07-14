const express = require('express');
const { ethers } = require('ethers');
const router = express.Router();

// Get agent details
router.get('/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const contractManager = req.contractManager;
    
    if (!contractManager.contracts.agentRegistry) {
      return res.status(503).json({ error: 'AgentRegistry contract not available' });
    }

    const agent = await contractManager.contracts.agentRegistry.getAgentDetails(agentId);
    
    res.json({
      agentId: agent.agentId.toString(),
      owner: agent.owner,
      name: agent.name,
      role: agent.role,
      capabilities: agent.capabilities,
      reputationScore: agent.reputationScore.toString()
    });

  } catch (error) {
    if (error.message.includes('Agent not found')) {
      res.status(404).json({ error: 'Agent not found' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Get registration fee
router.get('/info/registration-fee', async (req, res) => {
  try {
    const contractManager = req.contractManager;
    
    if (!contractManager.contracts.agentRegistry) {
      return res.status(503).json({ error: 'AgentRegistry contract not available' });
    }

    const registrationFee = await contractManager.contracts.agentRegistry.REGISTRATION_FEE();
    
    res.json({
      registrationFee: registrationFee.toString(),
      registrationFeeFormatted: ethers.formatUnits(registrationFee, 18) + ' BDAG'
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;