// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MockBDAG
 * @dev A complete ERC-20 token implementation for BlockDAG Token (BDAG)
 */
contract MockERC20 {
    string public name = "BlockDAG Token";
    string public symbol = "BDAG";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    // ERC-20 Events
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    /**
     * @dev Constructor that mints 1,000,000 BDAG tokens to the deployer
     */
    constructor() {
        totalSupply = 1000000 * 10**18; // 1,000,000 BDAG tokens
        balanceOf[msg.sender] = totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
    }

    /**
     * @dev Transfer tokens from sender to recipient
     * @param to The address to transfer tokens to
     * @param value The amount of tokens to transfer
     * @return bool indicating success
     */
    function transfer(address to, uint256 value) public returns (bool) {
        require(to != address(0), "BDAG: transfer to the zero address");
        require(balanceOf[msg.sender] >= value, "BDAG: insufficient balance");
        
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        
        emit Transfer(msg.sender, to, value);
        return true;
    }

    /**
     * @dev Approve spender to spend tokens on behalf of owner
     * @param spender The address authorized to spend tokens
     * @param value The amount of tokens to approve
     * @return bool indicating success
     */
    function approve(address spender, uint256 value) public returns (bool) {
        require(spender != address(0), "BDAG: approve to the zero address");
        
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    /**
     * @dev Transfer tokens from one address to another using allowance
     * @param from The address to transfer tokens from
     * @param to The address to transfer tokens to
     * @param value The amount of tokens to transfer
     * @return bool indicating success
     */
    function transferFrom(address from, address to, uint256 value) public returns (bool) {
        require(from != address(0), "BDAG: transfer from the zero address");
        require(to != address(0), "BDAG: transfer to the zero address");
        require(balanceOf[from] >= value, "BDAG: insufficient balance");
        require(allowance[from][msg.sender] >= value, "BDAG: insufficient allowance");
        
        balanceOf[from] -= value;
        balanceOf[to] += value;
        allowance[from][msg.sender] -= value;
        
        emit Transfer(from, to, value);
        return true;
    }

    /**
     * @dev Mint new tokens (for testing purposes)
     * @param to The address to mint tokens to
     * @param value The amount of tokens to mint
     */
    function mint(address to, uint256 value) public {
        require(to != address(0), "BDAG: mint to the zero address");
        
        balanceOf[to] += value;
        totalSupply += value;
        
        emit Transfer(address(0), to, value);
    }

    /**
     * @dev Burn tokens from sender's balance (for testing purposes)
     * @param value The amount of tokens to burn
     */
    function burn(uint256 value) public {
        require(balanceOf[msg.sender] >= value, "BDAG: insufficient balance to burn");
        
        balanceOf[msg.sender] -= value;
        totalSupply -= value;
        
        emit Transfer(msg.sender, address(0), value);
    }
}