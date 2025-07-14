const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("UTXOSimulator", function () {
  let utxoSimulator;
  let deployer, addr1, addr2;

  beforeEach(async function () {
    [deployer, addr1, addr2] = await ethers.getSigners();

    // Deploy UTXOSimulator
    const UTXOSimulator = await ethers.getContractFactory("UTXOSimulator");
    utxoSimulator = await UTXOSimulator.deploy();
    await utxoSimulator.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should initialize with zero transactions", async function () {
      expect(await utxoSimulator.getTotalTransactions()).to.equal(0);
    });
  });

  describe("Recording UTXO Transactions", function () {
    const txHash = ethers.keccak256(ethers.toUtf8Bytes("test_transaction"));
    const amount = ethers.parseUnits("100", 18);

    it("Should record a UTXO transaction successfully", async function () {
      await expect(
        utxoSimulator.recordUTXOTransaction(txHash, addr1.address, addr2.address, amount)
      ).to.emit(utxoSimulator, "UTXOTransactionRecorded")
        .withArgs(txHash, addr1.address, addr2.address, amount, await ethers.provider.getBlock('latest').then(b => b.timestamp + 1), await ethers.provider.getBlock('latest').then(b => b.number + 1));

      expect(await utxoSimulator.getTotalTransactions()).to.equal(1);
      expect(await utxoSimulator.isTransactionHashRecorded(txHash)).to.be.true;
    });

    it("Should revert for empty transaction hash", async function () {
      await expect(
        utxoSimulator.recordUTXOTransaction(ethers.ZeroHash, addr1.address, addr2.address, amount)
      ).to.be.revertedWith("UTXOSimulator: Transaction hash cannot be empty");
    });

    it("Should revert for zero sender address", async function () {
      await expect(
        utxoSimulator.recordUTXOTransaction(txHash, ethers.ZeroAddress, addr2.address, amount)
      ).to.be.revertedWith("UTXOSimulator: Sender address cannot be zero");
    });

    it("Should revert for zero receiver address", async function () {
      await expect(
        utxoSimulator.recordUTXOTransaction(txHash, addr1.address, ethers.ZeroAddress, amount)
      ).to.be.revertedWith("UTXOSimulator: Receiver address cannot be zero");
    });

    it("Should revert for zero amount", async function () {
      await expect(
        utxoSimulator.recordUTXOTransaction(txHash, addr1.address, addr2.address, 0)
      ).to.be.revertedWith("UTXOSimulator: Amount must be greater than zero");
    });

    it("Should revert for duplicate transaction hash", async function () {
      await utxoSimulator.recordUTXOTransaction(txHash, addr1.address, addr2.address, amount);
      
      await expect(
        utxoSimulator.recordUTXOTransaction(txHash, addr2.address, addr1.address, amount)
      ).to.be.revertedWith("UTXOSimulator: Transaction already recorded");
    });
  });

  describe("Retrieving UTXO Transactions", function () {
    const txHash1 = ethers.keccak256(ethers.toUtf8Bytes("test_transaction_1"));
    const txHash2 = ethers.keccak256(ethers.toUtf8Bytes("test_transaction_2"));
    const amount1 = ethers.parseUnits("100", 18);
    const amount2 = ethers.parseUnits("200", 18);

    beforeEach(async function () {
      await utxoSimulator.recordUTXOTransaction(txHash1, addr1.address, addr2.address, amount1);
      await utxoSimulator.recordUTXOTransaction(txHash2, addr2.address, addr1.address, amount2);
    });

    it("Should retrieve transaction by hash", async function () {
      const tx = await utxoSimulator.getUTXOTransaction(txHash1);
      expect(tx.transactionHash).to.equal(txHash1);
      expect(tx.senderAddress).to.equal(addr1.address);
      expect(tx.receiverAddress).to.equal(addr2.address);
      expect(tx.amount).to.equal(amount1);
    });

    it("Should retrieve transaction by index", async function () {
      const tx = await utxoSimulator.getUTXOTransactionByIndex(0);
      expect(tx.transactionHash).to.equal(txHash1);
      expect(tx.amount).to.equal(amount1);
    });

    it("Should retrieve all transactions", async function () {
      const allTxs = await utxoSimulator.getAllUTXOTransactions();
      expect(allTxs.length).to.equal(2);
      expect(allTxs[0].transactionHash).to.equal(txHash1);
      expect(allTxs[1].transactionHash).to.equal(txHash2);
    });

    it("Should retrieve transactions by address", async function () {
      const txsForAddr1 = await utxoSimulator.getTransactionsByAddress(addr1.address);
      expect(txsForAddr1.length).to.equal(2); // addr1 is in both transactions
      
      const txsForAddr2 = await utxoSimulator.getTransactionsByAddress(addr2.address);
      expect(txsForAddr2.length).to.equal(2); // addr2 is in both transactions
    });

    it("Should handle pagination correctly", async function () {
      const paginatedTxs = await utxoSimulator.getUTXOTransactionsPaginated(0, 1);
      expect(paginatedTxs.length).to.equal(1);
      expect(paginatedTxs[0].transactionHash).to.equal(txHash1);
    });

    it("Should revert for non-existent transaction hash", async function () {
      const nonExistentHash = ethers.keccak256(ethers.toUtf8Bytes("non_existent"));
      await expect(
        utxoSimulator.getUTXOTransaction(nonExistentHash)
      ).to.be.revertedWith("UTXOSimulator: Transaction not found");
    });

    it("Should revert for index out of bounds", async function () {
      await expect(
        utxoSimulator.getUTXOTransactionByIndex(999)
      ).to.be.revertedWith("UTXOSimulator: Index out of bounds");
    });
  });

  describe("Transaction Status Check", function () {
    const txHash = ethers.keccak256(ethers.toUtf8Bytes("test_transaction"));
    const amount = ethers.parseUnits("100", 18);

    it("Should correctly report transaction recording status", async function () {
      expect(await utxoSimulator.isTransactionHashRecorded(txHash)).to.be.false;
      
      await utxoSimulator.recordUTXOTransaction(txHash, addr1.address, addr2.address, amount);
      
      expect(await utxoSimulator.isTransactionHashRecorded(txHash)).to.be.true;
    });
  });
});