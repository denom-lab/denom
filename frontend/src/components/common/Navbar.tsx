import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useWeb3 } from "../../contexts/Web3Context";
import { WalletConnect } from "./WalletConnect";

export function Navbar() {
  const location = useLocation();
  const { state } = useWeb3();

  // Simple navbar for landing page (when wallet not connected)
  if (!state.wallet.isConnected) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200 py-3 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo and Brand */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
              <span className="text-white font-bold text-lg">D</span>
            </div>
            <span className="text-gradient text-2xl font-bold">Denom</span>
          </Link>

          {/* Wallet Connect Button */}
          <WalletConnect />
        </div>
      </nav>
    );
  }

  const navItems = [
    { path: "/", label: "Dashboard", icon: "📊" },
    { path: "/mint", label: "Manage", icon: "🏦" },
    { path: "/invest", label: "Invest", icon: "💰" },
    { path: "/liquidate", label: "Liquidate", icon: "⚡" },
  ];

  // Full navbar for main app (when wallet connected)
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200 py-3 px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-8">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
              <span className="text-white font-bold text-lg">D</span>
            </div>
            <span className="text-gradient text-2xl font-bold">Denom</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  location.pathname === item.path ||
                  (item.path === "/mint" &&
                    location.pathname.startsWith("/mint"))
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Mobile Menu Button */}
        <div className="lg:hidden">
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </div>
            <ul
              tabIndex={0}
              className="dropdown-content menu p-2 shadow-lg bg-white rounded-lg w-52 mt-2"
            >
              {navItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center space-x-2 ${
                      location.pathname === item.path ||
                      (item.path === "/mint" &&
                        location.pathname.startsWith("/mint"))
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Wallet Connect */}
        <div className="hidden lg:block">
          <WalletConnect />
        </div>
      </div>

      {/* Mobile Wallet Connect */}
      <div className="lg:hidden mt-4 border-t pt-4">
        <WalletConnect />
      </div>
    </nav>
  );
}
