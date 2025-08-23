import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
  console.log("Distributing tAAPL tokens to test addresses...");

  // Contract addresses
  const STOCK_TOKEN_ADDRESS = "0xC0D2555C869E7ed90a7912A386189879950385B3";

  // Test addresses (the 5 addresses from MetaMask + current user)
  const testAddresses = [
    "0x94ce7258eef436fc035758126a20a9a8e2b22e70",
    "0x36ff4b924d9f4835d547004d532cdbfc546352d9",
    "0x3bdc2f2ba0874336f75889e9e03414e3441d70ae",
    "0x53fae859246f484a860f2cffda8657f37daeab89",
    "0x502dc547576265661a1986c38369a6eb23b17172",
    "0x1254303F61dDc63B9e4ecf6e90ECa5630D3ecffc", // Current user address
  ];

  // Get the deployer (who owns all the tokens)
  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);

  // Connect to StockToken contract
  const stockToken = await ethers.getContractAt(
    "StockToken",
    STOCK_TOKEN_ADDRESS
  );

  // Check deployer balance
  const deployerBalance = await stockToken.balanceOf(deployer.address);
  console.log("Deployer tAAPL balance:", ethers.formatEther(deployerBalance));

  // Distribute 10,000 tokens to each test address
  const amountToDistribute = ethers.parseEther("10000"); // 10,000 tAAPL tokens

  console.log("\nDistributing tokens...");
  for (const address of testAddresses) {
    try {
      console.log(
        `Transferring ${ethers.formatEther(
          amountToDistribute
        )} tAAPL to ${address}...`
      );
      const tx = await stockToken.transfer(address, amountToDistribute);
      await tx.wait();

      // Check balance
      const balance = await stockToken.balanceOf(address);
      console.log(`✅ ${address} now has ${ethers.formatEther(balance)} tAAPL`);
    } catch (error) {
      console.error(`❌ Failed to transfer to ${address}:`, error);
    }
  }

  console.log("\n=== Distribution Summary ===");
  console.log("tAAPL tokens distributed to test addresses:");
  for (const address of testAddresses) {
    const balance = await stockToken.balanceOf(address);
    console.log(`${address}: ${ethers.formatEther(balance)} tAAPL`);
  }

  // Check remaining deployer balance
  const remainingBalance = await stockToken.balanceOf(deployer.address);
  console.log(
    `\nDeployer remaining balance: ${ethers.formatEther(
      remainingBalance
    )} tAAPL`
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
