// 合约配置文件
const CONTRACT_CONFIG = {
    // 合约地址 - 后期配置
    contractAddress: '',
    
    // RPC节点URL - 后期配置
    rpcUrl: '',
    
    // 链ID - 后期配置
    chainId: '',
    
    // 合约ABI - 后期配置
    abi: [],
    
    // 网络配置
    networks: {
        ethereum: {
            name: 'Ethereum Mainnet',
            chainId: '1',
            rpcUrl: 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID',
            explorer: 'https://etherscan.io'
        },
        polygon: {
            name: 'Polygon',
            chainId: '137',
            rpcUrl: 'https://polygon-rpc.com',
            explorer: 'https://polygonscan.com'
        },
        bsc: {
            name: 'Binance Smart Chain',
            chainId: '56',
            rpcUrl: 'https://bsc-dataseed.binance.org',
            explorer: 'https://bscscan.com'
        }
    },
    
    // 默认网络
    defaultNetwork: 'ethereum',
    
    // 价格更新间隔（毫秒）
    priceUpdateInterval: 30000,
    
    // 是否启用价格动画
    enablePriceAnimation: true
};

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONTRACT_CONFIG;
} else {
    window.CONTRACT_CONFIG = CONTRACT_CONFIG;
}
