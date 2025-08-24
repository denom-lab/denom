import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
  console.log("Checking price oracle settings...");

  // Contract addresses
  const PRICE_ORACLE_ADDRESS = "0xb62E09eC8686ef9e3989d376b90CaC561Ac917c2";
  const STOCK_TOKEN_ADDRESS = "0xC0D2555C869E7ed90a7912A386189879950385B3";

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Checking with account:", deployer.address);

  // Connect to contracts
  const priceOracle = await ethers.getContractAt(
    "MockPriceOracle",
    PRICE_ORACLE_ADDRESS
  );

  try {
    // Check current price
    const currentPrice = await priceOracle.getPrice(STOCK_TOKEN_ADDRESS);
    console.log("Current tAAPL price:", currentPrice.toString());
    console.log(
      "Price in readable format:",
      ethers.formatUnits(currentPrice, 8)
    );
  } catch (error) {
    console.error("Error getting price:", error);

    // Try to set the price again
    console.log("Attempting to set price...");
    try {
      const tx = await priceOracle.setPrice(STOCK_TOKEN_ADDRESS, 100 * 1e8);
      await tx.wait();
      console.log("✅ Price set successfully");

      // Check again
      const newPrice = await priceOracle.getPrice(STOCK_TOKEN_ADDRESS);
      console.log("New tAAPL price:", newPrice.toString());
      console.log("Price in readable format:", ethers.formatUnits(newPrice, 8));
    } catch (setError) {
      console.error("Error setting price:", setError);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
