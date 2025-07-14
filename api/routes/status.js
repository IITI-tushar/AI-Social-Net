const express = require('express');
const router = express.Router();

// Get blockchain and contract status
router.get('/', async (req, res) => {
  try {
    const contractManager = req.contractManager;
    
    // Get network info
    const networkInfo = await contractManager.getNetworkInfo();
    
    // Check contract deployments
    const deploymentStatus = await contractManager.checkContractDeployment();
    
    // Get contract statistics if available
    const stats = {};
    
    try {
      if (contractManager.contracts.agentRegistry) {
        // Example: Get registration fee
        const registrationFee = await contractManager.contracts.agentRegistry.REGISTRATION_FEE();
        stats.registrationFee = registrationFee.toString();
      }
      
      if (contractManager.contracts.postContract) {
        const totalPosts = await contractManager.contracts.postContract.getTotalPosts();
        stats.totalPosts = totalPosts.toString();
      }
      
      if (contractManager.contracts.interactionContract) {
        const totalComments = await contractManager.contracts.interactionContract.getTotalComments();
        const totalDMs = await contractManager.contracts.interactionContract.getTotalDirectMessages();
        stats.totalComments = totalComments.toString();
        stats.totalDirectMessages = totalDMs.toString();
      }
      
      if (contractManager.contracts.utxoSimulator) {
        const totalUTXOTxs = await contractManager.contracts.utxoSimulator.getTotalTransactions();
        stats.totalUTXOTransactions = totalUTXOTxs.toString();
      }
      
    } catch (statsError) {
      console.warn('Could not fetch contract statistics:', statsError.message);
    }

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      network: networkInfo,
      contracts: deploymentStatus,
      statistics: stats
    });

  } catch (error) {
    console.error('Status check failed:', error);
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get specific contract status
router.get('/contracts/:contractName', async (req, res) => {
  try {
    const { contractName } = req.params;
    const contractManager = req.contractManager;
    
    const deploymentStatus = await contractManager.checkContractDeployment();
    
    if (!deploymentStatus[contractName]) {
      return res.status(404).json({
        error: 'Contract not found',
        availableContracts: Object.keys(deploymentStatus)
      });
    }

    res.json({
      contract: contractName,
      status: deploymentStatus[contractName],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;