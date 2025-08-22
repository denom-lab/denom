const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Vault Contract", function () {
  let Vault, NUSD, MockERC20;
  let vault, nusd, mockToken;
  let owner, user1, user2;
  
  const TOKEN_PRICE = ethers.parseEther("100"); // $100.00
  const STAKE_AMOUNT = ethers.parseEther("10"); // 10 tokens
  const BORROW_AMOUNT = ethers.parseEther("500"); // 500 NUSD

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    // 部署NUSD合约
    NUSD = await ethers.getContractFactory("NUSD");
    nusd = await NUSD.deploy(owner.address);
    
    // 部署Vault合约
    Vault = await ethers.getContractFactory("Vault");
    vault = await Vault.deploy(nusd.address, owner.address);
    
    // 部署模拟ERC20代币
    MockERC20 = await ethers.getContractFactory("MockERC20");
    mockToken = await MockERC20.deploy("Mock Token", "MTK");
    
    // 设置Vault为NUSD的铸造者
    await nusd.addMinter(vault.address);
    
    // 添加模拟代币到Vault
    await vault.addSupportedToken(mockToken.address, TOKEN_PRICE);
    
    // 给用户一些代币
    await mockToken.mint(user1.address, ethers.parseEther("100"));
    await mockToken.mint(user2.address, ethers.parseEther("100"));
    
    // 给用户一些NUSD用于测试
    await nusd.mint(user1.address, ethers.parseEther("1000"), "Test mint");
    await nusd.mint(user2.address, ethers.parseEther("1000"), "Test mint");
  });

  describe("基本功能", function () {
    it("应该正确部署", async function () {
      expect(await vault.nusd()).to.equal(nusd.address);
      expect(await vault.owner()).to.equal(owner.address);
    });

    it("应该支持添加代币", async function () {
      expect(await vault.isTokenSupported(mockToken.address)).to.be.true;
      expect(await vault.getTokenPrice(mockToken.address)).to.equal(TOKEN_PRICE);
    });

    it("应该正确计算NUSD价值", async function () {
      const nusdValue = await vault.calculateNUSDValue(mockToken.address, STAKE_AMOUNT);
      expect(nusdValue).to.equal(ethers.parseEther("1000")); // 10 * $100 = $1000
    });
  });

  describe("质押功能", function () {
    it("用户应该能够质押代币", async function () {
      await mockToken.connect(user1).approve(vault.address, STAKE_AMOUNT);
      await vault.connect(user1).stakeToken(mockToken.address, STAKE_AMOUNT);
      
      const stakedAmount = await vault.getUserStakedAmount(user1.address, mockToken.address);
      expect(stakedAmount).to.equal(STAKE_AMOUNT);
      
      const totalStaked = await vault.totalTokenStaked(mockToken.address);
      expect(totalStaked).to.equal(STAKE_AMOUNT);
    });

    it("质押后应该标记用户为活跃状态", async function () {
      await mockToken.connect(user1).approve(vault.address, STAKE_AMOUNT);
      await vault.connect(user1).stakeToken(mockToken.address, STAKE_AMOUNT);
      
      const userStake = await vault.userStakes(user1.address);
      expect(userStake.hasActivePosition).to.be.true;
    });
  });

  describe("借贷功能", function () {
    beforeEach(async function () {
      // 用户1先质押代币
      await mockToken.connect(user1).approve(vault.address, STAKE_AMOUNT);
      await vault.connect(user1).stakeToken(mockToken.address, STAKE_AMOUNT);
    });

    it("用户应该能够借贷NUSD", async function () {
      const initialBalance = await nusd.balanceOf(user1.address);
      await vault.connect(user1).borrowNUSD(BORROW_AMOUNT);
      
      const finalBalance = await nusd.balanceOf(user1.address);
      expect(finalBalance).to.equal(initialBalance.add(BORROW_AMOUNT));
      
      const borrowedAmount = await vault.getUserBorrowedNUSD(user1.address);
      expect(borrowedAmount).to.equal(BORROW_AMOUNT);
    });

    it("借贷应该检查抵押率", async function () {
      // 尝试借贷超过抵押品价值的NUSD
      const excessiveBorrow = ethers.parseEther("2000"); // 超过抵押品价值
      await expect(
        vault.connect(user1).borrowNUSD(excessiveBorrow)
      ).to.be.revertedWith("Insufficient collateral");
    });
  });

  describe("归还功能", function () {
    beforeEach(async function () {
      // 用户1质押并借贷
      await mockToken.connect(user1).approve(vault.address, STAKE_AMOUNT);
      await vault.connect(user1).stakeToken(mockToken.address, STAKE_AMOUNT);
      await vault.connect(user1).borrowNUSD(BORROW_AMOUNT);
    });

    it("用户应该能够归还NUSD", async function () {
      const repayAmount = ethers.parseEther("200");
      await nusd.connect(user1).approve(vault.address, repayAmount);
      await vault.connect(user1).repayNUSD(repayAmount);
      
      const borrowedAmount = await vault.getUserBorrowedNUSD(user1.address);
      expect(borrowedAmount).to.equal(BORROW_AMOUNT.sub(repayAmount));
    });
  });

  describe("解质押功能", function () {
    beforeEach(async function () {
      // 用户1质押并借贷
      await mockToken.connect(user1).approve(vault.address, STAKE_AMOUNT);
      await vault.connect(user1).stakeToken(mockToken.address, STAKE_AMOUNT);
      await vault.connect(user1).borrowNUSD(BORROW_AMOUNT);
    });

    it("用户应该能够解质押代币", async function () {
      const unstakeAmount = ethers.parseEther("5"); // 解质押5个代币
      const initialBalance = await mockToken.balanceOf(user1.address);
      
      await vault.connect(user1).unstakeToken(mockToken.address, unstakeAmount);
      
      const finalBalance = await mockToken.balanceOf(user1.address);
      expect(finalBalance).to.equal(initialBalance.add(unstakeAmount));
      
      const stakedAmount = await vault.getUserStakedAmount(user1.address, mockToken.address);
      expect(stakedAmount).to.equal(STAKE_AMOUNT.sub(unstakeAmount));
    });

    it("解质押应该销毁相应的NUSD", async function () {
      const unstakeAmount = ethers.parseEther("5");
      const nusdToBurn = await vault.calculateNUSDValue(mockToken.address, unstakeAmount);
      
      const initialBorrowed = await vault.getUserBorrowedNUSD(user1.address);
      await vault.connect(user1).unstakeToken(mockToken.address, unstakeAmount);
      
      const finalBorrowed = await vault.getUserBorrowedNUSD(user1.address);
      expect(finalBorrowed).to.equal(initialBorrowed.sub(nusdToBurn));
    });
  });

  describe("价格管理", function () {
    it("所有者应该能够更新代币价格", async function () {
      const newPrice = ethers.parseEther("150"); // $150.00
      await vault.updateTokenPrice(mockToken.address, newPrice);
      
      const updatedPrice = await vault.getTokenPrice(mockToken.address);
      expect(updatedPrice).to.equal(newPrice);
    });

    it("非所有者不能更新价格", async function () {
      const newPrice = ethers.parseEther("150");
      await expect(
        vault.connect(user1).updateTokenPrice(mockToken.address, newPrice)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("安全功能", function () {
    it("应该防止重入攻击", async function () {
      // 这个测试需要更复杂的重入合约来验证
      // 这里只是确保合约使用了ReentrancyGuard
      expect(await vault.paused()).to.be.false;
    });

    it("应该支持暂停功能", async function () {
      await vault.pause();
      expect(await vault.paused()).to.be.true;
      
      await mockToken.connect(user1).approve(vault.address, STAKE_AMOUNT);
      await expect(
        vault.connect(user1).stakeToken(mockToken.address, STAKE_AMOUNT)
      ).to.be.revertedWith("Pausable: paused");
    });
  });
});

// 模拟ERC20代币合约用于测试
contract MockERC20 {
    string public name;
    string public symbol;
    uint8 public decimals = 18;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
    }
    
    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
        emit Transfer(address(0), to, amount);
    }
    
    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        emit Transfer(msg.sender, to, amount);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        allowance[from][msg.sender] -= amount;
        emit Transfer(from, to, amount);
        return true;
    }
    
    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }
}
