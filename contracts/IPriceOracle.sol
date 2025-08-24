// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

interface IPriceOracle {
    /**
     * @dev Returns the price of a token in USD (with 8 decimals)
     * @param token The address of the token
     * @return price The price of the token in USD
     */
    function getPrice(address token) external view returns (uint256 price);
}
