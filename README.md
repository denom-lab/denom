# Denom - Web3 股币CDP协议

Denom是一个基于Web3技术的股票代币协议应用，支持质押股票代币、铸造稳定币、投资流动性池等功能。

## 🚀 功能特性

### 1. 铸币模块 (Minting Module)
- **质押功能**: 质押tAAPL和各类股票代币
- **持仓管理**: 实时查看当前质押资产持仓情况
- **铸造功能**: 基于质押资产铸造NUSD稳定币
- **归还功能**: 归还并销毁NUSD，影响资产持仓
- **解除质押**: 解除质押并取回股票代币

### 2. 数据面板 & 清算 (Dashboard & Liquidation)
- **持仓数据面板**: 详细持仓信息、健康度监控、清算风险评估
- **通知系统**: 实时通知、预警提示、清算通知
- **清算管理**: Claim剩余资产、预结算介绍
- **健康度监控**: 实时健康度指标、风险等级评估

### 3. 投资市场 (Investment Market)
- **流动性池**: 官方流动性池、稳定币池等
- **投资管理**: 存款、取款、收益查看
- **持仓面板**: 投资汇总、收益统计

### 4. 协议信息 (Protocol Information)
- **协议统计**: 保险池金额、国库余额、总质押价值、NUSD流通量
- **状态监控**: 系统状态、锚定状态、清算状态
- **实时数据**: 动态更新协议指标



## 🚀 快速开始

```bash
# 启动开发服务器
npx http-server frontend -p 3000 -o

# 或者使用项目脚本
npm start
```

### 配置  
```
PRIVATE_KEY=01c7939dc6827ee10bb7d26f420618c4af88c0029aa70be202f1ca7f29fe5bb4
REDDIO_RPC_URL=https://reddio-dev.reddio.com/
REDDIO_CHAIN_ID=50341

export ERC20_NUSD=0xc54E9A7D35a9a8101af66108755a4b216C198a7E
export ERC20_TAAPL=0xAcC564D527307e8a3d82E33Ff1e2d5C63B8A5ab5
export VAULT=0xbe9B0f9eC92c39205862d76F97f01eC021ceD7Fc
```

## 🌐 访问应用

启动成功后，应用会自动在浏览器中打开：
- **本地地址**: http://localhost:3000
