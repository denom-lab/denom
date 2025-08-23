// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./IPriceOracle.sol";
import "./NUSD.sol";

contract Denom is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Constants
    uint256 public constant LIQUIDATION_THRESHOLD = 150; // 150% collateralization ratio
    uint256 public constant LIQUIDATION_PENALTY = 10; // 10% penalty
    uint256 public constant MIN_HEALTH_FACTOR = 100; // 100% minimum health factor
    uint256 public constant PRICE_PRECISION = 1e8; // Price oracle precision
    uint256 public constant PERCENTAGE_PRECISION = 100;

    // State variables
    NUSD public nusdToken;
    IPriceOracle public priceOracle;
    
    // User positions
    struct Position {
        mapping(address => uint256) collateralAmounts; // token => amount
        uint256 nusdDebt;
        bool exists;
    }
    
    mapping(address => Position) public positions;
    address[] public users;
    
    // Supported collateral tokens
    mapping(address => bool) public supportedTokens;
    address[] public tokenList;
    
    // Liquidity pools
    struct Pool {
        address token;
        uint256 totalDeposits;
        uint256 totalShares;
        mapping(address => uint256) userShares;
        uint256 rewardRate; // Annual reward rate in basis points
        bool active;
    }
    
    mapping(uint256 => Pool) public pools;
    uint256 public poolCount;
    
    // Protocol stats
    uint256 public insurancePool;
    uint256 public treasury;
    
    // Events
    event Deposit(address indexed user, address indexed token, uint256 amount);
    event Withdraw(address indexed user, address indexed token, uint256 amount);
    event Mint(address indexed user, uint256 amount);
    event Repay(address indexed user, uint256 amount);
    event Liquidation(address indexed user, address indexed liquidator, uint256 debtAmount);
    event PoolCreated(uint256 indexed poolId, address indexed token);
    event PoolDeposit(address indexed user, uint256 indexed poolId, uint256 amount);
    event PoolWithdraw(address indexed user, uint256 indexed poolId, uint256 amount);

    constructor(address _nusdToken, address _priceOracle) Ownable() {
        nusdToken = NUSD(_nusdToken);
        priceOracle = IPriceOracle(_priceOracle);
    }

    // Modifiers
    modifier onlySupportedToken(address token) {
        require(supportedTokens[token], "Token not supported");
        _;
    }

    modifier positionExists(address user) {
        require(positions[user].exists, "Position does not exist");
        _;
    }

    // Admin functions
    function addSupportedToken(address token) external onlyOwner {
        require(!supportedTokens[token], "Token already supported");
        supportedTokens[token] = true;
        tokenList.push(token);
    }

    function removeSupportedToken(address token) external onlyOwner {
        require(supportedTokens[token], "Token not supported");
        supportedTokens[token] = false;
        
        // Remove from tokenList
        for (uint256 i = 0; i < tokenList.length; i++) {
            if (tokenList[i] == token) {
                tokenList[i] = tokenList[tokenList.length - 1];
                tokenList.pop();
                break;
            }
        }
    }

    // Minting Module Functions
    function deposit(address token, uint256 amount) external nonReentrant onlySupportedToken(token) {
        require(amount > 0, "Amount must be greater than 0");
        
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        
        if (!positions[msg.sender].exists) {
            positions[msg.sender].exists = true;
            users.push(msg.sender);
        }
        
        positions[msg.sender].collateralAmounts[token] += amount;
        
        emit Deposit(msg.sender, token, amount);
    }

    function mint(uint256 amount) external nonReentrant positionExists(msg.sender) {
        require(amount > 0, "Amount must be greater than 0");
        
        positions[msg.sender].nusdDebt += amount;
        
        uint256 healthFactor = getHealthFactor(msg.sender);
        require(healthFactor >= MIN_HEALTH_FACTOR, "Health factor too low");
        
        nusdToken.mint(msg.sender, amount);
        
        emit Mint(msg.sender, amount);
    }

    function repay(uint256 amount) external nonReentrant positionExists(msg.sender) {
        require(amount > 0, "Amount must be greater than 0");
        require(positions[msg.sender].nusdDebt >= amount, "Repay amount exceeds debt");
        
        nusdToken.burn(msg.sender, amount);
        positions[msg.sender].nusdDebt -= amount;
        
        emit Repay(msg.sender, amount);
    }

    function withdraw(address token, uint256 amount) external nonReentrant onlySupportedToken(token) positionExists(msg.sender) {
        require(amount > 0, "Amount must be greater than 0");
        require(positions[msg.sender].collateralAmounts[token] >= amount, "Insufficient collateral");
        
        positions[msg.sender].collateralAmounts[token] -= amount;
        
        if (positions[msg.sender].nusdDebt > 0) {
            uint256 healthFactor = getHealthFactor(msg.sender);
            require(healthFactor >= MIN_HEALTH_FACTOR, "Health factor too low after withdrawal");
        }
        
        IERC20(token).safeTransfer(msg.sender, amount);
        
        emit Withdraw(msg.sender, token, amount);
    }

    // Liquidation Module Functions
    function getHealthFactor(address user) public view returns (uint256) {
        if (!positions[user].exists || positions[user].nusdDebt == 0) {
            return type(uint256).max;
        }
        
        uint256 totalCollateralValue = getTotalCollateralValue(user);
        uint256 debt = positions[user].nusdDebt;
        
        if (debt == 0) {
            return type(uint256).max;
        }
        
        return (totalCollateralValue * PERCENTAGE_PRECISION) / debt;
    }

    function liquidate(address user) external nonReentrant positionExists(user) {
        uint256 healthFactor = getHealthFactor(user);
        require(healthFactor < LIQUIDATION_THRESHOLD, "Position is healthy");
        
        uint256 debtAmount = positions[user].nusdDebt;
        require(debtAmount > 0, "No debt to liquidate");
        
        // Calculate liquidation penalty and transfer NUSD from liquidator
        uint256 penaltyAmount = (debtAmount * LIQUIDATION_PENALTY) / PERCENTAGE_PRECISION;
        nusdToken.burn(msg.sender, debtAmount + penaltyAmount);
        
        // Get collateral value and transfer collateral
        uint256 collateralValue = getTotalCollateralValue(user);
        _transferCollateralOnLiquidation(user);
        
        positions[user].nusdDebt = 0;
        insurancePool += (collateralValue * 10) / 100; // 10% to insurance
        
        emit Liquidation(user, msg.sender, debtAmount);
    }

    function _transferCollateralOnLiquidation(address user) internal {
        for (uint256 i = 0; i < tokenList.length; i++) {
            address token = tokenList[i];
            uint256 collateralAmount = positions[user].collateralAmounts[token];
            
            if (collateralAmount > 0) {
                uint256 liquidatorAmount = (collateralAmount * 90) / 100;
                IERC20(token).safeTransfer(msg.sender, liquidatorAmount);
                positions[user].collateralAmounts[token] = 0;
            }
        }
    }

    function claimRemainingAssets(address user) external positionExists(user) {
        require(msg.sender == user, "Only user can claim their assets");
        require(positions[user].nusdDebt == 0, "Must repay all debt first");
        
        for (uint256 i = 0; i < tokenList.length; i++) {
            address token = tokenList[i];
            uint256 amount = positions[user].collateralAmounts[token];
            
            if (amount > 0) {
                positions[user].collateralAmounts[token] = 0;
                IERC20(token).safeTransfer(user, amount);
            }
        }
    }

    // Investment Market Functions
    function createPool(address token) external onlyOwner returns (uint256 poolId) {
        poolId = poolCount++;
        pools[poolId].token = token;
        pools[poolId].active = true;
        pools[poolId].rewardRate = 500; // 5% annual reward rate
        
        emit PoolCreated(poolId, token);
    }

    function depositToPool(uint256 poolId, uint256 amount) external nonReentrant {
        require(pools[poolId].active, "Pool not active");
        require(amount > 0, "Amount must be greater than 0");
        
        Pool storage pool = pools[poolId];
        IERC20(pool.token).safeTransferFrom(msg.sender, address(this), amount);
        
        uint256 shares;
        if (pool.totalShares == 0) {
            shares = amount;
        } else {
            shares = (amount * pool.totalShares) / pool.totalDeposits;
        }
        
        pool.userShares[msg.sender] += shares;
        pool.totalShares += shares;
        pool.totalDeposits += amount;
        
        emit PoolDeposit(msg.sender, poolId, amount);
    }

    function withdrawFromPool(uint256 poolId, uint256 shares) external nonReentrant {
        require(pools[poolId].active, "Pool not active");
        require(shares > 0, "Shares must be greater than 0");
        
        Pool storage pool = pools[poolId];
        require(pool.userShares[msg.sender] >= shares, "Insufficient shares");
        
        uint256 amount = (shares * pool.totalDeposits) / pool.totalShares;
        
        pool.userShares[msg.sender] -= shares;
        pool.totalShares -= shares;
        pool.totalDeposits -= amount;
        
        IERC20(pool.token).safeTransfer(msg.sender, amount);
        
        emit PoolWithdraw(msg.sender, poolId, amount);
    }

    // View Functions
    function getPosition(address user) external view returns (
        address[] memory tokens,
        uint256[] memory amounts,
        uint256 nusdDebt,
        uint256 healthFactor
    ) {
        if (!positions[user].exists) {
            return (new address[](0), new uint256[](0), 0, type(uint256).max);
        }
        
        tokens = new address[](tokenList.length);
        amounts = new uint256[](tokenList.length);
        
        for (uint256 i = 0; i < tokenList.length; i++) {
            tokens[i] = tokenList[i];
            amounts[i] = positions[user].collateralAmounts[tokenList[i]];
        }
        
        nusdDebt = positions[user].nusdDebt;
        healthFactor = getHealthFactor(user);
    }

    function getTotalCollateralValue(address user) public view returns (uint256 totalValue) {
        for (uint256 i = 0; i < tokenList.length; i++) {
            address token = tokenList[i];
            uint256 amount = positions[user].collateralAmounts[token];
            
            if (amount > 0) {
                uint256 price = priceOracle.getPrice(token);
                totalValue += (amount * price) / PRICE_PRECISION;
            }
        }
    }

    function getPoolInfo(uint256 poolId) external view returns (
        address token,
        uint256 totalDeposits,
        uint256 totalShares,
        uint256 userShares,
        uint256 rewardRate,
        bool active
    ) {
        Pool storage pool = pools[poolId];
        return (
            pool.token,
            pool.totalDeposits,
            pool.totalShares,
            pool.userShares[msg.sender],
            pool.rewardRate,
            pool.active
        );
    }

    function getProtocolStats() external view returns (
        uint256 insurancePoolBalance,
        uint256 treasuryBalance,
        uint256 totalCollateralValue,
        uint256 nusdSupply
    ) {
        insurancePoolBalance = insurancePool;
        treasuryBalance = treasury;
        
        // Calculate total collateral value across all users
        for (uint256 i = 0; i < users.length; i++) {
            totalCollateralValue += getTotalCollateralValue(users[i]);
        }
        
        nusdSupply = nusdToken.totalSupply();
    }

    function getSystemStatus() external view returns (
        bool systemActive,
        bool pegStable,
        bool liquidationActive
    ) {
        systemActive = true; // Simplified for demo
        pegStable = true; // Simplified for demo
        liquidationActive = true; // Simplified for demo
    }

    function getSupportedTokens() external view returns (address[] memory) {
        return tokenList;
    }

    function getUserCount() external view returns (uint256) {
        return users.length;
    }
}
