// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./NUSD.sol";

contract Vault is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    
    NUSD public immutable nusd;
    
    uint256 public constant COLLATERAL_RATIO = 70; // 70% 抵押率
    uint256 public constant LIQUIDATION_THRESHOLD = 80; // 80% 清算阈值
    
    // 代币价格管理
    mapping(address => uint256) public tokenPrices; // 代币地址 => 价格 (18位精度)
    mapping(address => bool) public supportedTokens; // 支持的代币列表
    address[] public supportedTokenList; // 支持的代币地址数组
    
    // 用户质押信息
    struct UserStake {
        mapping(address => uint256) tokenAmounts; // 代币地址 => 质押数量
        uint256 totalNUSDBorrowed; // 总借入NUSD数量
        bool hasActivePosition;
    }
    
    mapping(address => UserStake) public userStakes;
    
    // 全局统计
    mapping(address => uint256) public totalTokenStaked; // 代币地址 => 总质押数量
    uint256 public totalNUSDBorrowed; // 总借出NUSD数量
    
    // 事件
    event TokenAdded(address indexed token, uint256 price);
    event TokenRemoved(address indexed token);
    event TokenPriceUpdated(address indexed token, uint256 oldPrice, uint256 newPrice);
    event TokenStaked(address indexed user, address indexed token, uint256 amount, uint256 nusdValue);
    event NUSDBorrowed(address indexed user, uint256 amount);
    event NUSDRepaid(address indexed user, uint256 amount);
    event TokenUnstaked(address indexed user, address indexed token, uint256 amount);
    
    constructor(address _nusd, address initialOwner) Ownable(initialOwner) {
        nusd = NUSD(_nusd);
    }
    
    /**
     * @dev 添加支持的代币和价格 (仅所有者)
     * @param token 代币地址
     * @param price 代币价格 (18位精度)
     */
    function addSupportedToken(address token, uint256 price) external onlyOwner {
        require(token != address(0), "Invalid token address");
        require(price > 0, "Invalid price");
        require(!supportedTokens[token], "Token already supported");
        
        supportedTokens[token] = true;
        tokenPrices[token] = price;
        supportedTokenList.push(token);
        
        emit TokenAdded(token, price);
    }
    
    /**
     * @dev 移除支持的代币 (仅所有者)
     * @param token 代币地址
     */
    function removeSupportedToken(address token) external onlyOwner {
        require(supportedTokens[token], "Token not supported");
        require(totalTokenStaked[token] == 0, "Token has active stakes");
        
        supportedTokens[token] = false;
        delete tokenPrices[token];
        
        // 从数组中移除代币
        for (uint i = 0; i < supportedTokenList.length; i++) {
            if (supportedTokenList[i] == token) {
                supportedTokenList[i] = supportedTokenList[supportedTokenList.length - 1];
                supportedTokenList.pop();
                break;
            }
        }
        
        emit TokenRemoved(token);
    }
    
    /**
     * @dev 更新代币价格 (仅所有者)
     * @param token 代币地址
     * @param newPrice 新价格 (18位精度)
     */
    function updateTokenPrice(address token, uint256 newPrice) external onlyOwner {
        require(supportedTokens[token], "Token not supported");
        require(newPrice > 0, "Invalid price");
        
        uint256 oldPrice = tokenPrices[token];
        tokenPrices[token] = newPrice;
        
        emit TokenPriceUpdated(token, oldPrice, newPrice);
    }
    
    /**
     * @dev 质押ERC20代币
     * @param token 代币地址
     * @param amount 质押数量
     */
    function stakeToken(address token, uint256 amount) external nonReentrant whenNotPaused {
        require(supportedTokens[token], "Token not supported");
        require(amount > 0, "Invalid amount");
        
        // 转移代币到合约
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        
        // 更新用户质押信息
        UserStake storage userStake = userStakes[msg.sender];
        userStake.tokenAmounts[token] += amount;
        userStake.hasActivePosition = true;
        
        // 更新全局统计
        totalTokenStaked[token] += amount;
        
        // 计算可铸造的NUSD数量
        uint256 nusdValue = calculateNUSDValue(token, amount);
        
        emit TokenStaked(msg.sender, token, amount, nusdValue);
    }
    
    /**
     * @dev 借贷NUSD
     * @param amount 借入数量
     */
    function borrowNUSD(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Invalid amount");
        
        UserStake storage userStake = userStakes[msg.sender];
        require(userStake.hasActivePosition, "No active position");
        
        // 检查抵押率
        uint256 totalCollateralValue = calculateTotalCollateralValue(msg.sender);
        uint256 requiredCollateral = amount * 100 / COLLATERAL_RATIO;
        require(totalCollateralValue >= requiredCollateral, "Insufficient collateral");
        
        // 从NUSD合约铸造NUSD给用户
        nusd.mint(msg.sender, amount, "Vault borrowing");
        
        // 更新用户借贷信息
        userStake.totalNUSDBorrowed += amount;
        totalNUSDBorrowed += amount;
        
        emit NUSDBorrowed(msg.sender, amount);
    }
    
    /**
     * @dev 归还NUSD
     * @param amount 归还数量
     */
    function repayNUSD(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Invalid amount");
        
        UserStake storage userStake = userStakes[msg.sender];
        require(userStake.totalNUSDBorrowed >= amount, "Insufficient borrowed amount");
        
        // 从用户转移NUSD到合约
        nusd.transferFrom(msg.sender, address(this), amount);
        
        // 更新用户借贷信息
        userStake.totalNUSDBorrowed -= amount;
        totalNUSDBorrowed -= amount;
        
        emit NUSDRepaid(msg.sender, amount);
    }
    
    /**
     * @dev 解质押代币
     * @param token 代币地址
     * @param amount 解质押数量
     */
    function unstakeToken(address token, uint256 amount) external nonReentrant whenNotPaused {
        require(supportedTokens[token], "Token not supported");
        require(amount > 0, "Invalid amount");
        
        UserStake storage userStake = userStakes[msg.sender];
        require(userStake.tokenAmounts[token] >= amount, "Insufficient staked amount");
        
        // 检查是否有足够的NUSD来销毁
        uint256 nusdToBurn = calculateNUSDValue(token, amount);
        require(userStake.totalNUSDBorrowed >= nusdToBurn, "Insufficient NUSD to burn");
        
        // 销毁相应的NUSD
        nusd.burn(address(this), nusdToBurn, "Token unstaking");
        
        // 更新用户质押信息
        userStake.tokenAmounts[token] -= amount;
        userStake.totalNUSDBorrowed -= nusdToBurn;
        
        // 如果用户没有质押的代币了，标记为非活跃
        if (userStake.totalNUSDBorrowed == 0) {
            userStake.hasActivePosition = false;
        }
        
        // 更新全局统计
        totalTokenStaked[token] -= amount;
        totalNUSDBorrowed -= nusdToBurn;
        
        // 转移代币给用户
        IERC20(token).safeTransfer(msg.sender, amount);
        
        emit TokenUnstaked(msg.sender, token, amount);
    }
    
    /**
     * @dev 计算代币可铸造的NUSD数量
     * @param token 代币地址
     * @param amount 代币数量
     * @return NUSD数量
     */
    function calculateNUSDValue(address token, uint256 amount) public view returns (uint256) {
        require(supportedTokens[token], "Token not supported");
        uint256 price = tokenPrices[token];
        return (amount * price) / 10**18;
    }
    
    /**
     * @dev 计算用户总抵押品价值
     * @param user 用户地址
     * @return 总抵押品价值 (NUSD)
     */
    function calculateTotalCollateralValue(address user) public view returns (uint256) {
        UserStake storage userStake = userStakes[user];
        uint256 totalValue = 0;
        
        // 遍历所有支持的代币
        for (uint i = 0; i < supportedTokenList.length; i++) {
            address token = supportedTokenList[i];
            uint256 stakedAmount = userStake.tokenAmounts[token];
            if (stakedAmount > 0) {
                totalValue += calculateNUSDValue(token, stakedAmount);
            }
        }
        
        return totalValue;
    }
    
    /**
     * @dev 获取用户质押的代币信息
     * @param user 用户地址
     * @param token 代币地址
     * @return 质押数量
     */
    function getUserStakedAmount(address user, address token) external view returns (uint256) {
        return userStakes[user].tokenAmounts[token];
    }
    
    /**
     * @dev 获取用户借入的NUSD数量
     * @param user 用户地址
     * @return 借入数量
     */
    function getUserBorrowedNUSD(address user) external view returns (uint256) {
        return userStakes[user].totalNUSDBorrowed;
    }
    
    /**
     * @dev 获取支持的代币数量
     */
    function getSupportedTokenCount() public view returns (uint256) {
        return supportedTokenList.length;
    }
    
    /**
     * @dev 获取指定索引的支持代币
     */
    function getSupportedTokenByIndex(uint256 index) public view returns (address) {
        require(index < supportedTokenList.length, "Index out of bounds");
        return supportedTokenList[index];
    }
    
    /**
     * @dev 获取所有支持的代币地址
     */
    function getAllSupportedTokens() external view returns (address[] memory) {
        return supportedTokenList;
    }
    
    /**
     * @dev 获取代币价格
     * @param token 代币地址
     * @return 代币价格
     */
    function getTokenPrice(address token) external view returns (uint256) {
        require(supportedTokens[token], "Token not supported");
        return tokenPrices[token];
    }
    
    /**
     * @dev 检查代币是否被支持
     * @param token 代币地址
     * @return 是否支持
     */
    function isTokenSupported(address token) external view returns (bool) {
        return supportedTokens[token];
    }
    
    /**
     * @dev 获取用户质押的所有代币信息
     * @param user 用户地址
     * @return 代币地址数组
     * @return 质押数量数组
     */
    function getUserStakedTokens(address user) external view returns (address[] memory, uint256[] memory) {
        uint256 count = 0;
        
        // 计算用户质押的代币数量
        for (uint i = 0; i < supportedTokenList.length; i++) {
            if (userStakes[user].tokenAmounts[supportedTokenList[i]] > 0) {
                count++;
            }
        }
        
        address[] memory tokens = new address[](count);
        uint256[] memory amounts = new uint256[](count);
        
        uint256 index = 0;
        for (uint i = 0; i < supportedTokenList.length; i++) {
            address token = supportedTokenList[i];
            uint256 amount = userStakes[user].tokenAmounts[token];
            if (amount > 0) {
                tokens[index] = token;
                amounts[index] = amount;
                index++;
            }
        }
        
        return (tokens, amounts);
    }
    
    /**
     * @dev 暂停合约 (仅所有者)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev 恢复合约 (仅所有者)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev 紧急提取代币 (仅所有者)
     */
    function emergencyWithdraw(address token, address to) external onlyOwner {
        require(to != address(0), "Invalid recipient");
        uint256 balance = IERC20(token).balanceOf(address(this));
        IERC20(token).safeTransfer(to, balance);
    }
}
