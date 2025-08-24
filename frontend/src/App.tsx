import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Web3Provider, useWeb3 } from "./contexts/Web3Context";
import { Navbar } from "./components/common/Navbar";
import { Landing } from "./pages/Landing";
import { Dashboard } from "./pages/Dashboard";
import { Mint } from "./pages/Mint";

function AppContent() {
  const { state } = useWeb3();

  // Show landing page when wallet is not connected
  if (!state.wallet.isConnected) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <Landing />
      </div>
    );
  }

  // Show main app when wallet is connected
  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />
      <main className="pt-20 pb-16">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/mint" element={<Mint />} />
          <Route path="/mint/:tab" element={<Mint />} />
          <Route
            path="/invest"
            element={
              <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-4">Investment Market</h2>
                  <p className="text-gray-600">Coming Soon...</p>
                </div>
              </div>
            }
          />
          <Route
            path="/liquidate"
            element={
              <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-4">
                    Liquidation Market
                  </h2>
                  <p className="text-gray-600">Coming Soon...</p>
                </div>
              </div>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Web3Provider>
      <Router>
        <AppContent />
      </Router>
    </Web3Provider>
  );
}

export default App;
