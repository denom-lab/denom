import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { Link } from "react-router-dom";
import { useWeb3 } from "../contexts/Web3Context";
import { useContract } from "../hooks/useContract";
import { CONTRACT_ADDRESSES } from "../config/contracts";
import type { UserPosition, ProtocolStats, SystemStatus } from "../types";

export function Dashboard() {
  const { state } = useWeb3();
  const {
    getUserPosition,
    getProtocolStats,
    getSystemStatus,
    getHealthFactor,
    getTokenPrice,
  } = useContract();

  const [userPosition, setUserPosition] = useState<UserPosition | null>(null);
  const [protocolStats, setProtocolStats] = useState<ProtocolStats | null>(
    null
  );
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [tokenPrice, setTokenPrice] = useState<ethers.BigNumber>(
    ethers.constants.Zero
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!state.wallet.isConnected || !state.wallet.address) return;

      try {
        setLoading(true);
        const [position, stats, status, price] = await Promise.all([
          getUserPosition(state.wallet.address),
          getProtocolStats(),
          getSystemStatus(),
          getTokenPrice(CONTRACT_ADDRESSES.stockToken),
        ]);

        setUserPosition(position);
        setProtocolStats(stats);
        setSystemStatus(status);
        setTokenPrice(price);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [
    state.wallet.isConnected,
    state.wallet.address,
    getUserPosition,
    getProtocolStats,
    getSystemStatus,
    getTokenPrice,
  ]);

  const formatAmount = (amount: ethers.BigNumber, decimals = 18) => {
    return parseFloat(ethers.utils.formatUnits(amount, decimals)).toFixed(4);
  };

  const formatPrice = (price: ethers.BigNumber) => {
    return parseFloat(ethers.utils.formatUnits(price, 8)).toFixed(2);
  };

  const getTokenSymbol = (tokenAddress: string) => {
    if (tokenAddress === CONTRACT_ADDRESSES.stockToken) {
      return "tAAPL";
    }
    return "Unknown";
  };

  const calculateTokenValue = (
    amount: ethers.BigNumber,
    price: ethers.BigNumber
  ) => {
    if (price.eq(0)) return "0.00";
    const value = amount.mul(price).div(ethers.utils.parseUnits("1", 8));
    return parseFloat(ethers.utils.formatEther(value)).toFixed(2);
  };

  const getHealthFactorColor = (healthFactor: ethers.BigNumber) => {
    const factor = healthFactor.toNumber();
    if (factor >= 200) return "text-green-500";
    if (factor >= 150) return "text-yellow-500";
    return "text-red-500";
  };

  const getHealthFactorLabel = (healthFactor: ethers.BigNumber) => {
    const factor = healthFactor.toNumber();
    if (factor >= 200) return "Healthy";
    if (factor >= 150) return "Warning";
    return "Danger";
  };

  if (!state.wallet.isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center p-8">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full gradient-bg flex items-center justify-center">
            <svg
              className="w-12 h-12 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Welcome to Denom Protocol
          </h2>
          <p className="text-gray-600 text-lg">
            Connect your wallet to view your dashboard and start managing your
            positions
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8 fade-in">
          <h1 className="text-4xl font-bold text-gradient mb-2">Dashboard</h1>
          <p className="text-gray-600 text-lg">
            Overview of your positions and protocol statistics
          </p>
        </div>

        {/* User Position and System Status Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* User Position Card */}
          <div className="stat-card card-hover fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Your Position
              </h2>
              <Link
                to="/mint/deposit"
                className="w-10 h-10 rounded-lg gradient-bg flex items-center justify-center hover:shadow-lg transition-all duration-200 hover:scale-105"
                title="Manage Position"
              >
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </Link>
            </div>

            {userPosition && userPosition.nusdDebt.gt(0) ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-600 font-medium">NUSD Debt:</span>
                  <span className="font-bold text-lg text-gray-800">
                    {formatAmount(userPosition.nusdDebt)} NUSD
                  </span>
                </div>

                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-600 font-medium">
                    Health Factor:
                  </span>
                  <div className="text-right">
                    <span
                      className={`font-bold text-lg ${getHealthFactorColor(
                        userPosition.healthFactor
                      )}`}
                    >
                      {userPosition.healthFactor.eq(ethers.constants.MaxUint256)
                        ? "∞"
                        : `${userPosition.healthFactor.toNumber()}%`}
                    </span>
                    <div
                      className={`text-sm font-medium ${getHealthFactorColor(
                        userPosition.healthFactor
                      )}`}
                    >
                      {getHealthFactorLabel(userPosition.healthFactor)}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-bold text-gray-800 mb-4">
                    Collateral Holdings:
                  </h3>
                  <div className="space-y-3">
                    {userPosition.tokens.map((token, index) => {
                      const amount = userPosition.amounts[index];
                      if (amount.gt(0)) {
                        const tokenSymbol = getTokenSymbol(token);
                        const tokenValue = calculateTokenValue(
                          amount,
                          tokenPrice
                        );
                        return (
                          <div
                            key={token}
                            className="flex justify-between items-center p-3 bg-blue-50 rounded-lg"
                          >
                            <span className="text-gray-600 font-medium">
                              {tokenSymbol}:
                            </span>
                            <div className="text-right">
                              <div className="font-semibold text-gray-800">
                                {formatAmount(amount)} {tokenSymbol}
                              </div>
                              <div className="text-sm text-gray-600">
                                ${tokenValue} USD
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Link
                  to="/mint/deposit"
                  className="w-16 h-16 mx-auto mb-4 rounded-full gradient-bg flex items-center justify-center hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer"
                  title="Start Managing Position"
                >
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </Link>
                <p className="text-gray-500 text-lg mb-2">No active position</p>
                <p className="text-gray-400">
                  Start by depositing collateral and minting NUSD
                </p>
              </div>
            )}
          </div>

          {/* System Status Card */}
          <div className="stat-card card-hover fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                System Status
              </h2>
              <div className="w-10 h-10 rounded-lg gradient-bg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>

            {systemStatus && (
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-600 font-medium">System:</span>
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        systemStatus.systemActive
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                    ></div>
                    <span
                      className={`font-semibold ${
                        systemStatus.systemActive
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {systemStatus.systemActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-600 font-medium">Peg Status:</span>
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        systemStatus.pegStable ? "bg-green-500" : "bg-red-500"
                      }`}
                    ></div>
                    <span
                      className={`font-semibold ${
                        systemStatus.pegStable
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {systemStatus.pegStable ? "Stable" : "Unstable"}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-600 font-medium">
                    Liquidations:
                  </span>
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        systemStatus.liquidationActive
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                    ></div>
                    <span
                      className={`font-semibold ${
                        systemStatus.liquidationActive
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {systemStatus.liquidationActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Protocol Statistics */}
        <div className="stat-card card-hover fade-in">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-800">
              Protocol Statistics
            </h2>
            <div className="w-10 h-10 rounded-lg gradient-bg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
            </div>
          </div>

          {protocolStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  ${formatAmount(protocolStats.totalCollateralValue)}
                </div>
                <div className="text-sm font-semibold text-blue-800 mb-1">
                  Total Collateral Value
                </div>
                <div className="text-xs text-blue-600">
                  USD value of all collateral
                </div>
              </div>

              <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {formatAmount(protocolStats.nusdSupply)}
                </div>
                <div className="text-sm font-semibold text-purple-800 mb-1">
                  NUSD Supply
                </div>
                <div className="text-xs text-purple-600">
                  Total NUSD in circulation
                </div>
              </div>

              <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  ${formatAmount(protocolStats.insurancePoolBalance)}
                </div>
                <div className="text-sm font-semibold text-green-800 mb-1">
                  Insurance Pool
                </div>
                <div className="text-xs text-green-600">
                  Protocol insurance fund
                </div>
              </div>

              <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl">
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  ${formatAmount(protocolStats.treasuryBalance)}
                </div>
                <div className="text-sm font-semibold text-orange-800 mb-1">
                  Treasury
                </div>
                <div className="text-xs text-orange-600">Protocol treasury</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
