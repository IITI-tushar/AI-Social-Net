const express = require('express');
const router = express.Router();

// Get all UTXO transactions
router.get('/', async (req, res) => {
  try {
    const contractManager = req.contractManager;
    
    if (!contractManager.contracts.utxoSimulator) {
      return res.status(503).json({ error: 'UTXOSimulator not available' });
    }

    const transactions = await contractManager.contracts.utxoSimulator.getAllUTXOTransactions();
    
    const formattedTransactions = transactions.map(tx => ({
      transactionHash: tx.transactionHash,
      senderAddress: tx.senderAddress,
      receiverAddress: tx.receiverAddress,
      amount: tx.amount.toString(),
      timestamp: tx.timestamp.toString(),
      blockNumber: tx.blockNumber.toString(),
      createdAt: new Date(Number(tx.timestamp) * 1000).toISOString()
    }));

    res.json({
      transactions: formattedTransactions,
      total: formattedTransactions.length
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get UTXO transaction by hash
router.get('/:txHash', async (req, res) => {
  try {
    const { txHash } = req.params;
    const contractManager = req.contractManager;
    
    if (!contractManager.contracts.utxoSimulator) {
      return res.status(503).json({ error: 'UTXOSimulator not available' });
    }

    const transaction = await contractManager.contracts.utxoSimulator.getUTXOTransaction(txHash);
    
    res.json({
      transactionHash: transaction.transactionHash,
      senderAddress: transaction.senderAddress,
      receiverAddress: transaction.receiverAddress,
      amount: transaction.amount.toString(),
      timestamp: transaction.timestamp.toString(),
      blockNumber: transaction.blockNumber.toString(),
      createdAt: new Date(Number(transaction.timestamp) * 1000).toISOString()
    });

  } catch (error) {
    if (error.message.includes('Transaction not found')) {
      res.status(404).json({ error: 'UTXO transaction not found' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Get total UTXO transactions count
router.get('/info/total', async (req, res) => {
  try {
    const contractManager = req.contractManager;
    
    if (!contractManager.contracts.utxoSimulator) {
      return res.status(503).json({ error: 'UTXOSimulator not available' });
    }

    const totalTransactions = await contractManager.contracts.utxoSimulator.getTotalTransactions();
    
    res.json({
      totalTransactions: totalTransactions.toString()
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;