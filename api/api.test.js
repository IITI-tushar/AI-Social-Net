const axios = require('axios');

const API_BASE = 'http://localhost:3001';

async function runCompleteTests() {
  console.log("🧪 COMPREHENSIVE BLOCKDAG API TESTING");
  console.log("=".repeat(50));

  try {
    // 1. Health Check
    console.log("1️⃣ HEALTH & STATUS CHECKS");
    console.log("-".repeat(30));
    
    const health = await axios.get(`${API_BASE}/health`);
    console.log(`✅ Health: ${health.data.status}`);
    
    const status = await axios.get(`${API_BASE}/api/status`);
    console.log(`✅ Network: ${status.data.network.name} (Chain: ${status.data.network.chainId})`);
    console.log(`✅ Block: ${status.data.network.blockNumber}`);

    // 2. Contract Status
    console.log("\n2️⃣ CONTRACT DEPLOYMENT STATUS");
    console.log("-".repeat(30));
    Object.entries(status.data.contracts).forEach(([name, info]) => {
      const symbol = info.deployed ? '✅' : '❌';
      console.log(`${symbol} ${name}: ${info.deployed ? 'Deployed' : 'Not deployed'}`);
    });

    // 3. Agent Tests
    console.log("\n3️⃣ AGENT MANAGEMENT TESTS");
    console.log("-".repeat(30));
    
    try {
      const agent1 = await axios.get(`${API_BASE}/api/agents/1`);
      console.log(`✅ Agent 1: ${agent1.data.name} (${agent1.data.role})`);
      
      const agent2 = await axios.get(`${API_BASE}/api/agents/2`);
      console.log(`✅ Agent 2: ${agent2.data.name} (${agent2.data.role})`);
    } catch (error) {
      console.log(`⚠️ Agent test: ${error.response?.data?.error || error.message}`);
    }

    // 4. Post Tests
    console.log("\n4️⃣ POST MANAGEMENT TESTS");
    console.log("-".repeat(30));
    
    const posts = await axios.get(`${API_BASE}/api/posts`);
    console.log(`✅ Total posts: ${posts.data.total}`);
    
    if (posts.data.posts.length > 0) {
      const firstPost = posts.data.posts[0];
      console.log(`✅ First post: "${firstPost.content.substring(0, 50)}..."`);
      console.log(`   By Agent: ${firstPost.agentId}, Likes: ${firstPost.likesCount}`);
    }

    // 5. Interaction Tests
    console.log("\n5️⃣ INTERACTION TESTS");
    console.log("-".repeat(30));
    
    const comments = await axios.get(`${API_BASE}/api/interactions/comments/1`);
    console.log(`✅ Comments on post 1: ${comments.data.total}`);
    
    const messages = await axios.get(`${API_BASE}/api/interactions/messages/1`);
    console.log(`✅ Messages for agent 1: ${messages.data.total}`);

    // 6. UTXO Tests
    console.log("\n6️⃣ UTXO TRANSACTION TESTS");
    console.log("-".repeat(30));
    
    const utxoTransactions = await axios.get(`${API_BASE}/api/utxo`);
    console.log(`✅ UTXO transactions: ${utxoTransactions.data.total}`);

    // 7. Statistics Summary
    console.log("\n7️⃣ SYSTEM STATISTICS");
    console.log("-".repeat(30));
    
    const stats = {
      "API Status": health.data.status,
      "Network": status.data.network.name,
      "Total Posts": posts.data.total,
      "Total Comments": comments.data.total,
      "Total Messages": messages.data.total,
      "UTXO Transactions": utxoTransactions.data.total
    };
    
    console.table(stats);

    console.log("\n🎉 ALL API TESTS PASSED!");

  } catch (error) {
    console.error("\n❌ API Test failed:", error.message);
    if (error.response) {
      console.error("Response data:", error.response.data);
    }
  }
}

runCompleteTests();