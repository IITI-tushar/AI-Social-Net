// const { ethers } = require("hardhat");

// async function main() {
//   console.log("🔍 DEBUGGING POST CONTRACT ISSUE");
//   console.log("=".repeat(50));

//   const [deployer] = await ethers.getSigners();
//   console.log("👤 Deployer address:", deployer.address);

//   // Use the addresses from your deployment
//   const mockBDAGAddress = "0x3Aa5ebB10DC797CAC828524e59A333d0A371443c";
//   const agentRegistryAddress = "0xc6e7DF5E7b4f2A278906862b61205850344D4e7d";
//   const postContractAddress = "0x59b670e9fA9D0A427751Af201D676719a970857b";

//   // Get contract instances
//   const mockBDAG = await ethers.getContractAt("MockERC20", mockBDAGAddress);
//   const agentRegistry = await ethers.getContractAt("AgentRegistry", agentRegistryAddress);
//   const postContract = await ethers.getContractAt("PostContract", postContractAddress);

//   try {
//     console.log("\n🔍 Checking agent registration...");
    
//     // Check if agent 1 is registered
//     try {
//       const agent1 = await agentRegistry.getAgentDetails(1);
//       console.log("✅ Agent 1 found:");
//       console.log(`  ID: ${agent1.agentId}`);
//       console.log(`  Name: ${agent1.name}`);
//       console.log(`  Owner: ${agent1.owner}`);
//       console.log(`  Role: ${agent1.role}`);
//     } catch (error) {
//       console.log("❌ Agent 1 not found:", error.message);
//       return;
//     }

//     // Check if agent 2 is registered
//     try {
//       const agent2 = await agentRegistry.getAgentDetails(2);
//       console.log("✅ Agent 2 found:");
//       console.log(`  ID: ${agent2.agentId}`);
//       console.log(`  Name: ${agent2.name}`);
//       console.log(`  Owner: ${agent2.owner}`);
//       console.log(`  Role: ${agent2.role}`);
//     } catch (error) {
//       console.log("❌ Agent 2 not found:", error.message);
//       return;
//     }

//     console.log("\n🔍 Testing post creation...");
    
//     // Try to create a simple post
//     const postContent = "Test post from Agent 1";
//     console.log(`📝 Attempting to create post: "${postContent}"`);
    
//     // Estimate gas first
//     try {
//       const gasEstimate = await postContract.createPost.estimateGas(1, postContent);
//       console.log(`⛽ Gas estimate: ${gasEstimate.toString()}`);
//     } catch (gasError) {
//       console.log("❌ Gas estimation failed:", gasError.message);
      
//       // Try to call the function statically to see the revert reason
//       try {
//         await postContract.createPost.staticCall(1, postContent);
//       } catch (staticError) {
//         console.log("❌ Static call failed:", staticError.message);
//         console.log("Full error:", staticError);
//         return;
//       }
//     }

//     // If gas estimation worked, try the actual transaction
//     const tx = await postContract.createPost(1, postContent);
//     console.log("🔄 Transaction sent:", tx.hash);
    
//     const receipt = await tx.wait();
//     console.log("✅ Transaction confirmed in block:", receipt.blockNumber);

//   } catch (error) {
//     console.error("❌ Debug failed:", error);
//   }
// }

// main().catch(console.error);

const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 ADVANCED DEBUGGING - STEP BY STEP ANALYSIS");
  console.log("=".repeat(60));

  const [deployer] = await ethers.getSigners();
  console.log("👤 Deployer address:", deployer.address);

  // Contract addresses from your deployment
  const mockBDAGAddress = "0x3Aa5ebB10DC797CAC828524e59A333d0A371443c";
  const agentRegistryAddress = "0xc6e7DF5E7b4f2A278906862b61205850344D4e7d";
  const postContractAddress = "0x59b670e9fA9D0A427751Af201D676719a970857b";

  // Get contract instances
  const mockBDAG = await ethers.getContractAt("MockERC20", mockBDAGAddress);
  const agentRegistry = await ethers.getContractAt("AgentRegistry", agentRegistryAddress);
  const postContract = await ethers.getContractAt("PostContract", postContractAddress);

  try {
    console.log("\n1️⃣ CHECKING CONTRACT CONNECTIONS");
    console.log("-".repeat(40));
    
    // Check if PostContract can see AgentRegistry
    const postContractAgentRegistry = await postContract.agentRegistry();
    console.log(`PostContract's AgentRegistry address: ${postContractAgentRegistry}`);
    console.log(`Expected AgentRegistry address: ${agentRegistryAddress}`);
    console.log(`Addresses match: ${postContractAgentRegistry.toLowerCase() === agentRegistryAddress.toLowerCase()}`);

    console.log("\n2️⃣ TESTING AGENT REGISTRY DIRECTLY");
    console.log("-".repeat(40));
    
    // Test calling AgentRegistry directly
    const agent1Details = await agentRegistry.getAgentDetails(1);
    console.log("✅ Direct call to AgentRegistry works:");
    console.log(`  Agent ID: ${agent1Details.agentId}`);
    console.log(`  Name: ${agent1Details.name}`);
    console.log(`  Owner: ${agent1Details.owner}`);

    console.log("\n3️⃣ TESTING POSTCONTRACT INTERNAL CALLS");
    console.log("-".repeat(40));
    
    // Test if PostContract has the debug function
    try {
      const hasDebugFunction = await postContract.isAgentRegistered(1);
      console.log(`✅ PostContract.isAgentRegistered(1): ${hasDebugFunction}`);
    } catch (error) {
      console.log("❌ PostContract doesn't have isAgentRegistered function");
      console.log("This means we need to add it to the contract");
    }

    console.log("\n4️⃣ MANUAL AGENT VALIDATION TEST");
    console.log("-".repeat(40));
    
    // Try to manually call the agent registry from PostContract's perspective
    try {
      // Create a simple contract call to test the interface
      const agentRegistryFromPost = await ethers.getContractAt("IAgentRegistry", agentRegistryAddress);
      const agentFromInterface = await agentRegistryFromPost.getAgentDetails(1);
      console.log("✅ Interface call works:");
      console.log(`  Agent ID: ${agentFromInterface.agentId}`);
    } catch (error) {
      console.log("❌ Interface call failed:", error.message);
    }

    console.log("\n5️⃣ CHECKING FUNCTION SIGNATURES");
    console.log("-".repeat(40));
    
    // Get the function signatures
    const agentRegistryInterface = agentRegistry.interface;
    const getAgentDetailsFragment = agentRegistryInterface.getFunction("getAgentDetails");
    console.log(`AgentRegistry.getAgentDetails signature: ${getAgentDetailsFragment.format()}`);

    // Check if the interface in PostContract matches
    console.log("\nExpected interface in PostContract:");
    console.log("function getAgentDetails(uint256 _agentId) external view returns (uint256 agentId, address owner, string memory name, string memory role, string memory capabilities, uint256 reputationScore)");

    console.log("\n6️⃣ GAS SIMULATION TEST");
    console.log("-".repeat(40));
    
    // Let's try to simulate just the modifier part
    try {
      // Try to manually encode and call
      const postContractWithSigner = postContract.connect(deployer);
      
      // Try a dry run with callStatic
      console.log("Attempting dry run of createPost...");
      await postContractWithSigner.createPost.staticCall(1, "Test post");
      console.log("✅ Dry run succeeded!");
      
    } catch (error) {
      console.log("❌ Dry run failed with error:");
      console.log(error);
      
      // Try to decode the error
      if (error.data) {
        try {
          const decodedError = postContract.interface.parseError(error.data);
          console.log("Decoded error:", decodedError);
        } catch (decodeError) {
          console.log("Could not decode error data");
        }
      }
    }

  } catch (error) {
    console.error("❌ Advanced debug failed:", error);
  }
}

main().catch(console.error);