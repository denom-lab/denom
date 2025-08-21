require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    reddio: {
      url: process.env.REDDIO_RPC_URL || "https://reddio-dev.reddio.com/",
      chainId: parseInt(process.env.REDDIO_CHAIN_ID || "50341"),
      accounts: [process.env.PRIVATE_KEY || "01c7939dc6827ee10bb7d26f420618c4af88c0029aa70be202f1ca7f29fe5bb4"],
    },
    hardhat: {
      chainId: 1337,
    },
  },
  paths: {
    sources: "./src",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
