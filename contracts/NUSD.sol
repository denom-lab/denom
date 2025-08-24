// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NUSD is ERC20, Ownable {
    constructor() ERC20("NUSD Stablecoin", "NUSD") Ownable() {}

    /**
     * @dev Mint new NUSD tokens (only owner can call)
     * @param to The address to mint tokens to
     * @param amount The amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev Burn NUSD tokens (only owner can call)
     * @param from The address to burn tokens from
     * @param amount The amount of tokens to burn
     */
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }

    /**
     * @dev Burn NUSD tokens from caller
     * @param amount The amount of tokens to burn
     */
    function burnFrom(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}
