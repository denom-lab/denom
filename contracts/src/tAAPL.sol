// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title tAAPL
 * @dev Apple Stock Token - ERC20代币合约
 * @notice 代表苹果公司股票的代币化版本
 */
contract tAAPL is ERC20, Ownable {
    
    // 代币元数据
    string private constant _SYMBOL = "tAAPL";
    string private constant _NAME = "Apple Stock";
    uint8 private constant _DECIMALS = 18;
    
    // 最大供应量 (1亿股)
    uint256 public constant MAX_SUPPLY = 100_000_000 * 10**18;
    
    // 价格Oracle地址 (后期可升级)
    address public priceOracle;
    
    // 事件
    event PriceOracleUpdated(address indexed oldOracle, address indexed newOracle);
    event TokensMinted(address indexed to, uint256 amount, string reason);
    event TokensBurned(address indexed from, uint256 amount, string reason);
    
    /**
     * @dev 构造函数
     * @param initialOwner 合约所有者地址
     */
    constructor(address initialOwner) 
        ERC20(_NAME, _SYMBOL) 
        Ownable(initialOwner) 
    {
        // 初始铸造给合约部署者
        _mint(initialOwner, 10_000_000 * 10**18); // 1000万股
    }
    
    /**
     * @dev 铸造代币 (仅所有者)
     * @param to 接收地址
     * @param amount 铸造数量
     * @param reason 铸造原因
     */
    function mint(address to, uint256 amount, string memory reason) 
        external 
        onlyOwner 
    {
        require(to != address(0), "Invalid recipient address");
        require(amount > 0, "Amount must be greater than 0");
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        
        _mint(to, amount);
        emit TokensMinted(to, amount, reason);
    }
    
    /**
     * @dev 销毁代币 (仅所有者)
     * @param from 销毁地址
     * @param amount 销毁数量
     * @param reason 销毁原因
     */
    function burn(address from, uint256 amount, string memory reason) 
        external 
        onlyOwner 
    {
        require(from != address(0), "Invalid address");
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(from) >= amount, "Insufficient balance");
        
        _burn(from, amount);
        emit TokensBurned(from, amount, reason);
    }
    
    /**
     * @dev 更新价格Oracle地址 (仅所有者)
     * @param newOracle 新的Oracle地址
     */
    function updatePriceOracle(address newOracle) external onlyOwner {
        require(newOracle != address(0), "Invalid oracle address");
        address oldOracle = priceOracle;
        priceOracle = newOracle;
        emit PriceOracleUpdated(oldOracle, newOracle);
    }
    
    /**
     * @dev 获取代币价格 (从Oracle)
     * @return 代币价格 (以USDC为单位，6位小数)
     */
    function getPrice() external view returns (uint256) {
        // 这里应该调用价格Oracle获取实时价格
        // 目前返回固定价格 $150.00 (150 * 10^6)
        return 150_000_000; // $150.00 with 6 decimals
    }
    
    /**
     * @dev 重写decimals函数
     */
    function decimals() public pure override returns (uint8) {
        return _DECIMALS;
    }
    
    /**
     * @dev 重写transfer函数，添加基本验证
     */
    function transfer(address to, uint256 amount) 
        public 
        virtual 
        override 
        returns (bool) 
    {
        require(to != address(0), "Cannot transfer to zero address");
        return super.transfer(to, amount);
    }
    
    /**
     * @dev 重写transferFrom函数，添加基本验证
     */
    function transferFrom(address from, address to, uint256 amount) 
        public 
        virtual 
        override 
        returns (bool) 
    {
        require(to != address(0), "Cannot transfer to zero address");
        require(from != address(0), "Cannot transfer from zero address");
        return super.transferFrom(from, to, amount);
    }
}
