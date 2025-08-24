# Denom - Web3 股币 CDP 协议

Denom 是一个基于 Web3 技术的股票代币协议应用，支持质押股票代币、铸造稳定币、投资流动性池等功能。

## 🚀 功能特性

### 1. 铸币模块 (Minting Module)

- **质押功能**: 质押 tAAPL 和各类股票代币
- **持仓管理**: 实时查看当前质押资产持仓情况
- **铸造功能**: 基于质押资产铸造 NUSD 稳定币
- **归还功能**: 归还并销毁 NUSD，影响资产持仓
- **解除质押**: 解除质押并取回股票代币

### 2. 数据面板 & 清算 (Dashboard & Liquidation)

- **持仓数据面板**: 详细持仓信息、健康度监控、清算风险评估
- **健康度监控**: 实时健康度指标、风险等级评估
- **清算管理**: 清算不健康仓位、Claim 剩余资产

### 3. 投资市场 (Investment Market)

- **流动性池**: 官方流动性池、稳定币池等
- **投资管理**: 存款、取款、收益查看
- **持仓面板**: 投资汇总、收益统计

### 4. 协议信息 (Protocol Information)

- **协议统计**: 保险池金额、国库余额、总质押价值、NUSD 流通量
- **状态监控**: 系统状态、锚定状态、清算状态
- **实时数据**: 动态更新协议指标

## 🛠️ 技术栈

- **Hardhat 3 Beta**: 开发框架
- **Solidity 0.8.28**: 智能合约语言
- **OpenZeppelin**: 安全合约库
- **TypeScript**: 测试和脚本语言
- **Mocha**: 测试框架

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 编译合约

```bash
npx hardhat compile
```

### 运行测试

```bash
npx hardhat test
```

### 部署合约

```bash
npx hardhat ignition deploy ignition/modules/Denom.ts
```

### 运行演示

```bash
npx hardhat run scripts/demo.ts
```

## 📋 合约架构

### 核心合约

- **Denom.sol**: 主合约，整合所有功能模块
- **NUSD.sol**: NUSD 稳定币合约
- **StockToken.sol**: 股票代币合约（如 tAAPL）
- **IPriceOracle.sol**: 价格预言机接口
- **MockPriceOracle.sol**: 模拟价格预言机实现

### 关键参数

- **清算阈值**: 150% 抵押率
- **清算罚金**: 10%
- **最小健康因子**: 100%
- **价格精度**: 1e8 (8 位小数)

## 📊 测试覆盖

项目包含 17 个全面的测试用例，覆盖：

- ✅ 合约部署和初始化
- ✅ 代币管理（添加/移除支持的代币）
- ✅ 铸币模块（质押、铸造、归还、提取）
- ✅ 健康因子计算和清算
- ✅ 投资市场（流动性池管理）
- ✅ 协议信息查询

## 🎯 使用示例

### 质押和铸造

```javascript
// 质押 100 个 tAAPL 代币
await stockToken.approve(denomAddress, ethers.parseEther("100"));
await denom.deposit(stockTokenAddress, ethers.parseEther("100"));

// 铸造 5000 NUSD
await denom.mint(ethers.parseEther("5000"));
```

### 查看持仓

```javascript
const [tokens, amounts, debt, healthFactor] = await denom.getPosition(
  userAddress
);
console.log("健康因子:", healthFactor.toString());
```

### 投资流动性池

```javascript
// 向流动性池存款
await stockToken.approve(denomAddress, ethers.parseEther("100"));
await denom.depositToPool(0, ethers.parseEther("100"));
```

## ⚠️ 注意事项

1. 这是一个演示项目，用于展示 CDP 协议的核心功能
2. 价格预言机使用模拟实现，生产环境需要使用真实的价格数据源
3. 建议在测试网络上进行充分测试后再部署到主网
4. 清算机制需要外部清算者参与才能正常运行

## 📄 许可证

MIT License
