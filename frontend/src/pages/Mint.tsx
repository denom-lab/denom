import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useParams, useNavigate } from "react-router-dom";
import { useWeb3 } from "../contexts/Web3Context";
import { useContract } from "../hooks/useContract";
import { CONTRACT_ADDRESSES } from "../config/contracts";

export function Mint() {
  const { state } = useWeb3();
  const { tab } = useParams<{ tab?: string }>();
  const navigate = useNavigate();
  const {
    depositCollateral,
    mintNUSD,
    repayNUSD,
    withdrawCollateral,
    getUserPosition,
    getTokenBalance,
    getTokenPrice,
    loading,
  } = useContract();

  const [activeTab, setActiveTab] = useState<
    "deposit" | "mint" | "repay" | "withdraw"
  >("deposit");
  const [depositAmount, setDepositAmount] = useState("");
  const [mintAmount, setMintAmount] = useState("");
  const [repayAmount, setRepayAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [tokenBalance, setTokenBalance] = useState<ethers.BigNumber>(
    ethers.constants.Zero
  );
  const [nusdBalance, setNusdBalance] = useState<ethers.BigNumber>(
    ethers.constants.Zero
  );
  const [userPosition, setUserPosition] = useState<any>(null);
  const [tokenPrice, setTokenPrice] = useState<ethers.BigNumber>(
    ethers.constants.Zero
  );
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({ show: false, message: "", type: "success" });

  // Handle URL parameter for tab selection
  useEffect(() => {
    if (tab && ["deposit", "mint", "repay", "withdraw"].includes(tab)) {
      setActiveTab(tab as "deposit" | "mint" | "repay" | "withdraw");
    }
  }, [tab]);

  useEffect(() => {
    const fetchBalances = async () => {
      if (!state.wallet.address) return;

      try {
        const [stockBalance, nusdBal, position, price] = await Promise.all([
          getTokenBalance(CONTRACT_ADDRESSES.stockToken, state.wallet.address),
          getTokenBalance(CONTRACT_ADDRESSES.nusd, state.wallet.address),
          getUserPosition(state.wallet.address),
          getTokenPrice(CONTRACT_ADDRESSES.stockToken),
        ]);

        setTokenBalance(stockBalance);
        setNusdBalance(nusdBal);
        setUserPosition(position);
        setTokenPrice(price);
      } catch (error) {
        console.error("Error fetching balances:", error);
      }
    };

    fetchBalances();
  }, [state.wallet.address, getTokenBalance, getUserPosition, getTokenPrice]);

  const handleDeposit = async () => {
    if (!depositAmount || !state.wallet.address) return;

    try {
      const amount = ethers.utils.parseEther(depositAmount);
      await depositCollateral(CONTRACT_ADDRESSES.stockToken, amount);
      setDepositAmount("");
      // Refresh balances
      const [stockBalance, position] = await Promise.all([
        getTokenBalance(CONTRACT_ADDRESSES.stockToken, state.wallet.address),
        getUserPosition(state.wallet.address),
      ]);
      setTokenBalance(stockBalance);
      setUserPosition(position);
      showToast(`Successfully deposited ${depositAmount} tAAPL as collateral!`);
    } catch (error) {
      console.error("Deposit failed:", error);
      showToast("Deposit failed, please try again", "error");
    }
  };

  const handleMint = async () => {
    if (!mintAmount) return;

    try {
      const amount = ethers.utils.parseEther(mintAmount);
      await mintNUSD(amount);
      setMintAmount("");
      // Refresh balances
      if (state.wallet.address) {
        const [nusdBal, position] = await Promise.all([
          getTokenBalance(CONTRACT_ADDRESSES.nusd, state.wallet.address),
          getUserPosition(state.wallet.address),
        ]);
        setNusdBalance(nusdBal);
        setUserPosition(position);
      }
      showToast(`Successfully minted ${mintAmount} NUSD!`);
    } catch (error) {
      console.error("Mint failed:", error);
      showToast("Mint failed, please try again", "error");
    }
  };

  const handleRepay = async () => {
    if (!repayAmount) return;

    try {
      const amount = ethers.utils.parseEther(repayAmount);
      await repayNUSD(amount);
      setRepayAmount("");
      // Refresh balances
      if (state.wallet.address) {
        const [nusdBal, position] = await Promise.all([
          getTokenBalance(CONTRACT_ADDRESSES.nusd, state.wallet.address),
          getUserPosition(state.wallet.address),
        ]);
        setNusdBalance(nusdBal);
        setUserPosition(position);
      }
      showToast(`Successfully repaid ${repayAmount} NUSD!`);
    } catch (error) {
      console.error("Repay failed:", error);
      showToast("Repay failed, please try again", "error");
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount) return;

    try {
      const amount = ethers.utils.parseEther(withdrawAmount);
      await withdrawCollateral(CONTRACT_ADDRESSES.stockToken, amount);
      setWithdrawAmount("");
      // Refresh balances
      if (state.wallet.address) {
        const [stockBalance, position] = await Promise.all([
          getTokenBalance(CONTRACT_ADDRESSES.stockToken, state.wallet.address),
          getUserPosition(state.wallet.address),
        ]);
        setTokenBalance(stockBalance);
        setUserPosition(position);
      }
      showToast(`Successfully withdrew ${withdrawAmount} tAAPL!`);
    } catch (error) {
      console.error("Withdraw failed:", error);
      showToast("Withdraw failed, please try again", "error");
    }
  };

  const formatAmount = (amount: ethers.BigNumber) => {
    return parseFloat(ethers.utils.formatEther(amount)).toFixed(4);
  };

  const formatPrice = (price: ethers.BigNumber) => {
    return parseFloat(ethers.utils.formatUnits(price, 8)).toFixed(2);
  };

  const calculateCollateralValue = () => {
    if (!userPosition || !userPosition.amounts.length || tokenPrice.eq(0)) {
      return "0.00";
    }
    const collateralAmount = userPosition.amounts[0];
    const value = collateralAmount
      .mul(tokenPrice)
      .div(ethers.utils.parseUnits("1", 8)); // Price oracle uses 8 decimals
    return parseFloat(ethers.utils.formatEther(value)).toFixed(2);
  };

  const calculateMaxMintableNUSD = () => {
    if (!userPosition || !userPosition.amounts.length || tokenPrice.eq(0)) {
      return "0.00";
    }
    const collateralAmount = userPosition.amounts[0];
    const collateralValue = collateralAmount
      .mul(tokenPrice)
      .div(ethers.utils.parseUnits("1", 8)); // Price oracle uses 8 decimals

    // Assuming 150% collateral ratio (66.67% LTV)
    const maxMintable = collateralValue.mul(2).div(3); // 2/3 = 66.67%
    const currentDebt = userPosition.nusdDebt;
    const availableToMint = maxMintable.sub(currentDebt);

    return availableToMint.gt(0)
      ? parseFloat(ethers.utils.formatEther(availableToMint)).toFixed(2)
      : "0.00";
  };

  // Calculate maximum withdrawable amount (maintains 150% - DANGEROUS)
  const calculateMaxWithdrawableAmount = () => {
    if (!userPosition || !userPosition.amounts.length || tokenPrice.eq(0)) {
      return "0.00";
    }

    const currentDebt = userPosition.nusdDebt;

    // If no debt, can withdraw all
    if (currentDebt.eq(0)) {
      return formatAmount(userPosition.amounts[0]);
    }

    const collateralAmount = userPosition.amounts[0];
    const collateralValue = collateralAmount
      .mul(tokenPrice)
      .div(ethers.utils.parseUnits("1", 8));

    // Required collateral value to maintain 150% ratio (debt * 1.5) - LIQUIDATION THRESHOLD
    const requiredCollateralValue = currentDebt.mul(3).div(2); // debt * 1.5

    // If current collateral is already below required, can't withdraw anything
    if (collateralValue.lte(requiredCollateralValue)) {
      return "0.00";
    }

    // Excess collateral value that can be withdrawn
    const excessValue = collateralValue.sub(requiredCollateralValue);

    // Convert excess value back to token amount
    const withdrawableAmount = excessValue
      .mul(ethers.utils.parseUnits("1", 8))
      .div(tokenPrice);

    // Don't allow withdrawing more than what's deposited
    const maxWithdrawable = withdrawableAmount.gt(collateralAmount)
      ? collateralAmount
      : withdrawableAmount;

    return parseFloat(ethers.utils.formatEther(maxWithdrawable)).toFixed(4);
  };

  // Calculate safe withdrawable amount (maintains 200% - RECOMMENDED)
  const calculateSafeWithdrawableAmount = () => {
    if (!userPosition || !userPosition.amounts.length || tokenPrice.eq(0)) {
      return "0.00";
    }

    const currentDebt = userPosition.nusdDebt;

    // If no debt, can withdraw all
    if (currentDebt.eq(0)) {
      return formatAmount(userPosition.amounts[0]);
    }

    const collateralAmount = userPosition.amounts[0];
    const collateralValue = collateralAmount
      .mul(tokenPrice)
      .div(ethers.utils.parseUnits("1", 8));

    // Required collateral value to maintain 200% ratio (debt * 2.0) - SAFE THRESHOLD
    const safeCollateralValue = currentDebt.mul(2); // debt * 2.0

    // If current collateral is already below safe threshold, can't withdraw anything safely
    if (collateralValue.lte(safeCollateralValue)) {
      return "0.00";
    }

    // Excess collateral value that can be safely withdrawn
    const excessValue = collateralValue.sub(safeCollateralValue);

    // Convert excess value back to token amount
    const withdrawableAmount = excessValue
      .mul(ethers.utils.parseUnits("1", 8))
      .div(tokenPrice);

    // Don't allow withdrawing more than what's deposited
    const safeWithdrawable = withdrawableAmount.gt(collateralAmount)
      ? collateralAmount
      : withdrawableAmount;

    return parseFloat(ethers.utils.formatEther(safeWithdrawable)).toFixed(4);
  };

  const showToast = (
    message: string,
    type: "success" | "error" = "success"
  ) => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 8000);
  };

  const getHealthFactorColor = (healthFactor: ethers.BigNumber) => {
    if (healthFactor.eq(ethers.constants.MaxUint256)) return "text-green-500";
    const factor = healthFactor.toNumber();
    if (factor >= 200) return "text-green-500";
    if (factor >= 150) return "text-yellow-500";
    return "text-red-500";
  };

  if (!state.wallet.isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-gray-600">
            Connect your wallet to start minting NUSD
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Toast Notification */}
      {toast.show && (
        <div className="toast toast-top toast-end">
          <div
            className={`alert ${
              toast.type === "success" ? "alert-success" : "alert-error"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              {toast.type === "success" ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              )}
            </svg>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Mint NUSD</h1>
        <p className="text-gray-600">
          Deposit collateral and mint NUSD stablecoin
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Action Tabs */}
        <div>
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              {/* Tab Navigation */}
              <div className="mb-6">
                <div className="flex flex-wrap gap-2 p-1 bg-gray-100 rounded-lg">
                  <button
                    className={`flex-1 px-4 py-3 rounded-md font-medium transition-all duration-200 ${
                      activeTab === "deposit"
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105"
                        : "text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-sm"
                    }`}
                    onClick={() => {
                      setActiveTab("deposit");
                      navigate("/mint/deposit");
                    }}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <span className="text-lg">💰</span>
                      <span>Deposit</span>
                    </div>
                  </button>
                  <button
                    className={`flex-1 px-4 py-3 rounded-md font-medium transition-all duration-200 ${
                      activeTab === "mint"
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105"
                        : "text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-sm"
                    }`}
                    onClick={() => {
                      setActiveTab("mint");
                      navigate("/mint/mint");
                    }}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <span className="text-lg">🏭</span>
                      <span>Mint</span>
                    </div>
                  </button>
                  <button
                    className={`flex-1 px-4 py-3 rounded-md font-medium transition-all duration-200 ${
                      activeTab === "repay"
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105"
                        : "text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-sm"
                    }`}
                    onClick={() => {
                      setActiveTab("repay");
                      navigate("/mint/repay");
                    }}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <span className="text-lg">💳</span>
                      <span>Repay</span>
                    </div>
                  </button>
                  <button
                    className={`flex-1 px-4 py-3 rounded-md font-medium transition-all duration-200 ${
                      activeTab === "withdraw"
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105"
                        : "text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-sm"
                    }`}
                    onClick={() => {
                      setActiveTab("withdraw");
                      navigate("/mint/withdraw");
                    }}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <span className="text-lg">📤</span>
                      <span>Withdraw</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Deposit Tab */}
              {activeTab === "deposit" && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Deposit Collateral</h3>
                  <p className="text-gray-600">
                    Deposit tAAPL tokens as collateral to mint NUSD
                  </p>

                  {/* Wallet Balance - Main Focus */}
                  <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg border-l-4 border-blue-500">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-medium text-gray-700">
                          Wallet Balance:
                        </span>
                        <span className="text-xl font-bold text-gray-900">
                          {formatAmount(tokenBalance)} tAAPL
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-medium text-gray-700">
                          Balance Value:
                        </span>
                        <span className="text-xl font-bold text-green-600">
                          $
                          {(
                            parseFloat(formatAmount(tokenBalance)) *
                            parseFloat(formatPrice(tokenPrice))
                          ).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Current Position Info - Secondary */}
                  {userPosition && userPosition.amounts.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-gray-400">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">
                            Deposited:
                          </span>
                          <span className="text-lg font-bold text-gray-900">
                            {formatAmount(userPosition.amounts[0])} tAAPL
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">
                            tAAPL Price:
                          </span>
                          <span className="text-lg font-bold text-blue-600">
                            ${formatPrice(tokenPrice)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Market Info for new users */}
                  {(!userPosition || userPosition.amounts.length === 0) && (
                    <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-gray-400">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">
                          tAAPL Price:
                        </span>
                        <span className="text-lg font-bold text-blue-600">
                          ${formatPrice(tokenPrice)}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="form-control">
                    <div className="mb-2">
                      <label className="label-text text-base font-medium">
                        Deposit Amount (tAAPL)
                      </label>
                    </div>
                    <div className="mb-3">
                      <span className="text-sm text-gray-500">
                        Available Balance: {formatAmount(tokenBalance)} tAAPL
                      </span>
                    </div>
                    <input
                      type="number"
                      placeholder="0.00"
                      className="input input-bordered w-full"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      max={formatAmount(tokenBalance)}
                    />
                  </div>

                  {/* Deposit Preview */}
                  {depositAmount && parseFloat(depositAmount) > 0 && (
                    <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-gray-700">
                            Deposit Amount:
                          </span>
                          <span className="font-bold text-gray-900">
                            {depositAmount} tAAPL
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-gray-700">
                            Estimated Value:
                          </span>
                          <span className="font-bold text-green-600">
                            $
                            {(
                              parseFloat(depositAmount) *
                              parseFloat(formatPrice(tokenPrice))
                            ).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    className="btn btn-primary w-full"
                    onClick={handleDeposit}
                    disabled={
                      loading ||
                      !depositAmount ||
                      parseFloat(depositAmount) <= 0
                    }
                  >
                    {loading ? (
                      <span className="loading loading-spinner"></span>
                    ) : (
                      "Deposit Collateral"
                    )}
                  </button>
                </div>
              )}

              {/* Mint Tab */}
              {activeTab === "mint" && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Mint NUSD</h3>
                  <p className="text-gray-600">
                    Mint NUSD stablecoin against your collateral
                  </p>

                  {/* Detailed Collateral Information */}
                  {userPosition && userPosition.amounts.length > 0 ? (
                    <div className="space-y-4">
                      {/* Primary Collateral Info */}
                      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border-l-4 border-green-500">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-medium text-gray-700">
                              Collateral Amount:
                            </span>
                            <span className="text-xl font-bold text-gray-900">
                              {formatAmount(userPosition.amounts[0])} tAAPL
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-medium text-gray-700">
                              Collateral Value:
                            </span>
                            <span className="text-xl font-bold text-green-600">
                              ${calculateCollateralValue()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Debt and Mintable Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">
                              Current Debt:
                            </span>
                            <span className="text-lg font-bold text-orange-600">
                              {formatAmount(userPosition.nusdDebt)} NUSD
                            </span>
                          </div>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">
                              Available to Mint:
                            </span>
                            <span className="text-lg font-bold text-blue-600">
                              {calculateMaxMintableNUSD()} NUSD
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Health Factor */}
                      <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-gray-400">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-medium text-gray-700">
                            Health Factor:
                          </span>
                          <span
                            className={`text-xl font-bold ${getHealthFactorColor(
                              userPosition.healthFactor
                            )}`}
                          >
                            {userPosition.healthFactor.eq(
                              ethers.constants.MaxUint256
                            )
                              ? "∞"
                              : `${userPosition.healthFactor.toNumber()}%`}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500 text-center">
                      <div className="text-blue-600 mb-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-12 w-12 mx-auto mb-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                          />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-blue-800 mb-2">
                        No Collateral
                      </h3>
                      <p className="text-blue-600">
                        Please deposit tAAPL as collateral first
                      </p>
                    </div>
                  )}

                  <div className="form-control">
                    <div className="mb-2">
                      <label className="label-text text-base font-medium">
                        Mint Amount (NUSD)
                      </label>
                    </div>
                    {userPosition && userPosition.amounts.length > 0 && (
                      <div className="mb-3">
                        <span className="text-sm text-gray-500">
                          Max Mintable: {calculateMaxMintableNUSD()} NUSD
                        </span>
                      </div>
                    )}
                    <input
                      type="number"
                      placeholder="0.00"
                      className="input input-bordered w-full"
                      value={mintAmount}
                      onChange={(e) => setMintAmount(e.target.value)}
                      max={calculateMaxMintableNUSD()}
                    />
                  </div>

                  <div className="alert alert-info">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      className="stroke-current shrink-0 w-6 h-6"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      ></path>
                    </svg>
                    <span>
                      Keep health factor above 150% to avoid liquidation
                    </span>
                  </div>

                  {!userPosition || userPosition.amounts.length === 0 ? (
                    <div className="alert alert-warning">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="stroke-current shrink-0 h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                        />
                      </svg>
                      <span>Need to deposit collateral first to mint NUSD</span>
                    </div>
                  ) : (
                    <button
                      className="btn btn-primary w-full"
                      onClick={handleMint}
                      disabled={
                        loading ||
                        !mintAmount ||
                        parseFloat(calculateMaxMintableNUSD()) <= 0
                      }
                    >
                      {loading ? (
                        <span className="loading loading-spinner"></span>
                      ) : (
                        "Mint NUSD"
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* Repay Tab */}
              {activeTab === "repay" && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Repay NUSD</h3>
                  <p className="text-gray-600">
                    Repay your NUSD debt to improve your health factor
                  </p>

                  {/* NUSD Balance - Main Focus */}
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border-l-4 border-green-500">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-medium text-gray-700">
                          NUSD Balance:
                        </span>
                        <span className="text-xl font-bold text-gray-900">
                          {formatAmount(nusdBalance)} NUSD
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-medium text-gray-700">
                          Balance Value:
                        </span>
                        <span className="text-xl font-bold text-green-600">
                          ${formatAmount(nusdBalance)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Current Debt Info */}
                  {userPosition && userPosition.nusdDebt.gt(0) ? (
                    <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-medium text-gray-700">
                            Current Debt:
                          </span>
                          <span className="text-xl font-bold text-orange-600">
                            {formatAmount(userPosition.nusdDebt)} NUSD
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-medium text-gray-700">
                            Health Factor:
                          </span>
                          <span
                            className={`text-xl font-bold ${getHealthFactorColor(
                              userPosition.healthFactor
                            )}`}
                          >
                            {userPosition.healthFactor.eq(
                              ethers.constants.MaxUint256
                            )
                              ? "∞"
                              : `${userPosition.healthFactor.toNumber()}%`}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500 text-center">
                      <div className="text-blue-600 mb-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-12 w-12 mx-auto mb-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-blue-800 mb-2">
                        No Debt
                      </h3>
                      <p className="text-blue-600">
                        You currently have no NUSD debt to repay
                      </p>
                    </div>
                  )}

                  <div className="form-control">
                    <div className="mb-2">
                      <label className="label-text text-base font-medium">
                        Repay Amount (NUSD)
                      </label>
                    </div>
                    <div className="mb-3">
                      <span className="text-sm text-gray-500">
                        Available Balance: {formatAmount(nusdBalance)} NUSD
                      </span>
                    </div>
                    <input
                      type="number"
                      placeholder="0.00"
                      className="input input-bordered w-full"
                      value={repayAmount}
                      onChange={(e) => setRepayAmount(e.target.value)}
                      max={formatAmount(nusdBalance)}
                    />
                  </div>

                  {/* Repay Preview */}
                  {repayAmount && parseFloat(repayAmount) > 0 && (
                    <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-gray-700">
                            Repay Amount:
                          </span>
                          <span className="font-bold text-gray-900">
                            {repayAmount} NUSD
                          </span>
                        </div>
                        {userPosition && userPosition.nusdDebt.gt(0) && (
                          <div className="flex justify-between text-sm">
                            <span className="font-medium text-gray-700">
                              Remaining Debt:
                            </span>
                            <span className="font-bold text-orange-600">
                              {Math.max(
                                0,
                                parseFloat(
                                  formatAmount(userPosition.nusdDebt)
                                ) - parseFloat(repayAmount)
                              ).toFixed(4)}{" "}
                              NUSD
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="alert alert-info">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      className="stroke-current shrink-0 w-6 h-6"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      ></path>
                    </svg>
                    <span>
                      Repaying can improve your health factor and reduce
                      liquidation risk
                    </span>
                  </div>

                  {userPosition && userPosition.nusdDebt.gt(0) ? (
                    <button
                      className="btn btn-primary w-full"
                      onClick={handleRepay}
                      disabled={
                        loading || !repayAmount || parseFloat(repayAmount) <= 0
                      }
                    >
                      {loading ? (
                        <span className="loading loading-spinner"></span>
                      ) : (
                        "Repay NUSD"
                      )}
                    </button>
                  ) : (
                    <div className="alert alert-success">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="stroke-current shrink-0 h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>You currently have no debt to repay</span>
                    </div>
                  )}
                </div>
              )}

              {/* Withdraw Tab */}
              {activeTab === "withdraw" && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Withdraw Collateral</h3>
                  <p className="text-gray-600">
                    Withdraw your collateral (ensure healthy position)
                  </p>

                  {/* Deposited Collateral - Main Focus */}
                  {userPosition && userPosition.amounts.length > 0 ? (
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border-l-4 border-purple-500">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-medium text-gray-700">
                            Deposited Amount:
                          </span>
                          <span className="text-xl font-bold text-gray-900">
                            {formatAmount(userPosition.amounts[0])} tAAPL
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-medium text-gray-700">
                            Collateral Value:
                          </span>
                          <span className="text-xl font-bold text-purple-600">
                            ${calculateCollateralValue()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500 text-center">
                      <div className="text-blue-600 mb-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-12 w-12 mx-auto mb-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                          />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-blue-800 mb-2">
                        No Collateral
                      </h3>
                      <p className="text-blue-600">
                        You currently have no collateral to withdraw
                      </p>
                    </div>
                  )}

                  {/* Position Health Info */}
                  {userPosition && userPosition.amounts.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">
                            Current Debt:
                          </span>
                          <span className="text-lg font-bold text-orange-600">
                            {formatAmount(userPosition.nusdDebt)} NUSD
                          </span>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-gray-400">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">
                            Health Factor:
                          </span>
                          <span
                            className={`text-lg font-bold ${getHealthFactorColor(
                              userPosition.healthFactor
                            )}`}
                          >
                            {userPosition.healthFactor.eq(
                              ethers.constants.MaxUint256
                            )
                              ? "∞"
                              : `${userPosition.healthFactor.toNumber()}%`}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="form-control">
                    <div className="mb-2">
                      <label className="label-text text-base font-medium">
                        Withdraw Amount (tAAPL)
                      </label>
                    </div>
                    <div className="mb-3 space-y-1">
                      <div className="text-sm text-green-600">
                        💡 Recommended Safe Max Withdraw:{" "}
                        {userPosition && userPosition.amounts.length > 0
                          ? calculateSafeWithdrawableAmount()
                          : "0.00"}{" "}
                        tAAPL (Health Factor after withdrawal: 200%)
                      </div>
                      {userPosition &&
                        userPosition.nusdDebt.gt(0) &&
                        parseFloat(calculateMaxWithdrawableAmount()) >
                          parseFloat(calculateSafeWithdrawableAmount()) && (
                          <div className="text-sm text-red-600">
                            ⚠️ Technical Max Withdrawable:{" "}
                            {calculateMaxWithdrawableAmount()} tAAPL (Health
                            Factor after withdrawal: 150% - Risky)
                          </div>
                        )}
                    </div>
                    <input
                      type="number"
                      placeholder="0.00"
                      className="input input-bordered w-full"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      max={
                        userPosition && userPosition.amounts.length > 0
                          ? calculateMaxWithdrawableAmount()
                          : "0"
                      }
                    />
                  </div>

                  {/* Withdraw Preview */}
                  {withdrawAmount && parseFloat(withdrawAmount) > 0 && (
                    <div
                      className={`p-4 rounded-lg border-l-4 ${
                        userPosition &&
                        userPosition.nusdDebt.gt(0) &&
                        parseFloat(withdrawAmount) >
                          parseFloat(calculateSafeWithdrawableAmount())
                          ? "bg-red-50 border-red-500"
                          : "bg-yellow-50 border-yellow-500"
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-gray-700">
                            Withdraw Amount:
                          </span>
                          <span className="font-bold text-gray-900">
                            {withdrawAmount} tAAPL
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-gray-700">
                            Withdraw Value:
                          </span>
                          <span className="font-bold text-purple-600">
                            $
                            {(
                              parseFloat(withdrawAmount) *
                              parseFloat(formatPrice(tokenPrice))
                            ).toFixed(2)}
                          </span>
                        </div>
                        {userPosition && userPosition.amounts.length > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="font-medium text-gray-700">
                              Remaining Collateral:
                            </span>
                            <span className="font-bold text-gray-600">
                              {Math.max(
                                0,
                                parseFloat(
                                  formatAmount(userPosition.amounts[0])
                                ) - parseFloat(withdrawAmount)
                              ).toFixed(4)}{" "}
                              tAAPL
                            </span>
                          </div>
                        )}

                        {/* Risk Warning */}
                        {userPosition &&
                          userPosition.nusdDebt.gt(0) &&
                          parseFloat(withdrawAmount) >
                            parseFloat(calculateSafeWithdrawableAmount()) && (
                            <div className="mt-3 p-3 bg-red-100 rounded-lg border border-red-300">
                              <div className="flex items-start space-x-2">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                                  />
                                </svg>
                                <div className="text-sm">
                                  <div className="font-semibold text-red-800 mb-1">
                                    ⚠️ Risk Warning
                                  </div>
                                  <div className="text-red-700">
                                    Your planned withdrawal amount exceeds the
                                    safe recommendation! This will reduce your
                                    collateralization ratio below 200%,
                                    increasing liquidation risk.
                                    <br />
                                    <span className="font-medium">
                                      Recommended max withdrawal:{" "}
                                      {calculateSafeWithdrawableAmount()} tAAPL
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  )}

                  <div className="alert alert-warning">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="stroke-current shrink-0 h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                    <span>
                      Withdrawing collateral may affect your health factor
                    </span>
                  </div>

                  {userPosition && userPosition.amounts.length > 0 ? (
                    <button
                      className="btn btn-primary w-full"
                      onClick={handleWithdraw}
                      disabled={
                        loading ||
                        !withdrawAmount ||
                        parseFloat(withdrawAmount) <= 0
                      }
                    >
                      {loading ? (
                        <span className="loading loading-spinner"></span>
                      ) : (
                        "Withdraw Collateral"
                      )}
                    </button>
                  ) : (
                    <div className="alert alert-info">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        className="stroke-current shrink-0 w-6 h-6"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        ></path>
                      </svg>
                      <span>
                        Need to deposit collateral first before withdrawal
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
