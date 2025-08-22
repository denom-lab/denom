# Vault 智能合约

这是一个支持多代币质押和借贷的智能合约系统，允许用户质押ERC20代币来借贷NUSD稳定币。

## 功能特性

### 1. 代币质押
- 支持多种ERC20代币质押
- 动态价格管理（由前端/管理员设置）
- 质押后显示可铸造的NUSD数量

### 2. NUSD借贷
- 基于质押代币价值的借贷
- 70%抵押率要求
- 自动铸造NUSD给用户

### 3. NUSD归还
- 用户归还NUSD到Vault合约
- 更新借贷记录

### 4. 代币解质押
- 销毁相应数量的NUSD
- 返还质押的代币给用户

## 合约架构

### Vault.sol
主要的质押和借贷合约，包含：
- 代币价格管理
- 用户质押信息管理
- 借贷逻辑
- 解质押逻辑

### NUSD.sol
稳定币合约，提供：
- 铸造和销毁功能
- 权限管理
- 暂停机制

## 部署步骤

1. 部署NUSD合约
2. 部署Vault合约
3. 将Vault设为NUSD的铸造者
4. 添加支持的代币和价格

```bash
# 部署合约
npx hardhat run scripts/deploy.js --network <network>

# 运行测试
npx hardhat test
```

## 使用方法

### 添加支持的代币
```solidity
// 只有合约所有者可以执行
await vault.addSupportedToken(tokenAddress, price);
// price: 18位精度，例如 $100 = 100 * 10^18
```

### 质押代币
```solidity
// 1. 用户授权Vault合约使用代币
await token.approve(vault.address, amount);

// 2. 质押代币
await vault.stakeToken(token.address, amount);
```

### 借贷NUSD
```solidity
// 质押代币后，可以借贷NUSD
await vault.borrowNUSD(amount);
```

### 归还NUSD
```solidity
// 1. 授权Vault合约使用NUSD
await nusd.approve(vault.address, amount);

// 2. 归还NUSD
await vault.repayNUSD(amount);
```

### 解质押代币
```solidity
// 解质押代币，会自动销毁相应的NUSD
await vault.unstakeToken(token.address, amount);
```

## 查询功能

### 获取质押信息
```solidity
// 获取用户质押的代币数量
const stakedAmount = await vault.getUserStakedAmount(user, token);

// 获取用户借入的NUSD数量
const borrowedAmount = await vault.getUserBorrowedNUSD(user);

// 获取用户质押的所有代币
const [tokens, amounts] = await vault.getUserStakedTokens(user);
```

### 获取代币信息
```solidity
// 检查代币是否被支持
const isSupported = await vault.isTokenSupported(token);

// 获取代币价格
const price = await vault.getTokenPrice(token);

// 获取支持的代币列表
const tokens = await vault.getAllSupportedTokens();
```

### 计算NUSD价值
```solidity
// 计算代币可铸造的NUSD数量
const nusdValue = await vault.calculateNUSDValue(token, amount);

// 计算用户总抵押品价值
const totalValue = await vault.calculateTotalCollateralValue(user);
```

## 安全特性

- **重入攻击防护**: 使用ReentrancyGuard
- **暂停机制**: 紧急情况下可暂停合约
- **权限控制**: 关键功能仅限所有者
- **抵押率检查**: 防止过度借贷

## 事件

合约会发出以下事件：
- `TokenAdded`: 添加新代币
- `TokenPriceUpdated`: 更新代币价格
- `TokenStaked`: 质押代币
- `NUSDBorrowed`: 借贷NUSD
- `NUSDRepaid`: 归还NUSD
- `TokenUnstaked`: 解质押代币

## 注意事项

1. 价格精度为18位小数
2. 抵押率为70%，即质押价值必须大于借贷价值的1.43倍
3. 解质押时会自动销毁相应数量的NUSD
4. 只有合约所有者可以添加/移除支持的代币
5. 合约支持暂停功能，暂停期间无法执行关键操作

## 测试

运行测试套件：
```bash
npx hardhat test
```

测试覆盖：
- 基本功能测试
- 质押功能测试
- 借贷功能测试
- 归还功能测试
- 解质押功能测试
- 价格管理测试
- 安全功能测试
