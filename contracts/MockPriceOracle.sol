// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "./IPriceOracle.sol";

contract MockPriceOracle is IPriceOracle {
    mapping(address => uint256) private prices;
    address public owner;

    event PriceUpdated(address indexed token, uint256 price);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Sets the price of a token (only owner can call)
     * @param token The address of the token
     * @param price The price of the token in USD (with 8 decimals)
     */
    function setPrice(address token, uint256 price) external onlyOwner {
        prices[token] = price;
        emit PriceUpdated(token, price);
    }

    /**
     * @dev Returns the price of a token in USD (with 8 decimals)
     * @param token The address of the token
     * @return price The price of the token in USD
     */
    function getPrice(address token) external view override returns (uint256 price) {
        price = prices[token];
        require(price > 0, "Price not set for this token");
    }
}
