import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("Denom Protocol", function () {
  let denom: any;
  let nusd: any;
  let priceOracle: any;
  let stockToken: any;
  let owner: any;
  let user1: any;
  let user2: any;
  let liquidator: any;

  beforeEach(async function () {
    [owner, user1, user2, liquidator] = await ethers.getSigners();

    // Deploy NUSD token
    nusd = await ethers.deployContract("NUSD");
    await nusd.waitForDeployment();

    // Deploy Price Oracle
    priceOracle = await ethers.deployContract("MockPriceOracle");
    await priceOracle.waitForDeployment();

    // Deploy Denom protocol
    denom = await ethers.deployContract("Denom", [
      await nusd.getAddress(),
      await priceOracle.getAddress(),
    ]);
    await denom.waitForDeployment();

    // Deploy Stock Token (tAAPL)
    stockToken = await ethers.deployContract("StockToken", [
      "Tokenized Apple",
      "tAAPL",
      18,
      1000000, // 1M initial supply
    ]);
    await stockToken.waitForDeployment();

    // Set NUSD owner to Denom contract
    await nusd.transferOwnership(await denom.getAddress());

    // Add stock token as supported collateral
    await denom.addSupportedToken(await stockToken.getAddress());

    // Set price for stock token (e.g., $150 with 8 decimals)
    await priceOracle.setPrice(await stockToken.getAddress(), 15000000000n); // $150

    // Transfer some tokens to users for testing
    await stockToken.transfer(user1.address, ethers.parseEther("1000"));
    await stockToken.transfer(user2.address, ethers.parseEther("1000"));
    await stockToken.transfer(liquidator.address, ethers.parseEther("1000"));
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await denom.owner()).to.equal(owner.address);
    });

    it("Should have correct NUSD token address", async function () {
      expect(await denom.nusdToken()).to.equal(await nusd.getAddress());
    });

    it("Should have correct price oracle address", async function () {
      expect(await denom.priceOracle()).to.equal(
        await priceOracle.getAddress()
      );
    });
  });

  describe("Token Management", function () {
    it("Should add supported token", async function () {
      const tokenAddress = await stockToken.getAddress();
      expect(await denom.supportedTokens(tokenAddress)).to.be.true;

      const supportedTokens = await denom.getSupportedTokens();
      expect(supportedTokens).to.include(tokenAddress);
    });

    it("Should remove supported token", async function () {
      const tokenAddress = await stockToken.getAddress();
      await denom.removeSupportedToken(tokenAddress);
      expect(await denom.supportedTokens(tokenAddress)).to.be.false;
    });
  });

  describe("Minting Module", function () {
    it("Should allow deposit of collateral", async function () {
      const depositAmount = ethers.parseEther("100");

      // Approve token transfer
      await stockToken
        .connect(user1)
        .approve(await denom.getAddress(), depositAmount);

      // Deposit collateral
      await expect(
        denom
          .connect(user1)
          .deposit(await stockToken.getAddress(), depositAmount)
      )
        .to.emit(denom, "Deposit")
        .withArgs(user1.address, await stockToken.getAddress(), depositAmount);

      // Check position
      const [tokens, amounts, debt, healthFactor] = await denom.getPosition(
        user1.address
      );
      expect(amounts[0]).to.equal(depositAmount);
      expect(debt).to.equal(0);
    });

    it("Should allow minting NUSD against collateral", async function () {
      const depositAmount = ethers.parseEther("100");
      const mintAmount = ethers.parseEther("5000"); // $5000 worth of NUSD

      // Deposit collateral
      await stockToken
        .connect(user1)
        .approve(await denom.getAddress(), depositAmount);
      await denom
        .connect(user1)
        .deposit(await stockToken.getAddress(), depositAmount);

      // Mint NUSD
      await expect(denom.connect(user1).mint(mintAmount))
        .to.emit(denom, "Mint")
        .withArgs(user1.address, mintAmount);

      // Check NUSD balance
      expect(await nusd.balanceOf(user1.address)).to.equal(mintAmount);

      // Check position debt
      const [, , debt] = await denom.getPosition(user1.address);
      expect(debt).to.equal(mintAmount);
    });

    it("Should allow repaying NUSD debt", async function () {
      const depositAmount = ethers.parseEther("100");
      const mintAmount = ethers.parseEther("5000");
      const repayAmount = ethers.parseEther("2000");

      // Setup position
      await stockToken
        .connect(user1)
        .approve(await denom.getAddress(), depositAmount);
      await denom
        .connect(user1)
        .deposit(await stockToken.getAddress(), depositAmount);
      await denom.connect(user1).mint(mintAmount);

      // Approve NUSD for repayment
      await nusd.connect(user1).approve(await denom.getAddress(), repayAmount);

      // Repay debt
      await expect(denom.connect(user1).repay(repayAmount))
        .to.emit(denom, "Repay")
        .withArgs(user1.address, repayAmount);

      // Check remaining debt
      const [, , debt] = await denom.getPosition(user1.address);
      expect(debt).to.equal(mintAmount - repayAmount);
    });

    it("Should allow withdrawal of collateral", async function () {
      const depositAmount = ethers.parseEther("100");
      const withdrawAmount = ethers.parseEther("50");

      // Setup position
      await stockToken
        .connect(user1)
        .approve(await denom.getAddress(), depositAmount);
      await denom
        .connect(user1)
        .deposit(await stockToken.getAddress(), depositAmount);

      // Withdraw collateral
      await expect(
        denom
          .connect(user1)
          .withdraw(await stockToken.getAddress(), withdrawAmount)
      )
        .to.emit(denom, "Withdraw")
        .withArgs(user1.address, await stockToken.getAddress(), withdrawAmount);

      // Check remaining collateral
      const [, amounts] = await denom.getPosition(user1.address);
      expect(amounts[0]).to.equal(depositAmount - withdrawAmount);
    });
  });

  describe("Health Factor and Liquidation", function () {
    it("Should calculate health factor correctly", async function () {
      const depositAmount = ethers.parseEther("100"); // 100 tAAPL = $15,000
      const mintAmount = ethers.parseEther("10000"); // $10,000 NUSD

      // Setup position
      await stockToken
        .connect(user1)
        .approve(await denom.getAddress(), depositAmount);
      await denom
        .connect(user1)
        .deposit(await stockToken.getAddress(), depositAmount);
      await denom.connect(user1).mint(mintAmount);

      const healthFactor = await denom.getHealthFactor(user1.address);
      // Health factor should be 150% (15000/10000 * 100)
      expect(healthFactor).to.equal(150);
    });

    it("Should prevent minting when health factor is too low", async function () {
      const depositAmount = ethers.parseEther("100"); // 100 tAAPL = $15,000
      const mintAmount = ethers.parseEther("15001"); // More than collateral value

      // Setup position
      await stockToken
        .connect(user1)
        .approve(await denom.getAddress(), depositAmount);
      await denom
        .connect(user1)
        .deposit(await stockToken.getAddress(), depositAmount);

      // Try to mint too much NUSD
      await expect(denom.connect(user1).mint(mintAmount)).to.be.revertedWith(
        "Health factor too low"
      );
    });

    it("Should allow liquidation of unhealthy positions", async function () {
      const depositAmount = ethers.parseEther("100"); // 100 tAAPL = $15,000
      const mintAmount = ethers.parseEther("12000"); // $12,000 NUSD (125% ratio)

      // Setup position
      await stockToken
        .connect(user1)
        .approve(await denom.getAddress(), depositAmount);
      await denom
        .connect(user1)
        .deposit(await stockToken.getAddress(), depositAmount);
      await denom.connect(user1).mint(mintAmount);

      // Lower the price to make position unhealthy
      await priceOracle.setPrice(await stockToken.getAddress(), 13000000000n); // $130

      // Check health factor is now below liquidation threshold
      const healthFactor = await denom.getHealthFactor(user1.address);
      expect(healthFactor).to.be.lt(150);

      // Liquidator needs NUSD to liquidate - first create a position for liquidator to get NUSD
      const liquidatorDepositAmount = ethers.parseEther("200");
      await stockToken
        .connect(liquidator)
        .approve(await denom.getAddress(), liquidatorDepositAmount);
      await denom
        .connect(liquidator)
        .deposit(await stockToken.getAddress(), liquidatorDepositAmount);

      const liquidationAmount = mintAmount + (mintAmount * 10n) / 100n; // debt + 10% penalty
      await denom.connect(liquidator).mint(liquidationAmount);
      await nusd
        .connect(liquidator)
        .approve(await denom.getAddress(), liquidationAmount);

      // Liquidate position
      await expect(denom.connect(liquidator).liquidate(user1.address))
        .to.emit(denom, "Liquidation")
        .withArgs(user1.address, liquidator.address, mintAmount);
    });
  });

  describe("Investment Market", function () {
    it("Should create liquidity pool", async function () {
      await expect(denom.createPool(await stockToken.getAddress()))
        .to.emit(denom, "PoolCreated")
        .withArgs(0, await stockToken.getAddress());

      const [token, , , , rewardRate, active] = await denom.getPoolInfo(0);
      expect(token).to.equal(await stockToken.getAddress());
      expect(rewardRate).to.equal(500); // 5%
      expect(active).to.be.true;
    });

    it("Should allow deposits to liquidity pool", async function () {
      // Create pool
      await denom.createPool(await stockToken.getAddress());

      const depositAmount = ethers.parseEther("100");

      // Approve and deposit to pool
      await stockToken
        .connect(user1)
        .approve(await denom.getAddress(), depositAmount);
      await expect(denom.connect(user1).depositToPool(0, depositAmount))
        .to.emit(denom, "PoolDeposit")
        .withArgs(user1.address, 0, depositAmount);

      const [, totalDeposits, totalShares, userShares] = await denom
        .connect(user1)
        .getPoolInfo(0);
      expect(totalDeposits).to.equal(depositAmount);
      expect(totalShares).to.equal(depositAmount);
      expect(userShares).to.equal(depositAmount);
    });

    it("Should allow withdrawals from liquidity pool", async function () {
      // Create pool and deposit
      await denom.createPool(await stockToken.getAddress());
      const depositAmount = ethers.parseEther("100");
      await stockToken
        .connect(user1)
        .approve(await denom.getAddress(), depositAmount);
      await denom.connect(user1).depositToPool(0, depositAmount);

      const withdrawShares = ethers.parseEther("50");

      // Withdraw from pool
      await expect(denom.connect(user1).withdrawFromPool(0, withdrawShares))
        .to.emit(denom, "PoolWithdraw")
        .withArgs(user1.address, 0, withdrawShares);

      const [, totalDeposits, totalShares, userShares] = await denom
        .connect(user1)
        .getPoolInfo(0);
      expect(totalDeposits).to.equal(depositAmount - withdrawShares);
      expect(totalShares).to.equal(depositAmount - withdrawShares);
      expect(userShares).to.equal(depositAmount - withdrawShares);
    });
  });

  describe("Protocol Information", function () {
    it("Should return protocol statistics", async function () {
      const [insurancePool, treasury, totalCollateralValue, nusdSupply] =
        await denom.getProtocolStats();

      expect(insurancePool).to.equal(0);
      expect(treasury).to.equal(0);
      expect(totalCollateralValue).to.equal(0);
      expect(nusdSupply).to.equal(0);
    });

    it("Should return system status", async function () {
      const [systemActive, pegStable, liquidationActive] =
        await denom.getSystemStatus();

      expect(systemActive).to.be.true;
      expect(pegStable).to.be.true;
      expect(liquidationActive).to.be.true;
    });
  });
});
