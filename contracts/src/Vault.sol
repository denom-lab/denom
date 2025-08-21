// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./NUSD.sol";
import "./tAAPL.sol";

contract Vault is Ownable, ReentrancyGuard, Pausable {
    
    NUSD public immutable nusd;
    tAAPL public immutable taapl;
    
    uint256 public constant COLLATERAL_RATIO = 70;
    uint256 public constant LIQUIDATION_THRESHOLD = 80;
    
    struct Position {
        uint256 collateralAmount;
        uint256 nusdAmount;
        uint256 timestamp;
        bool isActive;
    }
    
    mapping(address => Position) public positions;
    uint256 public totalCollateral;
    uint256 public totalNUSD;
    
    event PositionOpened(address indexed user, uint256 collateralAmount, uint256 nusdAmount);
    event PositionClosed(address indexed user, uint256 collateralAmount, uint256 nusdAmount);
    
    constructor(address _nusd, address _taapl, address initialOwner) Ownable(initialOwner) {
        nusd = NUSD(_nusd);
        taapl = tAAPL(_taapl);
    }
    
    function openPosition(uint256 collateralAmount, uint256 nusdAmount) external nonReentrant whenNotPaused {
        require(collateralAmount > 0 && nusdAmount > 0, "Invalid amounts");
        require(!positions[msg.sender].isActive, "Position exists");
        
        uint256 requiredCollateral = calculateRequiredCollateral(nusdAmount);
        require(collateralAmount >= requiredCollateral, "Insufficient collateral");
        
        require(taapl.transferFrom(msg.sender, address(this), collateralAmount), "Transfer failed");
        nusd.mint(msg.sender, nusdAmount, "Position opened");
        
        positions[msg.sender] = Position({
            collateralAmount: collateralAmount,
            nusdAmount: nusdAmount,
            timestamp: block.timestamp,
            isActive: true
        });
        
        totalCollateral += collateralAmount;
        totalNUSD += nusdAmount;
        
        emit PositionOpened(msg.sender, collateralAmount, nusdAmount);
    }
    
    function closePosition() external nonReentrant whenNotPaused {
        Position storage position = positions[msg.sender];
        require(position.isActive, "No position");
        
        nusd.burn(msg.sender, position.nusdAmount, "Position closed");
        require(taapl.transfer(msg.sender, position.collateralAmount), "Transfer failed");
        
        totalCollateral -= position.collateralAmount;
        totalNUSD -= position.nusdAmount;
        
        emit PositionClosed(msg.sender, position.collateralAmount, position.nusdAmount);
        delete positions[msg.sender];
    }
    
    function calculateRequiredCollateral(uint256 nusdAmount) public view returns (uint256) {
        uint256 collateralValue = nusdAmount * 100 / COLLATERAL_RATIO;
        return collateralValue * 10**18 / getCollateralPrice();
    }
    
    function getCollateralPrice() public view returns (uint256) {
        return 150 * 10**18; // $150.00
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
}
