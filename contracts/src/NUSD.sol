// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title NUSD
 * @dev Denom USD Stablecoin - 稳定币合约
 * @notice 与美元1:1锚定的稳定币
 */
contract NUSD is ERC20, Ownable, Pausable {
    
    // 代币元数据
    string private constant _SYMBOL = "NUSD";
    string private constant _NAME = "Denom USD";
    uint8 private constant _DECIMALS = 18;
    
    // 最大供应量 (无上限)
    uint256 public constant MAX_SUPPLY = type(uint256).max;
    
    // 铸造权限管理
    mapping(address => bool) public minters;
    
    // 事件
    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);
    event TokensMinted(address indexed to, uint256 amount, string reason);
    event TokensBurned(address indexed from, uint256 amount, string reason);
    
    // 修饰符
    modifier onlyMinter() {
        require(minters[msg.sender] || msg.sender == owner(), "Caller is not a minter");
        _;
    }
    
    /**
     * @dev 构造函数
     * @param initialOwner 合约所有者地址
     */
    constructor(address initialOwner) 
        ERC20(_NAME, _SYMBOL) 
        Ownable(initialOwner) 
    {
        // 将部署者设为第一个minter
        minters[initialOwner] = true;
        emit MinterAdded(initialOwner);
    }
    
    /**
     * @dev 添加铸造者 (仅所有者)
     * @param minter 新的铸造者地址
     */
    function addMinter(address minter) external onlyOwner {
        require(minter != address(0), "Invalid minter address");
        require(!minters[minter], "Address is already a minter");
        
        minters[minter] = true;
        emit MinterAdded(minter);
    }
    
    /**
     * @dev 移除铸造者 (仅所有者)
     * @param minter 要移除的铸造者地址
     */
    function removeMinter(address minter) external onlyOwner {
        require(minters[minter], "Address is not a minter");
        require(minter != owner(), "Cannot remove owner as minter");
        
        minters[minter] = false;
        emit MinterRemoved(minter);
    }
    
    /**
     * @dev 铸造稳定币 (仅铸造者)
     * @param to 接收地址
     * @param amount 铸造数量
     * @param reason 铸造原因
     */
    function mint(address to, uint256 amount, string memory reason) 
        external 
        onlyMinter 
        whenNotPaused 
    {
        require(to != address(0), "Invalid recipient address");
        require(amount > 0, "Amount must be greater than 0");
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        
        _mint(to, amount);
        emit TokensMinted(to, amount, reason);
    }
    
    /**
     * @dev 销毁稳定币 (仅铸造者)
     * @param from 销毁地址
     * @param amount 销毁数量
     * @param reason 销毁原因
     */
    function burn(address from, uint256 amount, string memory reason) 
        external 
        onlyMinter 
        whenNotPaused 
    {
        require(from != address(0), "Invalid address");
        require(amount > 0, "Amount must be greater than 0");
        require(balanceOf(from) >= amount, "Insufficient balance");
        
        _burn(from, amount);
        emit TokensBurned(from, amount, reason);
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
     * @dev 重写decimals函数
     */
    function decimals() public pure override returns (uint8) {
        return _DECIMALS;
    }
    
    /**
     * @dev 重写transfer函数，添加暂停检查
     */
    function transfer(address to, uint256 amount) 
        public 
        virtual 
        override 
        whenNotPaused 
        returns (bool) 
    {
        require(to != address(0), "Cannot transfer to zero address");
        return super.transfer(to, amount);
    }
    
    /**
     * @dev 重写transferFrom函数，添加暂停检查
     */
    function transferFrom(address from, address to, uint256 amount) 
        public 
        virtual 
        override 
        whenNotPaused 
        returns (bool) 
    {
        require(to != address(0), "Cannot transfer to zero address");
        require(from != address(0), "Cannot transfer from zero address");
        return super.transferFrom(from, to, amount);
    }
    
    /**
     * @dev 重写approve函数，添加暂停检查
     */
    function approve(address spender, uint256 amount) 
        public 
        virtual 
        override 
        whenNotPaused 
        returns (bool) 
    {
        return super.approve(spender, amount);
    }
    
    /**
     * @dev 重写increaseAllowance函数，添加暂停检查
     */
    function increaseAllowance(address spender, uint256 addedValue) 
        public 
        virtual 
        override 
        whenNotPaused 
        returns (bool) 
    {
        return super.increaseAllowance(spender, addedValue);
    }
    
    /**
     * @dev 重写decreaseAllowance函数，添加暂停检查
     */
    function decreaseAllowance(address spender, uint256 subtractedValue) 
        public 
        virtual 
        override 
        whenNotPaused 
        returns (bool) 
    {
        return super.decreaseAllowance(spender, subtractedValue);
    }
}
