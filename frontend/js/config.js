// 合约配置文件
window.CONTRACT_CONFIG = {
    // 网络配置
    networks: {
        // 本地测试网络
        localhost: {
            chainId: '0x7A69', // 31337
            rpcUrl: 'http://localhost:8545',
            name: 'Localhost'
        },
        // 其他网络配置可以在这里添加
    },
    
    // Vault合约配置
    vault: {
        // 合约地址 - 部署后需要更新
        address: '0x0000000000000000000000000000000000000000', // 请替换为实际部署的地址
        abi: [
            // 添加支持的代币
            {
                "inputs": [
                    {"internalType": "address", "name": "token", "type": "address"},
                    {"internalType": "uint256", "name": "price", "type": "uint256"}
                ],
                "name": "addSupportedToken",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            // 质押代币
            {
                "inputs": [
                    {"internalType": "address", "name": "token", "type": "address"},
                    {"internalType": "uint256", "name": "amount", "type": "uint256"}
                ],
                "name": "stakeToken",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            // 借贷NUSD
            {
                "inputs": [
                    {"internalType": "uint256", "name": "amount", "type": "uint256"}
                ],
                "name": "borrowNUSD",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            // 归还NUSD
            {
                "inputs": [
                    {"internalType": "uint256", "name": "amount", "type": "uint256"}
                ],
                "name": "repayNUSD",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            // 解质押代币
            {
                "inputs": [
                    {"internalType": "address", "name": "token", "type": "address"},
                    {"internalType": "uint256", "name": "amount", "type": "uint256"}
                ],
                "name": "unstakeToken",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            // 查询函数
            {
                "inputs": [
                    {"internalType": "address", "name": "user", "type": "address"},
                    {"internalType": "address", "name": "token", "type": "address"}
                ],
                "name": "getUserStakedAmount",
                "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {"internalType": "address", "name": "user", "type": "address"}
                ],
                "name": "getUserBorrowedNUSD",
                "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {"internalType": "address", "name": "user", "type": "address"}
                ],
                "name": "getUserStakedTokens",
                "outputs": [
                    {"internalType": "address[]", "name": "", "type": "address[]"},
                    {"internalType": "uint256[]", "name": "", "type": "uint256[]"}
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {"internalType": "address", "name": "token", "type": "address"}
                ],
                "name": "getTokenPrice",
                "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {"internalType": "address", "name": "token", "type": "address"}
                ],
                "name": "isTokenSupported",
                "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {"internalType": "address", "name": "token", "type": "address"}
                ],
                "name": "getAllSupportedTokens",
                "outputs": [{"internalType": "address[]", "name": "", "type": "address[]"}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {"internalType": "address", "name": "token", "type": "address"},
                    {"internalType": "uint256", "name": "amount", "type": "uint256"}
                ],
                "name": "calculateNUSDValue",
                "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {"internalType": "address", "name": "user", "type": "address"}
                ],
                "name": "calculateTotalCollateralValue",
                "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
                "stateMutability": "view",
                "type": "function"
            }
        ]
    },
    
    // NUSD合约配置
    nusd: {
        // 合约地址 - 部署后需要更新
        address: '0x0000000000000000000000000000000000000000', // 请替换为实际部署的地址
        abi: [
            // 查询余额
            {
                "inputs": [
                    {"internalType": "address", "name": "account", "type": "address"}
                ],
                "name": "balanceOf",
                "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
                "stateMutability": "view",
                "type": "function"
            },
            // 授权
            {
                "inputs": [
                    {"internalType": "address", "name": "spender", "type": "address"},
                    {"internalType": "uint256", "name": "amount", "type": "uint256"}
                ],
                "name": "approve",
                "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            // 转账
            {
                "inputs": [
                    {"internalType": "address", "name": "to", "type": "address"},
                    {"internalType": "uint256", "name": "amount", "type": "uint256"}
                ],
                "name": "transfer",
                "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            // 从地址转账
            {
                "inputs": [
                    {"internalType": "address", "name": "from", "type": "address"},
                    {"internalType": "address", "name": "to", "type": "address"},
                    {"internalType": "uint256", "name": "amount", "type": "uint256"}
                ],
                "name": "transferFrom",
                "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
                "stateMutability": "nonpayable",
                "type": "function"
            }
        ]
    },
    
    // 代币地址映射（用于前端显示）
    tokenAddresses: {
        'tAAPL': '0x0000000000000000000000000000000000000000', // 请替换为实际地址
        'tGOOGL': '0x0000000000000000000000000000000000000000', // 请替换为实际地址
        'tMSFT': '0x0000000000000000000000000000000000000000', // 请替换为实际地址
        'tTSLA': '0x0000000000000000000000000000000000000000'  // 请替换为实际地址
    },
    
    // 代币符号到地址的映射
    tokenSymbols: {
        'tAAPL': 'tAAPL',
        'tGOOGL': 'tGOOGL', 
        'tMSFT': 'tMSFT',
        'tTSLA': 'tTSLA'
    }
};

// 工具函数
window.CONTRACT_UTILS = {
    // 格式化代币数量（从wei转换为可读格式）
    formatTokenAmount: function(amount, decimals = 18) {
        if (!amount) return '0';
        const divisor = Math.pow(10, decimals);
        return (parseInt(amount) / divisor).toFixed(6);
    },
    
    // 格式化价格（从wei转换为美元）
    formatPrice: function(price, decimals = 18) {
        if (!price) return '0.00';
        const divisor = Math.pow(10, decimals);
        return (parseInt(price) / divisor).toFixed(2);
    },
    
    // 将用户输入的数量转换为wei
    parseTokenAmount: function(amount, decimals = 18) {
        if (!amount) return '0';
        const multiplier = Math.pow(10, decimals);
        return (parseFloat(amount) * multiplier).toString();
    },
    
    // 检查网络连接
    checkNetwork: function() {
        if (typeof window.ethereum !== 'undefined') {
            return window.ethereum.chainId;
        }
        return null;
    },
    
    // 获取当前网络配置
    getCurrentNetwork: function() {
        const chainId = this.checkNetwork();
        if (chainId) {
            // 根据chainId返回对应的网络配置
            return this.findNetworkByChainId(chainId);
        }
        return null;
    },
    
    // 根据chainId查找网络配置
    findNetworkByChainId: function(chainId) {
        for (const [name, network] of Object.entries(window.CONTRACT_CONFIG.networks)) {
            if (network.chainId === chainId) {
                return network;
            }
        }
        return null;
    }
};
