// 主要JavaScript文件 - 页面初始化和导航功能

class Web3App {
    constructor() {
        this.currentTab = 'minting';
        this.web3 = null;
        this.account = null;
        this.contracts = {};
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupTabNavigation();
        this.checkWeb3Connection();
        this.loadMockData();
        this.updateWalletSelector();
        this.debugWalletInfo();
    }
    
    debugWalletInfo() {
        console.log('=== 钱包调试信息 ===');
        console.log('window.ethereum:', !!window.ethereum);
        console.log('window.okxwallet:', !!window.okxwallet);
        console.log('Web3 loaded:', typeof Web3 !== 'undefined');
        
        if (window.ethereum) {
            console.log('MetaMask info:', {
                isMetaMask: window.ethereum.isMetaMask,
                networkVersion: window.ethereum.networkVersion,
                selectedAddress: window.ethereum.selectedAddress
            });
        }
        
        if (window.okxwallet) {
            console.log('OKX Wallet info:', {
                isOkxWallet: window.okxwallet.isOkxWallet,
                selectedAddress: window.okxwallet.selectedAddress
            });
        }
        console.log('=====================');
    }

    setupEventListeners() {
        // 钱包连接按钮
        const connectBtn = document.getElementById('connect-wallet');
        if (connectBtn) {
            connectBtn.addEventListener('click', () => this.connectWallet());
        }

        // 断开钱包按钮
        const disconnectBtn = document.getElementById('disconnect-wallet');
        if (disconnectBtn) {
            disconnectBtn.addEventListener('click', () => this.disconnectWallet());
        }

        // 钱包选择器变化
        const walletSelector = document.getElementById('wallet-selector');
        if (walletSelector) {
            walletSelector.addEventListener('change', () => this.onWalletSelectorChange());
        }

        // 模态框关闭
        const modal = document.getElementById('modal');
        const closeBtn = modal?.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal());
        }

        // 点击模态框外部关闭
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        }
    }

    updateWalletSelector() {
        const walletSelector = document.getElementById('wallet-selector');
        if (!walletSelector) return;

        // 检测可用的钱包
        const availableWallets = [];
        
        if (window.ethereum) {
            availableWallets.push({ value: 'metamask', label: 'MetaMask' });
        }
        
        if (window.okxwallet) {
            availableWallets.push({ value: 'okx', label: 'OKX Wallet' });
        }
        
        if (availableWallets.length > 0) {
            availableWallets.push({ value: 'auto', label: '自动检测' });
        }

        // 更新选择器选项
        walletSelector.innerHTML = '';
        availableWallets.forEach(wallet => {
            const option = document.createElement('option');
            option.value = wallet.value;
            option.textContent = wallet.label;
            walletSelector.appendChild(option);
        });

        // 如果没有检测到钱包，显示提示
        if (availableWallets.length === 0) {
            walletSelector.innerHTML = '<option value="">未检测到钱包</option>';
            walletSelector.disabled = true;
        }
    }

    onWalletSelectorChange() {
        const walletSelector = document.getElementById('wallet-selector');
        const connectBtn = document.getElementById('connect-wallet');
        
        if (walletSelector && connectBtn) {
            const selectedWallet = walletSelector.value;
            
            if (selectedWallet && selectedWallet !== '') {
                connectBtn.disabled = false;
                connectBtn.innerHTML = '<i class="fas fa-wallet"></i> 连接钱包';
            } else {
                connectBtn.disabled = true;
                connectBtn.innerHTML = '<i class="fas fa-wallet"></i> 请先安装钱包';
            }
        }
    }

    setupTabNavigation() {
        const navTabs = document.querySelectorAll('.nav-tab');
        const tabContents = document.querySelectorAll('.tab-content');

        navTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.dataset.tab;
                this.switchTab(targetTab);
            });
        });
    }

    switchTab(tabName) {
        // 更新导航标签状态
        const navTabs = document.querySelectorAll('.nav-tab');
        navTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // 更新内容显示
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(content => {
            content.classList.toggle('active', content.id === tabName);
        });

        this.currentTab = tabName;
        
        // 触发标签切换事件
        this.onTabChange(tabName);
    }

    onTabChange(tabName) {
        // 根据标签加载相应的数据
        switch (tabName) {
            case 'minting':
                if (window.mintingModule) {
                    window.mintingModule.loadStakingData();
                }
                break;
            case 'dashboard':
                if (window.dashboardModule) {
                    window.dashboardModule.loadDashboardData();
                }
                break;
            case 'investment':
                if (window.investmentModule) {
                    window.investmentModule.loadInvestmentData();
                }
                break;
            case 'protocol':
                if (window.protocolModule) {
                    window.protocolModule.loadProtocolData();
                }
                break;
        }
    }

    async checkWeb3Connection() {
        // 检查是否已连接钱包
        let provider = null;
        
        if (window.ethereum) {
            provider = window.ethereum;
        } else if (window.okxwallet) {
            provider = window.okxwallet;
        }
        
        if (provider) {
            try {
                const accounts = await provider.request({ method: 'eth_accounts' });
                if (accounts && accounts.length > 0) {
                    this.account = accounts[0];
                    this.provider = provider;
                    this.walletName = provider === window.ethereum ? 'MetaMask' : 'OKX Wallet';
                    this.web3 = new Web3(provider);
                    this.updateWalletStatus();
                    this.setupWalletListeners(provider);
                }
            } catch (error) {
                console.error('检查Web3连接失败:', error);
            }
        }
    }

    async connectWallet() {
        const walletSelector = document.getElementById('wallet-selector');
        const walletType = walletSelector?.value || 'auto';
        
        console.log('开始连接钱包，类型:', walletType);
        console.log('可用钱包:', {
            ethereum: !!window.ethereum,
            okxwallet: !!window.okxwallet
        });
        
        try {
            this.showLoading(true);
            
            let provider = null;
            let walletName = '';
            
            // 根据选择的钱包类型获取provider
            if (walletType === 'metamask') {
                if (!window.ethereum) {
                    throw new Error('未检测到MetaMask钱包，请安装MetaMask扩展');
                }
                provider = window.ethereum;
                walletName = 'MetaMask';
            } else if (walletType === 'okx') {
                if (!window.okxwallet) {
                    throw new Error('未检测到OKX Wallet，请安装OKX Wallet扩展');
                }
                provider = window.okxwallet;
                walletName = 'OKX Wallet';
            } else if (walletType === 'auto') {
                // 自动检测可用的钱包
                if (window.ethereum) {
                    provider = window.ethereum;
                    walletName = 'MetaMask';
                } else if (window.okxwallet) {
                    provider = window.okxwallet;
                    walletName = 'OKX Wallet';
                } else {
                    throw new Error('未检测到可用的钱包，请安装MetaMask或OKX Wallet');
                }
            } else {
                throw new Error('请选择有效的钱包类型');
            }
            
            if (!provider) {
                throw new Error(`无法获取${walletName}钱包的provider`);
            }
            
            console.log('使用钱包:', walletName, provider);
            
            // 检查是否已经有账户连接
            let accounts = [];
            try {
                accounts = await provider.request({ method: 'eth_accounts' });
                console.log('已连接的账户:', accounts);
            } catch (checkError) {
                console.log('检查账户失败:', checkError);
            }
            
            // 如果没有连接的账户，请求连接
            if (!accounts || accounts.length === 0) {
                console.log('请求连接钱包...');
                accounts = await provider.request({ 
                    method: 'eth_requestAccounts' 
                });
                console.log('连接请求结果:', accounts);
            }
            
            if (accounts && accounts.length > 0) {
                this.account = accounts[0];
                this.provider = provider;
                this.walletName = walletName;
                
                // 检查Web3是否可用
                if (typeof Web3 !== 'undefined') {
                    this.web3 = new Web3(provider);
                } else {
                    console.warn('Web3库未加载，但钱包连接成功');
                    this.web3 = null;
                }
                
                this.updateWalletStatus();
                this.showModal('成功', `${walletName}钱包连接成功！`);
                
                // 初始化合约
                await this.initializeContracts();
                
                // 监听账户变化
                this.setupWalletListeners(provider);
            } else {
                throw new Error('用户拒绝了钱包连接请求');
            }
            
        } catch (error) {
            console.error('连接钱包失败:', error);
            console.log('错误详情:', {
                message: error.message,
                code: error.code,
                data: error.data,
                stack: error.stack
            });
            
            let errorMessage = '连接钱包失败';
            let errorTitle = '错误';
            
            if (error.code === 4001) {
                errorTitle = '连接被拒绝';
                errorMessage = `请在${walletName || '钱包'}中点击"连接"或"批准"按钮来允许网站访问。如果没有看到弹窗，请点击浏览器地址栏旁边的钱包图标。`;
            } else if (error.code === -32002) {
                errorTitle = '连接进行中';
                errorMessage = `${walletName || '钱包'}连接请求已在进行中，请检查钱包弹窗并完成连接。如果没有看到弹窗，请点击浏览器地址栏旁边的钱包图标。`;
            } else if (error.code === -32603) {
                errorTitle = '内部错误';
                errorMessage = `${walletName || '钱包'}内部错误，请尝试刷新页面或重启钱包扩展。`;
            } else if (error.message && error.message.includes('未检测到')) {
                errorTitle = '钱包未安装';
                errorMessage = error.message;
            } else if (error.message && error.message.includes('User rejected')) {
                errorTitle = '连接被拒绝';
                errorMessage = `请在${walletName || '钱包'}中点击"连接"按钮来允许网站访问。`;
            } else if (error.message) {
                errorMessage += ': ' + error.message;
            } else {
                errorMessage += ': 未知错误，请检查控制台或尝试刷新页面';
            }
            
            this.showModal(errorTitle, errorMessage);
        } finally {
            this.showLoading(false);
        }
    }

    async initializeContracts() {
        // 这里应该初始化实际的智能合约
        // 目前使用模拟数据
        console.log('初始化合约...');
    }

    async disconnectWallet() {
        try {
            this.showLoading(true);
            
            // 清除钱包状态
            this.account = null;
            this.web3 = null;
            this.provider = null;
            this.walletName = null;
            this.contracts = {};
            
            // 更新UI状态
            this.updateWalletStatus();
            
            // 显示断开成功消息
            this.showModal('成功', '钱包已断开连接！');
            
            // 重新加载模拟数据
            this.loadMockData();
            
        } catch (error) {
            console.error('断开钱包失败:', error);
            this.showModal('错误', '断开钱包失败: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    setupWalletListeners(provider) {
        // 监听账户变化
        if (provider && provider.on) {
            provider.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    // 用户断开连接
                    this.disconnectWallet();
                } else {
                    // 账户切换
                    this.account = accounts[0];
                    this.updateWalletStatus();
                    this.showModal('提示', '钱包账户已切换');
                }
            });

            // 监听网络变化
            provider.on('chainChanged', (chainId) => {
                this.showModal('提示', '网络已切换，请刷新页面');
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            });

            // 监听连接状态
            provider.on('connect', (connectInfo) => {
                console.log('钱包已连接:', connectInfo);
            });

            provider.on('disconnect', (error) => {
                console.log('钱包已断开:', error);
                this.disconnectWallet();
            });
        }
    }

    updateWalletStatus() {
        const connectBtn = document.getElementById('connect-wallet');
        const disconnectBtn = document.getElementById('disconnect-wallet');
        
        if (connectBtn && disconnectBtn) {
            if (this.account) {
                // 钱包已连接状态
                const shortAddress = this.account.slice(0, 6) + '...' + this.account.slice(-4);
                const walletDisplay = this.walletName ? `${this.walletName}: ${shortAddress}` : shortAddress;
                connectBtn.innerHTML = `<i class="fas fa-wallet"></i> ${walletDisplay}`;
                connectBtn.classList.add('connected');
                connectBtn.disabled = true; // 禁用连接按钮
                
                // 显示断开按钮
                disconnectBtn.style.display = 'flex';
            } else {
                // 钱包未连接状态
                connectBtn.innerHTML = `<i class="fas fa-wallet"></i> 连接钱包`;
                connectBtn.classList.remove('connected');
                connectBtn.disabled = false; // 启用连接按钮
                
                // 隐藏断开按钮
                disconnectBtn.style.display = 'none';
            }
        }
    }

    loadMockData() {
        // 加载模拟数据
        this.onTabChange(this.currentTab);
    }

    showModal(title, message) {
        const modal = document.getElementById('modal');
        const modalBody = document.getElementById('modal-body');
        
        if (modal && modalBody) {
            modalBody.innerHTML = `
                <h3>${title}</h3>
                <p>${message}</p>
            `;
            modal.style.display = 'block';
        }
    }

    closeModal() {
        const modal = document.getElementById('modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = show ? 'block' : 'none';
        }
    }

    // 工具方法
    formatNumber(num) {
        return new Intl.NumberFormat('en-US').format(num);
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }
}

// 监听钱包变化（兼容MetaMask和OKX Wallet）
function setupGlobalWalletListeners() {
    // MetaMask监听器
    if (typeof window.ethereum !== 'undefined') {
        window.ethereum.on('accountsChanged', (accounts) => {
            if (window.web3App && window.web3App.provider === window.ethereum) {
                if (accounts.length > 0) {
                    window.web3App.account = accounts[0];
                    window.web3App.updateWalletStatus();
                } else {
                    window.web3App.account = null;
                    window.web3App.updateWalletStatus();
                }
            }
        });

        window.ethereum.on('chainChanged', (chainId) => {
            if (window.web3App && window.web3App.provider === window.ethereum) {
                window.location.reload();
            }
        });
    }

    // OKX Wallet监听器
    if (typeof window.okxwallet !== 'undefined') {
        window.okxwallet.on('accountsChanged', (accounts) => {
            if (window.web3App && window.web3App.provider === window.okxwallet) {
                if (accounts.length > 0) {
                    window.web3App.account = accounts[0];
                    window.web3App.updateWalletStatus();
                } else {
                    window.web3App.account = null;
                    window.web3App.updateWalletStatus();
                }
            }
        });

        window.okxwallet.on('chainChanged', (chainId) => {
            if (window.web3App && window.web3App.provider === window.okxwallet) {
                window.location.reload();
            }
        });
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    // 等待Web3库加载完成
    if (typeof Web3 === 'undefined') {
        console.error('Web3库未加载，请检查网络连接');
        setTimeout(() => {
            if (typeof Web3 !== 'undefined') {
                window.web3App = new Web3App();
                setupGlobalWalletListeners();
            } else {
                console.error('Web3库加载失败');
            }
        }, 1000);
    } else {
        window.web3App = new Web3App();
        setupGlobalWalletListeners();
    }
});
