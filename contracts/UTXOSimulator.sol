// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title UTXOSimulator
 * @dev A smart contract that simulates the recording of UTXO-based events on the EVM layer.
 * This serves as a conceptual placeholder to demonstrate how UTXO data could be reflected
 * on the EVM chain via an oracle or bridge mechanism.
 */
contract UTXOSimulator {
    // --- Structs ---

    struct UTXOTransaction {
        bytes32 transactionHash;
        address senderAddress;
        address receiverAddress;
        uint256 amount;
        uint256 timestamp;
        uint256 blockNumber;
    }

    // --- State Variables ---

    // Array to store all recorded UTXO transactions
    UTXOTransaction[] private utxoTransactions;
    
    // Mapping from transaction hash to transaction index
    mapping(bytes32 => uint256) private transactionHashToIndex;
    
    // Mapping to check if a transaction hash has been recorded
    mapping(bytes32 => bool) private isTransactionRecorded;
    
    // Counter for total transactions
    uint256 public totalTransactions;

    // --- Events ---

    /**
     * @dev Emitted when a UTXO transaction is recorded on the EVM layer.
     * @param transactionHash The hash of the UTXO transaction
     * @param senderAddress The address that sent the UTXO
     * @param receiverAddress The address that received the UTXO
     * @param amount The amount transferred in the transaction
     * @param timestamp The timestamp when the transaction was recorded
     * @param blockNumber The EVM block number when the transaction was recorded
     */
    event UTXOTransactionRecorded(
        bytes32 indexed transactionHash,
        address indexed senderAddress,
        address indexed receiverAddress,
        uint256 amount,
        uint256 timestamp,
        uint256 blockNumber
    );

    // --- Functions ---

    /**
     * @dev Records a UTXO transaction on the EVM layer.
     * This function would typically be called by an oracle or bridge service.
     * @param _transactionHash The hash of the UTXO transaction
     * @param _senderAddress The address that sent the UTXO
     * @param _receiverAddress The address that received the UTXO
     * @param _amount The amount transferred in the transaction
     */
    function recordUTXOTransaction(
        bytes32 _transactionHash,
        address _senderAddress,
        address _receiverAddress,
        uint256 _amount
    ) external {
        // Validate inputs
        require(_transactionHash != bytes32(0), "UTXOSimulator: Transaction hash cannot be empty");
        require(_senderAddress != address(0), "UTXOSimulator: Sender address cannot be zero");
        require(_receiverAddress != address(0), "UTXOSimulator: Receiver address cannot be zero");
        require(_amount > 0, "UTXOSimulator: Amount must be greater than zero");
        require(!isTransactionRecorded[_transactionHash], "UTXOSimulator: Transaction already recorded");

        // Create the UTXO transaction record
        UTXOTransaction memory newTransaction = UTXOTransaction({
            transactionHash: _transactionHash,
            senderAddress: _senderAddress,
            receiverAddress: _receiverAddress,
            amount: _amount,
            timestamp: block.timestamp,
            blockNumber: block.number
        });

        // Store the transaction
        utxoTransactions.push(newTransaction);
        uint256 transactionIndex = utxoTransactions.length - 1;
        
        // Update mappings
        transactionHashToIndex[_transactionHash] = transactionIndex;
        isTransactionRecorded[_transactionHash] = true;
        totalTransactions++;

        // Emit the event
        emit UTXOTransactionRecorded(
            _transactionHash,
            _senderAddress,
            _receiverAddress,
            _amount,
            block.timestamp,
            block.number
        );
    }

    /**
     * @dev Retrieves a UTXO transaction by its hash.
     * @param _transactionHash The hash of the transaction to retrieve
     * @return The UTXO transaction details
     */
    function getUTXOTransaction(bytes32 _transactionHash) external view returns (UTXOTransaction memory) {
        require(isTransactionRecorded[_transactionHash], "UTXOSimulator: Transaction not found");
        uint256 index = transactionHashToIndex[_transactionHash];
        return utxoTransactions[index];
    }

    /**
     * @dev Retrieves a UTXO transaction by its index.
     * @param _index The index of the transaction to retrieve
     * @return The UTXO transaction details
     */
    function getUTXOTransactionByIndex(uint256 _index) external view returns (UTXOTransaction memory) {
        require(_index < utxoTransactions.length, "UTXOSimulator: Index out of bounds");
        return utxoTransactions[_index];
    }

    /**
     * @dev Checks if a transaction hash has been recorded.
     * @param _transactionHash The hash to check
     * @return True if the transaction has been recorded, false otherwise
     */
    function isTransactionHashRecorded(bytes32 _transactionHash) external view returns (bool) {
        return isTransactionRecorded[_transactionHash];
    }

    /**
     * @dev Retrieves all UTXO transactions (use with caution for large datasets).
     * @return An array of all recorded UTXO transactions
     */
    function getAllUTXOTransactions() external view returns (UTXOTransaction[] memory) {
        return utxoTransactions;
    }

    /**
     * @dev Retrieves UTXO transactions with pagination.
     * @param _offset The starting index
     * @param _limit The maximum number of transactions to return
     * @return An array of UTXO transactions within the specified range
     */
    function getUTXOTransactionsPaginated(
        uint256 _offset,
        uint256 _limit
    ) external view returns (UTXOTransaction[] memory) {
        require(_offset < utxoTransactions.length, "UTXOSimulator: Offset out of bounds");
        
        uint256 end = _offset + _limit;
        if (end > utxoTransactions.length) {
            end = utxoTransactions.length;
        }
        
        uint256 length = end - _offset;
        UTXOTransaction[] memory result = new UTXOTransaction[](length);
        
        for (uint256 i = 0; i < length; i++) {
            result[i] = utxoTransactions[_offset + i];
        }
        
        return result;
    }

    /**
     * @dev Retrieves transactions involving a specific address (as sender or receiver).
     * @param _address The address to search for
     * @return An array of transactions involving the specified address
     */
    function getTransactionsByAddress(address _address) external view returns (UTXOTransaction[] memory) {
        require(_address != address(0), "UTXOSimulator: Address cannot be zero");
        
        // First pass: count matching transactions
        uint256 count = 0;
        for (uint256 i = 0; i < utxoTransactions.length; i++) {
            if (utxoTransactions[i].senderAddress == _address || 
                utxoTransactions[i].receiverAddress == _address) {
                count++;
            }
        }
        
        // Second pass: collect matching transactions
        UTXOTransaction[] memory result = new UTXOTransaction[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < utxoTransactions.length; i++) {
            if (utxoTransactions[i].senderAddress == _address || 
                utxoTransactions[i].receiverAddress == _address) {
                result[index] = utxoTransactions[i];
                index++;
            }
        }
        
        return result;
    }

    /**
     * @dev Returns the total number of recorded transactions.
     * @return The total number of UTXO transactions recorded
     */
    function getTotalTransactions() external view returns (uint256) {
        return totalTransactions;
    }
}