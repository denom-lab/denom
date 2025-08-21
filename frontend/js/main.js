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
        // 检查是否已连接MetaMask
        if (typeof window.ethereum !== 'undefined') {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    this.account = accounts[0];
                    this.updateWalletStatus();
                }
            } catch (error) {
                console.error('检查Web3连接失败:', error);
            }
        }
    }

    async connectWallet() {
        if (typeof window.ethereum === 'undefined') {
            this.showModal('错误', '请安装MetaMask钱包');
            return;
        }

        try {
            this.showLoading(true);
            const accounts = await window.ethereum.request({ 
                method: 'eth_requestAccounts' 
            });
            
            if (accounts.length > 0) {
                this.account = accounts[0];
                this.web3 = new Web3(window.ethereum);
                this.updateWalletStatus();
                this.showModal('成功', '钱包连接成功！');
                
                // 初始化合约
                await this.initializeContracts();
            }
        } catch (error) {
            console.error('连接钱包失败:', error);
            this.showModal('错误', '连接钱包失败: ' + error.message);
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

    updateWalletStatus() {
        const connectBtn = document.getElementById('connect-wallet');
        const disconnectBtn = document.getElementById('disconnect-wallet');
        
        if (connectBtn && disconnectBtn) {
            if (this.account) {
                // 钱包已连接状态
                const shortAddress = this.account.slice(0, 6) + '...' + this.account.slice(-4);
                connectBtn.innerHTML = `<i class="fas fa-wallet"></i> ${shortAddress}`;
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

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.web3App = new Web3App();
});

// 监听MetaMask账户变化
if (typeof window.ethereum !== 'undefined') {
    window.ethereum.on('accountsChanged', (accounts) => {
        if (window.web3App) {
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
        // 网络切换时重新加载页面
        window.location.reload();
    });
}
