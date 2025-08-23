import { BigNumber } from "ethers";

export interface UserPosition {
  tokens: string[];
  amounts: BigNumber[];
  nusdDebt: BigNumber;
  healthFactor: BigNumber;
}

export interface PoolInfo {
  token: string;
  totalDeposits: BigNumber;
  totalShares: BigNumber;
  userShares: BigNumber;
  rewardRate: BigNumber;
  active: boolean;
}

export interface ProtocolStats {
  insurancePoolBalance: BigNumber;
  treasuryBalance: BigNumber;
  totalCollateralValue: BigNumber;
  nusdSupply: BigNumber;
}

export interface SystemStatus {
  systemActive: boolean;
  pegStable: boolean;
  liquidationActive: boolean;
}

export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  balance: BigNumber;
  price: BigNumber;
}

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  balance: BigNumber | null;
}

export interface ContractAddresses {
  denom: string;
  nusd: string;
  stockToken: string;
  priceOracle: string;
}

export interface TransactionState {
  loading: boolean;
  hash: string | null;
  error: string | null;
}

export interface AppState {
  wallet: WalletState;
  userPosition: UserPosition | null;
  protocolStats: ProtocolStats | null;
  systemStatus: SystemStatus | null;
  supportedTokens: TokenInfo[];
  pools: PoolInfo[];
  transaction: TransactionState;
}

export type AppAction =
  | { type: "SET_WALLET"; payload: WalletState }
  | { type: "SET_USER_POSITION"; payload: UserPosition }
  | { type: "SET_PROTOCOL_STATS"; payload: ProtocolStats }
  | { type: "SET_SYSTEM_STATUS"; payload: SystemStatus }
  | { type: "SET_SUPPORTED_TOKENS"; payload: TokenInfo[] }
  | { type: "SET_POOLS"; payload: PoolInfo[] }
  | { type: "SET_TRANSACTION_LOADING"; payload: boolean }
  | { type: "SET_TRANSACTION_HASH"; payload: string }
  | { type: "SET_TRANSACTION_ERROR"; payload: string }
  | { type: "CLEAR_TRANSACTION" };
