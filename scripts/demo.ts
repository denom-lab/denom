import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
  console.log("🚀 Denom Protocol Demo");
  console.log("=".repeat(50));

  // Get signers
  const [owner, user1, user2] = await ethers.getSigners();
  console.log("👤 Owner:", owner.address);
  console.log("👤 User1:", user1.address);
  console.log("👤 User2:", user2.address);
  console.log();

  // Deploy contracts
  console.log("📦 Deploying contracts...");

  // Deploy NUSD token
  const nusd = await ethers.deployContract("NUSD");
  await nusd.waitForDeployment();
  console.log("✅ NUSD deployed at:", await nusd.getAddress());

  // Deploy Price Oracle
  const priceOracle = await ethers.deployContract("MockPriceOracle");
  await priceOracle.waitForDeployment();
  console.log("✅ Price Oracle deployed at:", await priceOracle.getAddress());

  // Deploy Denom protocol
  const denom = await ethers.deployContract("Denom", [
    await nusd.getAddress(),
    await priceOracle.getAddress(),
  ]);
  await denom.waitForDeployment();
  console.log("✅ Denom deployed at:", await denom.getAddress());

  // Deploy Stock Token (tAAPL)
  const stockToken = await ethers.deployContract("StockToken", [
    "Tokenized Apple",
    "tAAPL",
    18,
    1000000, // 1M initial supply
  ]);
  await stockToken.waitForDeployment();
  console.log("✅ tAAPL deployed at:", await stockToken.getAddress());
  console.log();

  // Setup
  console.log("⚙️  Setting up protocol...");

  // Set NUSD owner to Denom contract
  await nusd.transferOwnership(await denom.getAddress());
  console.log("✅ NUSD ownership transferred to Denom");

  // Add stock token as supported collateral
  await denom.addSupportedToken(await stockToken.getAddress());
  console.log("✅ tAAPL added as supported collateral");

  // Set price for stock token ($150 with 8 decimals)
  await priceOracle.setPrice(await stockToken.getAddress(), 15000000000n);
  console.log("✅ tAAPL price set to $150");

  // Transfer tokens to users
  await stockToken.transfer(user1.address, ethers.parseEther("1000"));
  await stockToken.transfer(user2.address, ethers.parseEther("1000"));
  console.log("✅ Tokens distributed to users");
  console.log();

  // Demo 1: Deposit and Mint
  console.log("💰 Demo 1: Deposit and Mint");
  console.log("-".repeat(30));

  const depositAmount = ethers.parseEther("100"); // 100 tAAPL
  const mintAmount = ethers.parseEther("10000"); // $10,000 NUSD

  // User1 deposits collateral
  await stockToken
    .connect(user1)
    .approve(await denom.getAddress(), depositAmount);
  await denom
    .connect(user1)
    .deposit(await stockToken.getAddress(), depositAmount);
  console.log(`✅ User1 deposited ${ethers.formatEther(depositAmount)} tAAPL`);

  // User1 mints NUSD
  await denom.connect(user1).mint(mintAmount);
  console.log(`✅ User1 minted ${ethers.formatEther(mintAmount)} NUSD`);

  // Check position
  const [tokens, amounts, debt, healthFactor] = await denom.getPosition(
    user1.address
  );
  console.log(`📊 User1 Position:`);
  console.log(`   Collateral: ${ethers.formatEther(amounts[0])} tAAPL`);
  console.log(`   Debt: ${ethers.formatEther(debt)} NUSD`);
  console.log(`   Health Factor: ${healthFactor}%`);
  console.log();

  // Demo 2: Liquidity Pool
  console.log("🏊 Demo 2: Liquidity Pool");
  console.log("-".repeat(30));

  // Create pool
  await denom.createPool(await stockToken.getAddress());
  console.log("✅ Created liquidity pool for tAAPL");

  // User2 deposits to pool
  const poolDepositAmount = ethers.parseEther("200");
  await stockToken
    .connect(user2)
    .approve(await denom.getAddress(), poolDepositAmount);
  await denom.connect(user2).depositToPool(0, poolDepositAmount);
  console.log(
    `✅ User2 deposited ${ethers.formatEther(poolDepositAmount)} tAAPL to pool`
  );

  // Check pool info
  const [
    poolToken,
    totalDeposits,
    totalShares,
    userShares,
    rewardRate,
    active,
  ] = await denom.connect(user2).getPoolInfo(0);
  console.log(`📊 Pool Info:`);
  console.log(`   Total Deposits: ${ethers.formatEther(totalDeposits)} tAAPL`);
  console.log(`   User2 Shares: ${ethers.formatEther(userShares)}`);
  console.log(`   Reward Rate: ${Number(rewardRate) / 100}%`);
  console.log();

  // Demo 3: Protocol Stats
  console.log("📈 Demo 3: Protocol Statistics");
  console.log("-".repeat(30));

  const [insurancePool, treasury, totalCollateralValue, nusdSupply] =
    await denom.getProtocolStats();
  console.log(`📊 Protocol Stats:`);
  console.log(`   Insurance Pool: $${ethers.formatEther(insurancePool)}`);
  console.log(`   Treasury: $${ethers.formatEther(treasury)}`);
  console.log(
    `   Total Collateral Value: $${ethers.formatEther(totalCollateralValue)}`
  );
  console.log(`   NUSD Supply: ${ethers.formatEther(nusdSupply)} NUSD`);
  console.log();

  // Demo 4: Liquidation Scenario
  console.log("⚠️  Demo 4: Liquidation Scenario");
  console.log("-".repeat(30));

  // Lower the price to trigger liquidation
  await priceOracle.setPrice(await stockToken.getAddress(), 11000000000n); // $110
  console.log("📉 tAAPL price dropped to $110");

  const newHealthFactor = await denom.getHealthFactor(user1.address);
  console.log(`📊 User1 new health factor: ${newHealthFactor}%`);

  if (newHealthFactor < 150) {
    console.log("🚨 Position is now liquidatable!");

    // User2 acts as liquidator
    const liquidationAmount = mintAmount + (mintAmount * 10n) / 100n; // debt + 10% penalty

    // User2 needs NUSD to liquidate - deposit more collateral and mint
    const liquidatorDepositAmount = ethers.parseEther("300");
    await stockToken
      .connect(user2)
      .approve(await denom.getAddress(), liquidatorDepositAmount);
    await denom
      .connect(user2)
      .deposit(await stockToken.getAddress(), liquidatorDepositAmount);
    await denom.connect(user2).mint(liquidationAmount);

    // Approve and liquidate
    await nusd
      .connect(user2)
      .approve(await denom.getAddress(), liquidationAmount);
    await denom.connect(user2).liquidate(user1.address);

    console.log("✅ Position liquidated by User2");

    // Check final stats
    const [, , finalDebt] = await denom.getPosition(user1.address);
    console.log(`📊 User1 final debt: ${ethers.formatEther(finalDebt)} NUSD`);
  }

  console.log();
  console.log("🎉 Demo completed successfully!");
  console.log("=".repeat(50));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
