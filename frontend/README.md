# Denom Protocol Frontend

一个现代化的去中心化稳定币协议前端界面，基于 React + TypeScript + Vite 构建。

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:5173/` 查看应用。

## 📋 功能特性

- ✅ **钱包连接**: 支持 MetaMask 等 Web3 钱包
- ✅ **现代化 UI**: 使用 Tailwind CSS + DaisyUI 构建美观界面
- ✅ **响应式设计**: 完美适配桌面端和移动端
- ✅ **实时数据**: 显示用户位置、健康因子、协议统计
- ✅ **完整功能**: 存款、铸币、还款、提取等 DeFi 操作
- ✅ **网络支持**: 已配置 Reddio 测试网络

## 🛠️ 技术栈

- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式**: Tailwind CSS + DaisyUI
- **Web3**: ethers.js v5
- **路由**: React Router
- **状态管理**: React Context API

## 📖 使用说明

详细的使用说明请查看 [用户指南](./USER_GUIDE.md)。

## 🌐 网络配置

### Reddio 测试网络

- **RPC URL**: `https://reddio-dev.reddio.com/`
- **Chain ID**: `50341`
- **货币符号**: `RDO`

### 合约地址

- **Denom**: `0xF50D6c0AdB150736a1899Dc7999129107cEfEc7d`
- **NUSD**: `0x0298b92d63514c5D7cE6b6bD09B1DaACED9a7e03`
- **StockToken**: `0x59dbc9B611802FFc3d951cAc36245e074C339F4d`
- **PriceOracle**: `0xA2EAc0d7c6F454bFEc73228443E7b921F4F467ff`

## 🔧 开发

### 项目结构

```
frontend/
├── src/
│   ├── components/     # React 组件
│   ├── contexts/       # React Context
│   ├── hooks/          # 自定义 Hooks
│   ├── pages/          # 页面组件
│   ├── types/          # TypeScript 类型定义
│   └── config/         # 配置文件
├── public/             # 静态资源
└── USER_GUIDE.md       # 用户使用指南
```

### 可用脚本

- `npm run dev` - 启动开发服务器
- `npm run build` - 构建生产版本
- `npm run preview` - 预览生产构建
- `npm run lint` - 运行 ESLint

## 🎨 界面预览

- **连接钱包**: 美观的钱包连接界面
- **仪表板**: 显示用户位置和协议统计
- **铸币功能**: 完整的 DeFi 操作界面
- **响应式**: 适配各种屏幕尺寸

## ⚠️ 注意事项

1. **测试环境**: 当前部署在 Reddio 测试网络
2. **钱包要求**: 需要安装 MetaMask 或兼容的 Web3 钱包
3. **测试代币**: 使用提供的私钥导入测试账户
4. **网络配置**: 确保钱包已添加 Reddio 测试网络

## 📞 支持

如遇问题，请检查：

- 浏览器控制台错误信息
- MetaMask 网络配置
- 测试账户余额

---

**版本**: v1.0.0  
**构建时间**: 2025 年 1 月  
**网络**: Reddio 测试网络
