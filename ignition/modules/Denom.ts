import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("DenomModule", (m) => {
  // Deploy NUSD token
  const nusd = m.contract("NUSD");

  // Deploy Price Oracle
  const priceOracle = m.contract("MockPriceOracle");

  // Deploy Denom protocol
  const denom = m.contract("Denom", [nusd, priceOracle]);

  // Deploy Stock Token (tAAPL)
  const stockToken = m.contract("StockToken", [
    "Tokenized Apple",
    "tAAPL",
    18,
    1000000, // 1M initial supply
  ]);

  // Transfer NUSD ownership to Denom contract
  m.call(nusd, "transferOwnership", [denom]);

  // Add stock token as supported collateral
  m.call(denom, "addSupportedToken", [stockToken]);

  // Set price for stock token ($150 with 8 decimals)
  m.call(priceOracle, "setPrice", [stockToken, 15000000000n]);

  // Create a liquidity pool for the stock token
  m.call(denom, "createPool", [stockToken]);

  return {
    nusd,
    priceOracle,
    denom,
    stockToken,
  };
});
