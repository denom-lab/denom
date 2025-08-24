import { useState, useCallback } from "react";
import { ethers, BigNumber } from "ethers";
import { useWeb3 } from "../contexts/Web3Context";
import { NETWORK_CONFIG } from "../config/contracts";
import type {
  UserPosition,
  PoolInfo,
  ProtocolStats,
  SystemStatus,
} from "../types";

export function useContract() {
  const { contracts, dispatch, state, switchNetwork } = useWeb3();
  const [loading, setLoading] = useState(false);

  const ensureCorrectNetwork = useCallback(async () => {
    if (!state.wallet.isConnected) {
      throw new Error("Wallet not connected");
    }

    if (state.wallet.chainId !== NETWORK_CONFIG.chainId) {
      console.log(
        `Current chain: ${state.wallet.chainId}, Required: ${NETWORK_CONFIG.chainId}`
      );
      await switchNetwork();
      // Wait a bit for network switch to complete
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }, [state.wallet, switchNetwork]);

  const handleTransaction = useCallback(
    async (transactionPromise: Promise<ethers.ContractTransaction>) => {
      try {
        setLoading(true);
        dispatch({ type: "SET_TRANSACTION_LOADING", payload: true });

        const tx = await transactionPromise;
        dispatch({ type: "SET_TRANSACTION_HASH", payload: tx.hash });

        const receipt = await tx.wait();
        console.log("Transaction confirmed:", receipt);

        return receipt;
      } catch (error) {
        console.error("Transaction failed:", error);
        dispatch({
          type: "SET_TRANSACTION_ERROR",
          payload: (error as Error).message,
        });
        throw error;
      } finally {
        setLoading(false);
        dispatch({ type: "SET_TRANSACTION_LOADING", payload: false });
      }
    },
    [dispatch]
  );

  // Minting Module Functions
  const depositCollateral = useCallback(
    async (tokenAddress: string, amount: BigNumber) => {
      try {
        // Set loading state at the beginning
        setLoading(true);
        dispatch({ type: "SET_TRANSACTION_LOADING", payload: true });

        // Ensure we're on the correct network first
        await ensureCorrectNetwork();

        if (!contracts.denom || !contracts.stockToken) {
          throw new Error("Contracts not initialized");
        }

        console.log("=== DEPOSIT COLLATERAL START ===");
        console.log("Token address:", tokenAddress);
        console.log("Amount:", ethers.utils.formatEther(amount));
        console.log("Denom contract address:", contracts.denom.address);

        // First approve the token
        console.log("Step 1: Approving token...");
        const tokenContract = new ethers.Contract(
          tokenAddress,
          [
            "function approve(address spender, uint256 amount) external returns (bool)",
          ],
          contracts.denom.signer
        );

        const approveTx = await tokenContract.approve(
          contracts.denom.address,
          amount
        );
        console.log("Approve transaction hash:", approveTx.hash);
        console.log("Waiting for approval transaction to be confirmed...");

        try {
          const approveReceipt = await approveTx.wait();
          console.log("✅ Token approval confirmed, receipt:", approveReceipt);
        } catch (approveError) {
          console.error("❌ Approval transaction failed:", approveError);
          throw new Error(
            `Approval failed: ${(approveError as Error).message}`
          );
        }

        // Then deposit
        console.log("Step 2: Depositing collateral...");
        console.log(
          "Calling denom.deposit with:",
          tokenAddress,
          ethers.utils.formatEther(amount)
        );

        const tx = await contracts.denom.deposit(tokenAddress, amount);
        dispatch({ type: "SET_TRANSACTION_HASH", payload: tx.hash });

        const receipt = await tx.wait();
        console.log("✅ Deposit completed successfully");
        console.log("=== DEPOSIT COLLATERAL END ===");

        return receipt;
      } catch (error) {
        console.error("❌ Deposit collateral failed:", error);
        console.log("=== DEPOSIT COLLATERAL ERROR ===");
        dispatch({
          type: "SET_TRANSACTION_ERROR",
          payload: (error as Error).message,
        });
        throw error;
      } finally {
        setLoading(false);
        dispatch({ type: "SET_TRANSACTION_LOADING", payload: false });
      }
    },
    [contracts, dispatch, ensureCorrectNetwork]
  );

  const mintNUSD = useCallback(
    async (amount: BigNumber) => {
      // Ensure we're on the correct network first
      await ensureCorrectNetwork();

      if (!contracts.denom) {
        throw new Error("Denom contract not initialized");
      }

      return handleTransaction(contracts.denom.mint(amount));
    },
    [contracts, handleTransaction, ensureCorrectNetwork]
  );

  const repayNUSD = useCallback(
    async (amount: BigNumber) => {
      // Ensure we're on the correct network first
      await ensureCorrectNetwork();

      if (!contracts.denom || !contracts.nusd) {
        throw new Error("Contracts not initialized");
      }

      // First approve NUSD
      const approveTx = await contracts.nusd.approve(
        contracts.denom.address,
        amount
      );
      await approveTx.wait();

      // Then repay
      return handleTransaction(contracts.denom.repay(amount));
    },
    [contracts, handleTransaction, ensureCorrectNetwork]
  );

  const withdrawCollateral = useCallback(
    async (tokenAddress: string, amount: BigNumber) => {
      // Ensure we're on the correct network first
      await ensureCorrectNetwork();

      if (!contracts.denom) {
        throw new Error("Denom contract not initialized");
      }

      return handleTransaction(contracts.denom.withdraw(tokenAddress, amount));
    },
    [contracts, handleTransaction, ensureCorrectNetwork]
  );

  // Liquidation Functions
  const liquidatePosition = useCallback(
    async (userAddress: string) => {
      if (!contracts.denom) {
        throw new Error("Denom contract not initialized");
      }

      return handleTransaction(contracts.denom.liquidate(userAddress));
    },
    [contracts, handleTransaction]
  );

  const claimRemainingAssets = useCallback(
    async (userAddress: string) => {
      if (!contracts.denom) {
        throw new Error("Denom contract not initialized");
      }

      return handleTransaction(
        contracts.denom.claimRemainingAssets(userAddress)
      );
    },
    [contracts, handleTransaction]
  );

  // Investment Market Functions
  const depositToPool = useCallback(
    async (poolId: number, amount: BigNumber) => {
      if (!contracts.denom) {
        throw new Error("Denom contract not initialized");
      }

      // Get pool info to know which token to approve
      const poolInfo = await contracts.denom.getPoolInfo(poolId);
      const tokenContract = new ethers.Contract(
        poolInfo.token,
        [
          "function approve(address spender, uint256 amount) external returns (bool)",
        ],
        contracts.denom.signer
      );

      // Approve token
      const approveTx = await tokenContract.approve(
        contracts.denom.address,
        amount
      );
      await approveTx.wait();

      // Deposit to pool
      return handleTransaction(contracts.denom.depositToPool(poolId, amount));
    },
    [contracts, handleTransaction]
  );

  const withdrawFromPool = useCallback(
    async (poolId: number, shares: BigNumber) => {
      if (!contracts.denom) {
        throw new Error("Denom contract not initialized");
      }

      return handleTransaction(
        contracts.denom.withdrawFromPool(poolId, shares)
      );
    },
    [contracts, handleTransaction]
  );

  // View Functions
  const getUserPosition = useCallback(
    async (userAddress: string): Promise<UserPosition> => {
      if (!contracts.denom) {
        throw new Error("Denom contract not initialized");
      }

      const position = await contracts.denom.getPosition(userAddress);
      return {
        tokens: position.tokens,
        amounts: position.amounts,
        nusdDebt: position.nusdDebt,
        healthFactor: position.healthFactor,
      };
    },
    [contracts]
  );

  const getHealthFactor = useCallback(
    async (userAddress: string): Promise<BigNumber> => {
      if (!contracts.denom) {
        throw new Error("Denom contract not initialized");
      }

      return contracts.denom.getHealthFactor(userAddress);
    },
    [contracts]
  );

  const getPoolInfo = useCallback(
    async (poolId: number): Promise<PoolInfo> => {
      if (!contracts.denom) {
        throw new Error("Denom contract not initialized");
      }

      const poolInfo = await contracts.denom.getPoolInfo(poolId);
      return {
        token: poolInfo.token,
        totalDeposits: poolInfo.totalDeposits,
        totalShares: poolInfo.totalShares,
        userShares: poolInfo.userShares,
        rewardRate: poolInfo.rewardRate,
        active: poolInfo.active,
      };
    },
    [contracts]
  );

  const getProtocolStats = useCallback(async (): Promise<ProtocolStats> => {
    if (!contracts.denom) {
      throw new Error("Denom contract not initialized");
    }

    const stats = await contracts.denom.getProtocolStats();
    return {
      insurancePoolBalance: stats.insurancePoolBalance,
      treasuryBalance: stats.treasuryBalance,
      totalCollateralValue: stats.totalCollateralValue,
      nusdSupply: stats.nusdSupply,
    };
  }, [contracts]);

  const getSystemStatus = useCallback(async (): Promise<SystemStatus> => {
    if (!contracts.denom) {
      throw new Error("Denom contract not initialized");
    }

    const status = await contracts.denom.getSystemStatus();
    return {
      systemActive: status.systemActive,
      pegStable: status.pegStable,
      liquidationActive: status.liquidationActive,
    };
  }, [contracts]);

  const getSupportedTokens = useCallback(async (): Promise<string[]> => {
    if (!contracts.denom) {
      throw new Error("Denom contract not initialized");
    }

    return contracts.denom.getSupportedTokens();
  }, [contracts]);

  const getTokenBalance = useCallback(
    async (tokenAddress: string, userAddress: string): Promise<BigNumber> => {
      if (!contracts.denom) {
        throw new Error("Contracts not initialized");
      }

      const tokenContract = new ethers.Contract(
        tokenAddress,
        ["function balanceOf(address account) external view returns (uint256)"],
        contracts.denom.signer
      );

      return tokenContract.balanceOf(userAddress);
    },
    [contracts]
  );

  const getTokenInfo = useCallback(
    async (tokenAddress: string) => {
      if (!contracts.denom) {
        throw new Error("Contracts not initialized");
      }

      const tokenContract = new ethers.Contract(
        tokenAddress,
        [
          "function name() external view returns (string memory)",
          "function symbol() external view returns (string memory)",
          "function decimals() external view returns (uint8)",
        ],
        contracts.denom.signer
      );

      const [name, symbol, decimals] = await Promise.all([
        tokenContract.name(),
        tokenContract.symbol(),
        tokenContract.decimals(),
      ]);

      return { name, symbol, decimals };
    },
    [contracts]
  );

  const getTokenPrice = useCallback(
    async (tokenAddress: string): Promise<BigNumber> => {
      if (!contracts.priceOracle) {
        throw new Error("Price oracle not initialized");
      }

      return contracts.priceOracle.getPrice(tokenAddress);
    },
    [contracts]
  );

  return {
    loading,
    // Minting functions
    depositCollateral,
    mintNUSD,
    repayNUSD,
    withdrawCollateral,
    // Liquidation functions
    liquidatePosition,
    claimRemainingAssets,
    // Investment functions
    depositToPool,
    withdrawFromPool,
    // View functions
    getUserPosition,
    getHealthFactor,
    getPoolInfo,
    getProtocolStats,
    getSystemStatus,
    getSupportedTokens,
    getTokenBalance,
    getTokenInfo,
    getTokenPrice,
  };
}
