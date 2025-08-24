import React from "react";
import { WalletConnect } from "../components/common/WalletConnect";

export function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Floating Orbs */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full opacity-30 animate-bounce"></div>
        <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-gradient-to-r from-green-400 to-blue-500 rounded-full opacity-15 animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 right-1/3 w-28 h-28 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full opacity-25 animate-bounce delay-500"></div>

        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 pt-40 pb-16">
        <div className="text-center max-w-4xl mx-auto">
          {/* Logo and Brand */}
          <div className="mb-8 animate-fade-in">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full gradient-bg flex items-center justify-center shadow-2xl animate-float">
              <span className="text-white font-bold text-4xl">D</span>
            </div>
            <h1 className="text-6xl md:text-7xl font-bold text-gradient mb-4 animate-slide-up">
              Denom Protocol
            </h1>
            <div className="w-32 h-1 bg-gradient-to-r from-blue-500 to-purple-600 mx-auto rounded-full animate-expand"></div>
          </div>

          {/* Hero Description */}
          <div className="mb-12 animate-fade-in-delay">
            <p className="text-2xl md:text-3xl text-gray-700 font-light mb-6 leading-relaxed">
              Next-Generation Decentralized Stablecoin Protocol
            </p>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Safely mint NUSD stablecoins through innovative Collateralized
              Debt Position (CDP) mechanisms. Experience transparent, efficient,
              and decentralized DeFi financial services.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 animate-slide-up-delay">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-2xl">🏦</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Secure Collateral
              </h3>
              <p className="text-gray-600">
                Use premium assets like tAAPL as collateral with 150%
                over-collateralization to ensure system security
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-green-500 to-blue-600 flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Stablecoin Minting
              </h3>
              <p className="text-gray-600">
                Mint NUSD stablecoins pegged 1:1 to USD, providing stable value
                storage and transaction medium
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Real-time Management
              </h3>
              <p className="text-gray-600">
                Monitor health factors in real-time with intelligent risk
                management to ensure your assets are secure
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 animate-fade-in-delay-2">
            <div className="text-center">
              <div className="text-3xl font-bold text-gradient mb-1">150%</div>
              <div className="text-sm text-gray-600">Min Collateral Ratio</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gradient mb-1">24/7</div>
              <div className="text-sm text-gray-600">Always Available</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gradient mb-1">0%</div>
              <div className="text-sm text-gray-600">Minting Fee</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gradient mb-1">∞</div>
              <div className="text-sm text-gray-600">Unlimited Potential</div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="animate-bounce-in">
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl max-w-md mx-auto">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Start Your DeFi Journey
              </h2>
              <p className="text-gray-600 mb-6">
                Connect your wallet to experience the next-generation stablecoin
                protocol
              </p>
              <div className="transform hover:scale-105 transition-transform duration-200">
                <WalletConnect />
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="mt-16 text-center animate-fade-in-delay-3">
            <p className="text-gray-500 text-sm">
              Built on Ethereum • Open Source Protocol • Community Driven
            </p>
            <div className="flex justify-center space-x-6 mt-4">
              <span className="text-gray-400 text-xs">🔒 Security Audited</span>
              <span className="text-gray-400 text-xs">🌐 Decentralized</span>
              <span className="text-gray-400 text-xs">
                📊 Transparent Governance
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }

          @keyframes fade-in {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }

          @keyframes slide-up {
            from { opacity: 0; transform: translateY(50px); }
            to { opacity: 1; transform: translateY(0); }
          }

          @keyframes expand {
            from { width: 0; }
            to { width: 8rem; }
          }

          @keyframes bounce-in {
            0% { opacity: 0; transform: scale(0.3); }
            50% { transform: scale(1.05); }
            70% { transform: scale(0.9); }
            100% { opacity: 1; transform: scale(1); }
          }

          .animate-float {
            animation: float 6s ease-in-out infinite;
          }

          .animate-fade-in {
            animation: fade-in 1s ease-out;
          }

          .animate-fade-in-delay {
            animation: fade-in 1s ease-out 0.3s both;
          }

          .animate-fade-in-delay-2 {
            animation: fade-in 1s ease-out 0.6s both;
          }

          .animate-fade-in-delay-3 {
            animation: fade-in 1s ease-out 0.9s both;
          }

          .animate-slide-up {
            animation: slide-up 1s ease-out;
          }

          .animate-slide-up-delay {
            animation: slide-up 1s ease-out 0.4s both;
          }

          .animate-expand {
            animation: expand 1s ease-out 0.5s both;
          }

          .animate-bounce-in {
            animation: bounce-in 1s ease-out 0.8s both;
          }

          .bg-grid-pattern {
            background-image: 
              linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px);
            background-size: 50px 50px;
          }
        `,
        }}
      />
    </div>
  );
}
