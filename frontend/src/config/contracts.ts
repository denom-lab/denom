export const CONTRACT_ADDRESSES = {
  denom: import.meta.env.VITE_DENOM_ADDRESS || "",
  nusd: import.meta.env.VITE_NUSD_ADDRESS || "",
  stockToken: import.meta.env.VITE_STOCK_TOKEN_ADDRESS || "",
  priceOracle: import.meta.env.VITE_PRICE_ORACLE_ADDRESS || "",
};

export const NETWORK_CONFIG = {
  chainId: parseInt(import.meta.env.VITE_CHAIN_ID || "50341"),
  rpcUrl: import.meta.env.VITE_RPC_URL || "https://reddio-dev.reddio.com/",
  name: "Reddio Testnet",
  currency: "RDO",
  blockExplorer: "https://explorer.reddio.com/",
};

// Contract ABIs (simplified for demo)
export const DENOM_ABI = [
  "function deposit(address token, uint256 amount) external",
  "function mint(uint256 amount) external",
  "function repay(uint256 amount) external",
  "function withdraw(address token, uint256 amount) external",
  "function getPosition(address user) external view returns (address[] memory tokens, uint256[] memory amounts, uint256 nusdDebt, uint256 healthFactor)",
  "function getHealthFactor(address user) external view returns (uint256)",
  "function liquidate(address user) external",
  "function claimRemainingAssets(address user) external",
  "function createPool(address token) external returns (uint256 poolId)",
  "function depositToPool(uint256 poolId, uint256 amount) external",
  "function withdrawFromPool(uint256 poolId, uint256 shares) external",
  "function getPoolInfo(uint256 poolId) external view returns (address token, uint256 totalDeposits, uint256 totalShares, uint256 userShares, uint256 rewardRate, bool active)",
  "function getProtocolStats() external view returns (uint256 insurancePoolBalance, uint256 treasuryBalance, uint256 totalCollateralValue, uint256 nusdSupply)",
  "function getSystemStatus() external view returns (bool systemActive, bool pegStable, bool liquidationActive)",
  "function getSupportedTokens() external view returns (address[] memory)",
  "function addSupportedToken(address token) external",
  "function poolCount() external view returns (uint256)",
  "event Deposit(address indexed user, address indexed token, uint256 amount)",
  "event Withdraw(address indexed user, address indexed token, uint256 amount)",
  "event Mint(address indexed user, uint256 amount)",
  "event Repay(address indexed user, uint256 amount)",
  "event Liquidation(address indexed user, address indexed liquidator, uint256 debtAmount)",
  "event PoolCreated(uint256 indexed poolId, address indexed token)",
  "event PoolDeposit(address indexed user, uint256 indexed poolId, uint256 amount)",
  "event PoolWithdraw(address indexed user, uint256 indexed poolId, uint256 amount)",
];

export const ERC20_ABI = [
  "function name() external view returns (string memory)",
  "function symbol() external view returns (string memory)",
  "function decimals() external view returns (uint8)",
  "function totalSupply() external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) external returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
];

export const PRICE_ORACLE_ABI = [
  "function getPrice(address token) external view returns (uint256 price)",
  "function setPrice(address token, uint256 price) external",
  "event PriceUpdated(address indexed token, uint256 price)",
];

export const CONSTANTS = {
  LIQUIDATION_THRESHOLD: 150,
  LIQUIDATION_PENALTY: 10,
  MIN_HEALTH_FACTOR: 100,
  PRICE_PRECISION: 1e8,
  PERCENTAGE_PRECISION: 100,
};
