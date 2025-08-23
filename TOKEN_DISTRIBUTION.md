# Denom Protocol - Token Distribution Summary

## 已部署的合约地址 (Reddio Network - Chain ID: 50341)

### 主要合约

- **Denom Protocol**: `0x52Ce8FFaE19De327324DbBC403f351921CadA992`
- **NUSD (稳定币)**: `0xEe4DFf1252bAb4e86DeF663f8f208d5654eCfe0F`
- **tAAPL (抵押品代币)**: `0x887127176739035107aB3b3EfE0F63F5b4C8c119`
- **MockPriceOracle**: `0x7E5837E765aeb18bba84d8293D135923f9e44639`

## ERC20 代币详情

### 1. tAAPL (Test Apple Token)

- **合约地址**: `0x887127176739035107aB3b3EfE0F63F5b4C8c119`
- **名称**: Test Apple Token
- **符号**: tAAPL
- **精度**: 18 decimals
- **总供应量**: 1,000,000 tAAPL
- **当前价格**: $100 USD (由 MockPriceOracle 设置)

### 2. NUSD (Stablecoin)

- **合约地址**: `0xEe4DFf1252bAb4e86DeF663f8f208d5654eCfe0F`
- **名称**: NUSD
- **符号**: NUSD
- **精度**: 18 decimals
- **总供应量**: 0 (只能通过 Denom 协议铸造)
- **目标价格**: $1 USD

## 代币分配情况

### tAAPL 代币分配

每个测试地址已分配 **10,000 tAAPL** 代币：

| 地址                                         | tAAPL 余额    | 用途        |
| -------------------------------------------- | ------------- | ----------- |
| `0x94ce7258eef436fc035758126a20a9a8e2b22e70` | 10,000 tAAPL  | 测试账户 1  |
| `0x36ff4b924d9f4835d547004d532cdbfc546352d9` | 10,000 tAAPL  | 测试账户 2  |
| `0x3bdc2f2ba0874336f75889e9e03414e3441d70ae` | 10,000 tAAPL  | 测试账户 3  |
| `0x53fae859246f484a860f2cffda8657f37daeab89` | 10,000 tAAPL  | 测试账户 4  |
| `0x502dc547576265661a1986c38369a6eb23b17172` | 10,000 tAAPL  | 测试账户 5  |
| `0x36a15F8d63742eAAbF9EBb32a8551Db13d6A3167` | 950,000 tAAPL | 部署者/储备 |

**总计**: 1,000,000 tAAPL (100%分配完成)

### NUSD 代币分配

- **初始供应量**: 0 NUSD
- **铸造方式**: 只能通过 Denom 协议，使用 tAAPL 作为抵押品铸造
- **销毁方式**: 通过还款销毁 NUSD

## 如何使用

### 1. 连接钱包

- 确保 MetaMask 连接到 Reddio 网络 (Chain ID: 50341)
- 选择有 tAAPL 余额的测试账户

### 2. 存入抵押品

- 在前端界面选择"Deposit"标签
- 输入要存入的 tAAPL 数量
- 确认交易

### 3. 铸造 NUSD

- 在"Mint"标签中输入要铸造的 NUSD 数量
- 确保健康因子保持在 150%以上
- 确认交易

### 4. 管理头寸

- 查看当前抵押品和债务情况
- 通过"Repay"还款提高健康因子
- 通过"Withdraw"提取多余抵押品

## 重要提醒

1. **健康因子**: 必须保持在 150%以上，否则面临清算风险
2. **价格波动**: tAAPL 价格目前固定为$100，实际使用中会有波动
3. **测试环境**: 这是测试网络，代币无实际价值
4. **Gas 费用**: 所有交易需要 RDO 代币支付 gas 费

## 技术支持

如需更多 tAAPL 代币或遇到问题，可以：

1. 运行 `npx hardhat run scripts/distribute-tokens.ts --network reddio` 重新分发代币
2. 检查合约地址是否正确配置在前端
3. 确认网络连接到 Reddio 测试网
