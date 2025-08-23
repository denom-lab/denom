import React from "react";
import { useWeb3 } from "../../contexts/Web3Context";
import { ethers } from "ethers";

export function WalletConnect() {
  const { state, connectWallet, disconnectWallet, switchNetwork } = useWeb3();

  // Debug: Log current state
  console.log("WalletConnect render - current state:", state.wallet);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (balance: ethers.BigNumber | null) => {
    if (!balance) return "0.00";
    return parseFloat(ethers.utils.formatEther(balance)).toFixed(4);
  };

  if (!state.wallet.isConnected) {
    return (
      <button
        onClick={() => connectWallet(true)}
        className="btn-gradient px-4 py-2 rounded-lg font-medium text-sm shadow-sm hover:shadow-md transition-all duration-300"
      >
        Connect Wallet
      </button>
    );
  }

  const isCorrectNetwork = state.wallet.chainId === 50341; // Using Reddio network

  return (
    <div className="relative">
      <div className="dropdown dropdown-end">
        <div
          tabIndex={0}
          role="button"
          className="glass-effect px-4 py-2 rounded-xl border border-gray-200 hover:border-blue-300 transition-all duration-200 cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <div
              className={`w-3 h-3 rounded-full ${
                isCorrectNetwork ? "bg-green-500" : "bg-yellow-500"
              }`}
            ></div>
            <div className="flex flex-col">
              <span className="font-semibold text-gray-800 text-sm">
                {formatAddress(state.wallet.address!)}
              </span>
              <span className="text-xs text-gray-500">
                {formatBalance(state.wallet.balance)} RDO
              </span>
            </div>
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>

        <div
          tabIndex={0}
          className="dropdown-content z-50 mt-2 p-4 shadow-xl bg-white rounded-xl border border-gray-100 w-80"
        >
          <div className="space-y-4">
            {/* Wallet Info */}
            <div className="border-b border-gray-100 pb-4">
              <h3 className="font-semibold text-gray-800 mb-3">
                Wallet Information
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Address</span>
                  <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                    {formatAddress(state.wallet.address!)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Balance</span>
                  <span className="text-sm font-semibold text-gray-800">
                    {formatBalance(state.wallet.balance)} RDO
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Network</span>
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        isCorrectNetwork ? "bg-green-500" : "bg-yellow-500"
                      }`}
                    ></div>
                    <span className="text-sm text-gray-800">
                      {isCorrectNetwork
                        ? "Reddio Network"
                        : `Chain ${state.wallet.chainId}`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              {!isCorrectNetwork && (
                <button
                  onClick={switchNetwork}
                  className="w-full btn-outline text-sm py-2 rounded-lg"
                >
                  Switch to Reddio Network
                </button>
              )}

              <button
                onClick={disconnectWallet}
                className="w-full bg-red-50 text-red-600 hover:bg-red-100 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Disconnect Wallet
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
