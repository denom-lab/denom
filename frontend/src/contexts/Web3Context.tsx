import React, { createContext, useContext, useReducer, useEffect } from "react";
import { ethers, BigNumber } from "ethers";
import type { AppState, AppAction, WalletState } from "../types";
import {
  NETWORK_CONFIG,
  CONTRACT_ADDRESSES,
  DENOM_ABI,
  ERC20_ABI,
  PRICE_ORACLE_ABI,
} from "../config/contracts";

interface Web3ContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  connectWallet: (forceRequest?: boolean) => Promise<void>;
  disconnectWallet: () => void;
  switchNetwork: () => Promise<void>;
  contracts: {
    denom: ethers.Contract | null;
    nusd: ethers.Contract | null;
    stockToken: ethers.Contract | null;
    priceOracle: ethers.Contract | null;
  };
  provider: ethers.providers.Web3Provider | null;
  signer: ethers.Signer | null;
}

const initialState: AppState = {
  wallet: {
    isConnected: false,
    address: null,
    chainId: null,
    balance: null,
  },
  userPosition: null,
  protocolStats: null,
  systemStatus: null,
  supportedTokens: [],
  pools: [],
  transaction: {
    loading: false,
    hash: null,
    error: null,
  },
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_WALLET":
      return { ...state, wallet: action.payload };
    case "SET_USER_POSITION":
      return { ...state, userPosition: action.payload };
    case "SET_PROTOCOL_STATS":
      return { ...state, protocolStats: action.payload };
    case "SET_SYSTEM_STATUS":
      return { ...state, systemStatus: action.payload };
    case "SET_SUPPORTED_TOKENS":
      return { ...state, supportedTokens: action.payload };
    case "SET_POOLS":
      return { ...state, pools: action.payload };
    case "SET_TRANSACTION_LOADING":
      return {
        ...state,
        transaction: { ...state.transaction, loading: action.payload },
      };
    case "SET_TRANSACTION_HASH":
      return {
        ...state,
        transaction: {
          ...state.transaction,
          hash: action.payload,
          loading: false,
          error: null,
        },
      };
    case "SET_TRANSACTION_ERROR":
      return {
        ...state,
        transaction: {
          ...state.transaction,
          error: action.payload,
          loading: false,
        },
      };
    case "CLEAR_TRANSACTION":
      return {
        ...state,
        transaction: { loading: false, hash: null, error: null },
      };
    default:
      return state;
  }
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [provider, setProvider] =
    React.useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = React.useState<ethers.Signer | null>(null);
  const [contracts, setContracts] = React.useState({
    denom: null as ethers.Contract | null,
    nusd: null as ethers.Contract | null,
    stockToken: null as ethers.Contract | null,
    priceOracle: null as ethers.Contract | null,
  });

  const connectWallet = async (forceRequest = false) => {
    try {
      console.log("=== CONNECT WALLET START ===");
      console.log("forceRequest:", forceRequest);
      console.log("window.ethereum exists:", !!window.ethereum);
      console.log("Current localStorage:", { ...localStorage });

      if (!window.ethereum) {
        throw new Error("Please install MetaMask!");
      }

      // Clear any existing state first
      setProvider(null);
      setSigner(null);
      setContracts({
        denom: null,
        nusd: null,
        stockToken: null,
        priceOracle: null,
      });

      // Force clear any cached connections
      if (forceRequest) {
        console.log("Force request - clearing localStorage");
        localStorage.clear();
      }

      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      console.log("Created web3Provider");

      // Always request accounts when user clicks connect button
      if (forceRequest) {
        console.log("Requesting accounts...");

        // First, try to request permission to connect accounts
        try {
          await window.ethereum.request({
            method: "wallet_requestPermissions",
            params: [{ eth_accounts: {} }],
          });
          console.log("Permission requested successfully");
        } catch (permError) {
          console.log(
            "Permission request failed, trying eth_requestAccounts:",
            permError
          );
          await web3Provider.send("eth_requestAccounts", []);
        }
      }

      // Get accounts to verify
      const accounts = await web3Provider.send("eth_accounts", []);
      console.log("Available accounts:", accounts);

      // Get the currently selected account from MetaMask
      const selectedAccounts = await window.ethereum.request({
        method: "eth_accounts",
      });
      console.log("Selected accounts from MetaMask:", selectedAccounts);

      // Use the first selected account (which should be the currently active one in MetaMask)
      const web3Signer = web3Provider.getSigner(0);
      console.log("Created signer for account index 0");

      const address = await web3Signer.getAddress();
      console.log("Got address from signer:", address);

      // Verify this matches the selected account
      if (
        selectedAccounts.length > 0 &&
        address.toLowerCase() !== selectedAccounts[0].toLowerCase()
      ) {
        console.warn(
          "Address mismatch! Signer address:",
          address,
          "Selected account:",
          selectedAccounts[0]
        );
      }

      const network = await web3Provider.getNetwork();
      console.log("Got network:", network);

      const balance = await web3Provider.getBalance(address);
      console.log("Got balance:", ethers.utils.formatEther(balance));

      console.log("=== FINAL WALLET DATA ===");
      console.log("Address:", address);
      console.log("Chain ID:", network.chainId);
      console.log("Balance:", ethers.utils.formatEther(balance));

      setProvider(web3Provider);
      setSigner(web3Signer);

      const walletState: WalletState = {
        isConnected: true,
        address,
        chainId: network.chainId,
        balance,
      };

      console.log("Setting wallet state:", walletState);
      dispatch({ type: "SET_WALLET", payload: walletState });

      // Clear the disconnected flag when successfully connecting
      localStorage.removeItem("walletDisconnected");

      // Initialize contracts if addresses are available
      if (CONTRACT_ADDRESSES.denom) {
        const denomContract = new ethers.Contract(
          CONTRACT_ADDRESSES.denom,
          DENOM_ABI,
          web3Signer
        );
        const nusdContract = new ethers.Contract(
          CONTRACT_ADDRESSES.nusd,
          ERC20_ABI,
          web3Signer
        );
        const stockTokenContract = new ethers.Contract(
          CONTRACT_ADDRESSES.stockToken,
          ERC20_ABI,
          web3Signer
        );
        const priceOracleContract = new ethers.Contract(
          CONTRACT_ADDRESSES.priceOracle,
          PRICE_ORACLE_ABI,
          web3Signer
        );

        setContracts({
          denom: denomContract,
          nusd: nusdContract,
          stockToken: stockTokenContract,
          priceOracle: priceOracleContract,
        });
      }

      console.log("=== CONNECT WALLET END ===");
    } catch (error) {
      console.error("Error connecting wallet:", error);
      dispatch({
        type: "SET_TRANSACTION_ERROR",
        payload: (error as Error).message,
      });
    }
  };

  const disconnectWallet = () => {
    console.log("=== DISCONNECT WALLET ===");

    setProvider(null);
    setSigner(null);
    setContracts({
      denom: null,
      nusd: null,
      stockToken: null,
      priceOracle: null,
    });
    dispatch({ type: "SET_WALLET", payload: initialState.wallet });

    // Clear all possible localStorage items
    localStorage.clear();

    // Mark as manually disconnected to prevent auto-reconnect
    localStorage.setItem("walletDisconnected", "true");

    console.log("Wallet disconnected and localStorage cleared");
  };

  const switchNetwork = async () => {
    try {
      if (!window.ethereum) {
        throw new Error("Please install MetaMask!");
      }

      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${NETWORK_CONFIG.chainId.toString(16)}` }],
      });

      // After switching network, reconnect to update contracts
      await connectWallet();
    } catch (error: any) {
      // If the network doesn't exist, add it
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: `0x${NETWORK_CONFIG.chainId.toString(16)}`,
                chainName: NETWORK_CONFIG.name,
                nativeCurrency: {
                  name: NETWORK_CONFIG.currency,
                  symbol: NETWORK_CONFIG.currency,
                  decimals: 18,
                },
                rpcUrls: [NETWORK_CONFIG.rpcUrl],
                blockExplorerUrls: [NETWORK_CONFIG.blockExplorer],
              },
            ],
          });

          // After adding network, reconnect to update contracts
          await connectWallet();
        } catch (addError) {
          console.error("Error adding network:", addError);
          throw addError;
        }
      } else {
        console.error("Error switching network:", error);
        throw error;
      }
    }
  };

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          connectWallet();
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      return () => {
        window.ethereum.removeListener(
          "accountsChanged",
          handleAccountsChanged
        );
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, []);

  // Auto-connect if previously connected (but not if manually disconnected)
  useEffect(() => {
    const autoConnect = async () => {
      if (window.ethereum) {
        try {
          // Check if user manually disconnected
          const wasDisconnected = localStorage.getItem("walletDisconnected");
          if (wasDisconnected === "true") {
            return; // Don't auto-connect if user manually disconnected
          }

          const accounts = await window.ethereum.request({
            method: "eth_accounts",
          });
          if (accounts.length > 0) {
            await connectWallet(false); // Auto-connect without forcing request
          }
        } catch (error) {
          console.error("Error auto-connecting:", error);
        }
      }
    };

    autoConnect();
  }, []);

  const value: Web3ContextType = {
    state,
    dispatch,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    contracts,
    provider,
    signer,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}
