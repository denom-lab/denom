require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  // 使用腾讯镜像源
  compilers: {
    solc: {
      version: "0.8.24",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
      },
    },
  },
  // 配置腾讯镜像源
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
  // 腾讯镜像源配置
  mocha: {
    timeout: 40000,
  },
  // 自定义编译器下载配置
  custom: {
    solcDownloadBaseUrl: "https://mirrors.cloud.tencent.com/solc-bin/bin/",
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
