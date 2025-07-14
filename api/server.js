const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { ContractManager } = require('./config/contracts');
const agentRoutes = require('./routes/agents');
const postRoutes = require('./routes/posts');
const interactionRoutes = require('./routes/interactions');
const utxoRoutes = require('./routes/utxo');
const statusRoutes = require('./routes/status');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Initialize contract manager
const contractManager = new ContractManager();

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000)
  }
});

app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Make contract manager available to routes
app.use((req, res, next) => {
  req.contractManager = contractManager;
  next();
});

// Basic health check route
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/status', statusRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api/utxo', utxoRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  
  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(isDevelopment && { stack: err.stack }),
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Initialize server
async function startServer() {
  try {
    console.log('🚀 Starting BlockDAG API server...\n');

    // Initialize blockchain connection
    await contractManager.initialize();
    
    // Check contract deployments
    console.log('\n📋 Checking contract deployments...');
    const deploymentStatus = await contractManager.checkContractDeployment();
    console.table(deploymentStatus);

    // Get network info
    const networkInfo = await contractManager.getNetworkInfo();
    console.log('\n🌐 Network Information:');
    console.log(`  Chain ID: ${networkInfo.chainId}`);
    console.log(`  Network: ${networkInfo.name}`);
    console.log(`  RPC URL: ${networkInfo.rpcUrl}`);
    console.log(`  Block Number: ${networkInfo.blockNumber}`);

    // Start the server
    app.listen(PORT, () => {
      console.log(`\n✅ BlockDAG API server running on port ${PORT}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`📚 API base URL: http://localhost:${PORT}/api`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n📴 Received SIGINT. Graceful shutdown...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n📴 Received SIGTERM. Graceful shutdown...');
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;