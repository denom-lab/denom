# Denom 智能合约

本项目包含Denom协议的智能合约，用于管理股票代币质押和NUSD稳定币的铸造/销毁。

## 📋 合约概述

### 1. tAAPL.sol
- **功能**: Apple股票代币合约
- **Symbol**: tAAPL
- **Name**: Apple Stock
- **Decimals**: 18
- **最大供应量**: 1亿股
- **特性**: 可升级的价格Oracle、铸造/销毁权限管理

### 2. NUSD.sol
- **功能**: Denom USD稳定币合约
- **Symbol**: NUSD
- **Name**: Denom USD
- **Decimals**: 18
- **最大供应量**: 无上限
- **特性**: 多铸造者权限、暂停功能、安全机制

### 3. Vault.sol
- **功能**: 质押金库合约
- **作用**: 管理股票代币质押和NUSD铸造/销毁
- **质押率**: 70%
- **清算阈值**: 80%
- **清算罚金**: 10%

## 🚀 部署说明

### 网络配置
- **网络**: Reddio测试网
- **RPC URL**: https://reddio-dev.reddio.com/
- **Chain ID**: 50341
- **测试账户私钥**: 01c7939dc6827ee10bb7d26f420618c4af88c0029aa70be202f1ca7f29fe5bb4

### 部署步骤

1. **安装依赖**
```bash
npm install
```

2. **编译合约**
```bash
npx hardhat compile
```

3. **部署到Reddio测试网**
```bash
npx hardhat run scripts/deploy.js --network reddio
```

4. **验证部署结果**
部署完成后会生成 `deployment.json` 文件，包含所有合约地址和部署信息。

### 部署顺序
1. 部署 tAAPL 合约
2. 部署 NUSD 合约
3. 部署 Vault 合约
4. 配置权限关系

## 🔐 权限配置

### 部署后自动配置
- Vault 被设为 NUSD 的 minter
- Vault 被设为 tAAPL 的 priceOracle
- 部署者拥有所有合约的所有权

### 手动权限管理
```solidity
// 添加NUSD铸造者
await nusd.addMinter(vaultAddress);

// 更新tAAPL价格Oracle
await taapl.updatePriceOracle(vaultAddress);
```

## 📊 合约交互

### 质押流程
1. 用户批准 tAAPL 给 Vault
2. 调用 `openPosition()` 开启质押位置
3. 质押股票代币，获得 NUSD

### 赎回流程
1. 用户偿还 NUSD
2. 调用 `closePosition()` 关闭质押位置
3. 取回质押的股票代币

### 清算机制
- 当质押率低于80%时，位置可被清算
- 清算者获得10%的质押品作为奖励
- 用户取回剩余的质押品

## 🧪 测试

### 本地测试
```bash
npx hardhat test
```

### 测试网测试
```bash
npx hardhat test --network reddio
```

## 🔍 合约验证

部署完成后，可以在Reddio测试网浏览器中查看合约：
- 网络: https://reddio-dev.reddio.com/
- 输入合约地址即可查看详情

## 📁 项目结构

```
contracts/
├── src/                # 智能合约源码
│   ├── tAAPL.sol      # Apple股票代币
│   ├── NUSD.sol       # 稳定币
│   └── Vault.sol      # 质押金库
├── scripts/            # 部署脚本
│   └── deploy.js      # 主部署脚本
├── test/               # 测试文件
├── hardhat.config.js   # Hardhat配置
├── package.json        # 项目依赖
└── README.md          # 项目说明
```

## ⚠️ 注意事项

1. **私钥安全**: 测试账户私钥仅用于测试，生产环境请使用安全的密钥管理
2. **网络确认**: 确保连接到正确的Reddio测试网
3. **Gas费用**: 部署需要足够的测试代币支付Gas费用
4. **权限管理**: 部署后请妥善管理合约权限

## 🆘 故障排除

### 常见问题
1. **编译错误**: 检查Solidity版本兼容性
2. **部署失败**: 确认网络连接和账户余额
3. **权限错误**: 检查合约权限配置

### 获取帮助
- 查看Hardhat错误日志
- 检查网络连接状态
- 验证账户余额和权限

## 📞 支持

如有问题，请查看：
- Hardhat官方文档: https://hardhat.org/
- OpenZeppelin合约库: https://docs.openzeppelin.com/
- Reddio测试网: https://reddio-dev.reddio.com/
