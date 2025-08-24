import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
  console.log("Deploying contracts to Reddio network...");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log(
    "Account balance:",
    (await ethers.provider.getBalance(deployer.address)).toString()
  );

  // Deploy MockPriceOracle
  console.log("\nDeploying MockPriceOracle...");
  const mockPriceOracle = await ethers.deployContract("MockPriceOracle");
  await mockPriceOracle.waitForDeployment();
  console.log(
    "MockPriceOracle deployed to:",
    await mockPriceOracle.getAddress()
  );

  // Deploy NUSD
  console.log("\nDeploying NUSD...");
  const nusd = await ethers.deployContract("NUSD");
  await nusd.waitForDeployment();
  console.log("NUSD deployed to:", await nusd.getAddress());

  // Deploy StockToken (tAAPL)
  console.log("\nDeploying StockToken (tAAPL)...");
  const stockToken = await ethers.deployContract("StockToken", [
    "Test Apple Token",
    "tAAPL",
    18,
    1000000,
  ]);
  await stockToken.waitForDeployment();
  console.log("StockToken deployed to:", await stockToken.getAddress());

  // Deploy Denom
  console.log("\nDeploying Denom...");
  const denom = await ethers.deployContract("Denom", [
    await nusd.getAddress(),
    await mockPriceOracle.getAddress(),
  ]);
  await denom.waitForDeployment();
  console.log("Denom deployed to:", await denom.getAddress());

  // Transfer NUSD ownership to Denom contract
  console.log("\nTransferring NUSD ownership to Denom...");
  await nusd.transferOwnership(await denom.getAddress());
  console.log("NUSD ownership transferred to Denom");

  // Add StockToken as supported collateral
  console.log("\nAdding StockToken as supported collateral...");
  await denom.addSupportedToken(await stockToken.getAddress());
  console.log("StockToken added as supported collateral");

  // Set initial prices in oracle
  console.log("\nSetting initial prices in oracle...");
  await mockPriceOracle.setPrice(await stockToken.getAddress(), 100 * 1e8); // $100 per token with 8 decimals precision
  console.log("Initial price set for StockToken: $100");

  console.log("\n=== Deployment Summary ===");
  console.log("MockPriceOracle:", await mockPriceOracle.getAddress());
  console.log("NUSD:", await nusd.getAddress());
  console.log("StockToken:", await stockToken.getAddress());
  console.log("Denom:", await denom.getAddress());

  console.log("\n=== Frontend Environment Variables ===");
  console.log(`VITE_DENOM_ADDRESS=${await denom.getAddress()}`);
  console.log(`VITE_NUSD_ADDRESS=${await nusd.getAddress()}`);
  console.log(`VITE_STOCK_TOKEN_ADDRESS=${await stockToken.getAddress()}`);
  console.log(
    `VITE_PRICE_ORACLE_ADDRESS=${await mockPriceOracle.getAddress()}`
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
