/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PRICE_ORACLE_ADDRESS: string
  readonly VITE_CHAIN_ID: string
  readonly VITE_RPC_URL: string
  readonly VITE_DENOM_ADDRESS: string
  readonly VITE_NUSD_ADDRESS: string
  readonly VITE_STOCK_TOKEN_ADDRESS: string
  // 更多环境变量...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
