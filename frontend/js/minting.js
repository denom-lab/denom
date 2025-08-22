// 铸币模块功能 - 与Vault合约交互

class MintingModule {
    constructor() {
        this.web3 = null;
        this.vaultContract = null;
        this.nusdContract = null;
        this.userAddress = null;
        this.contractConfig = window.CONTRACT_CONFIG;
        this.contractUtils = window.CONTRACT_UTILS;
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.initializeWeb3();
        await this.loadStakingData();
    }

    async initializeWeb3() {
        try {
            // 检查是否安装了MetaMask
            if (typeof window.ethereum !== 'undefined') {
                this.web3 = new Web3(window.ethereum);
                
                // 请求用户授权
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                this.userAddress = accounts[0];
                
                // 初始化合约实例
                await this.initializeContracts();
                
                console.log('Web3初始化成功，用户地址:', this.userAddress);
            } else {
                console.log('请安装MetaMask钱包');
                this.showMessage('请安装MetaMask钱包', 'error');
            }
        } catch (error) {
            console.error('Web3初始化失败:', error);
            this.showMessage('Web3初始化失败: ' + error.message, 'error');
        }
    }

    async initializeContracts() {
        try {
            // 初始化Vault合约
            this.vaultContract = new this.web3.eth.Contract(
                this.contractConfig.vault.abi,
                this.contractConfig.vault.address
            );
            
            // 初始化NUSD合约
            this.nusdContract = new this.web3.eth.Contract(
                this.contractConfig.nusd.abi,
                this.contractConfig.nusd.address
            );
            
            console.log('合约初始化成功');
        } catch (error) {
            console.error('合约初始化失败:', error);
            this.showMessage('合约初始化失败: ' + error.message, 'error');
        }
    }

    setupEventListeners() {
        // 质押按钮
        const stakeBtn = document.getElementById('stake-btn');
        if (stakeBtn) {
            stakeBtn.addEventListener('click', () => this.handleStake());
        }

        // 铸造按钮
        const mintBtn = document.getElementById('mint-btn');
        if (mintBtn) {
            mintBtn.addEventListener('click', () => this.handleMint());
        }

        // 归还按钮
        const repayBtn = document.getElementById('repay-btn');
        if (repayBtn) {
            repayBtn.addEventListener('click', () => this.handleRepay());
        }

        // 解除质押按钮
        const unstakeBtn = document.getElementById('unstake-btn');
        if (unstakeBtn) {
            unstakeBtn.addEventListener('click', () => this.handleUnstake());
        }

        // 质押代币选择变化
        const stakingToken = document.getElementById('staking-token');
        if (stakingToken) {
            stakingToken.addEventListener('change', () => this.onTokenChange());
        }

        // 质押数量输入变化
        const stakingAmount = document.getElementById('staking-amount');
        if (stakingAmount) {
            stakingAmount.addEventListener('input', () => this.onAmountChange());
        }

        // 铸造数量输入变化
        const mintAmount = document.getElementById('mint-amount');
        if (mintAmount) {
            mintAmount.addEventListener('input', () => this.onMintAmountChange());
        }
    }

    async loadStakingData() {
        if (!this.vaultContract || !this.userAddress) {
            console.log('合约或用户地址未初始化，跳过数据加载');
            return;
        }

        try {
            await this.updateStakingForm();
            await this.updateHoldingsDisplay();
            await this.updateMintableAmount();
        } catch (error) {
            console.error('加载质押数据失败:', error);
            this.showMessage('加载质押数据失败: ' + error.message, 'error');
        }
    }

    async updateStakingForm() {
        const stakingToken = document.getElementById('staking-token');
        const stakingAmount = document.getElementById('staking-amount');
        
        if (stakingToken && stakingAmount) {
            stakingAmount.value = '';
            this.onAmountChange();
        }
    }

    async updateHoldingsDisplay() {
        try {
            const holdings = await this.getHoldingsFromContract();
            const holdingsList = document.getElementById('holdings-list');
            const totalValueEl = document.getElementById('total-holdings-value');
            
            if (holdingsList) {
                holdingsList.innerHTML = '';
                let totalValue = 0;

                holdings.forEach(holding => {
                    if (holding.amount > 0) {
                        const holdingItem = document.createElement('div');
                        holdingItem.className = 'holding-item';
                        holdingItem.innerHTML = `
                            <span class="token-name">${holding.token}</span>
                            <span class="token-price" data-price="${holding.price}" data-change="${holding.priceChange}">
                                单价: $<span class="price-value">${holding.price.toFixed(2)}</span>
                                <span class="price-change ${holding.priceChange >= 0 ? 'positive' : 'negative'}">
                                    ${holding.priceChange >= 0 ? '+' : ''}${holding.priceChange}%
                                </span>
                            </span>
                            <span class="token-amount">数量: ${holding.amount.toFixed(2)}</span>
                            <span class="token-value">$${holding.value.toLocaleString()}</span>
                        `;
                        holdingsList.appendChild(holdingItem);
                        totalValue += holding.value;
                        
                        // 启动价格动画
                        this.startPriceAnimation(holdingItem.querySelector('.price-value'), holding.price, holding.priceChange);
                    }
                });

                if (totalValueEl) {
                    totalValueEl.textContent = totalValue.toLocaleString();
                }
            }
        } catch (error) {
            console.error('更新持仓显示失败:', error);
        }
    }

    async updateMintableAmount() {
        try {
            if (!this.vaultContract || !this.userAddress) return;
            
            // 从合约获取用户总抵押品价值
            const totalCollateralValue = await this.vaultContract.methods
                .calculateTotalCollateralValue(this.userAddress)
                .call({ from: this.userAddress });
            
            const mintableAmount = this.contractUtils.formatTokenAmount(totalCollateralValue) * 0.7; // 70% 质押率

            const mintableEl = document.getElementById('mintable-amount');
            if (mintableEl) {
                mintableEl.textContent = mintableAmount.toFixed(2);
            }
        } catch (error) {
            console.error('更新可铸造数量失败:', error);
        }
    }

    async getHoldingsFromContract() {
        if (!this.vaultContract || !this.userAddress) {
            console.log('合约或用户地址未初始化，使用模拟数据');
            return this.getMockHoldings();
        }

        try {
            // 从合约获取用户质押的代币信息
            const [tokenAddresses, amounts] = await this.vaultContract.methods
                .getUserStakedTokens(this.userAddress)
                .call({ from: this.userAddress });
            
            const holdings = [];
            
            for (let i = 0; i < tokenAddresses.length; i++) {
                const tokenAddress = tokenAddresses[i];
                const amount = amounts[i];
                
                if (amount > 0) {
                    // 获取代币价格
                    const price = await this.vaultContract.methods
                        .getTokenPrice(tokenAddress)
                        .call({ from: this.userAddress });
                    
                    // 获取代币符号（这里简化处理，实际应该从代币合约获取）
                    const tokenSymbol = this.getTokenSymbolByAddress(tokenAddress);
                    
                    const formattedAmount = this.contractUtils.formatTokenAmount(amount);
                    const formattedPrice = this.contractUtils.formatPrice(price);
                    const value = parseFloat(formattedAmount) * parseFloat(formattedPrice);
                    
                    holdings.push({
                        token: tokenSymbol,
                        amount: parseFloat(formattedAmount),
                        price: parseFloat(formattedPrice),
                        value: value,
                        priceChange: 0, // 价格变化需要从其他地方获取
                        address: tokenAddress
                    });
                }
            }
            
            return holdings;
        } catch (error) {
            console.error('从合约获取持仓数据失败:', error);
            return this.getMockHoldings();
        }
    }

    getTokenSymbolByAddress(address) {
        // 根据地址获取代币符号（简化实现）
        const tokenAddresses = this.contractConfig.tokenAddresses;
        for (const [symbol, tokenAddress] of Object.entries(tokenAddresses)) {
            if (tokenAddress.toLowerCase() === address.toLowerCase()) {
                return symbol;
            }
        }
        return 'Unknown';
    }

    getMockHoldings() {
        // 模拟持仓数据 - 包含单价信息
        return [
            { 
                token: 'tAAPL', 
                amount: 100.5, 
                price: 150.00, // 单价
                value: 15075.75, 
                priceChange: 2.5, // 价格变化百分比
            },
            { 
                token: 'tGOOGL', 
                amount: 25.0, 
                price: 150.00, 
                value: 3750.00, 
                priceChange: -1.2,
            },
            { 
                token: 'tMSFT', 
                amount: 50.0, 
                price: 375.00, 
                value: 18750.00, 
                priceChange: 0.8,
            }
        ];
    }

    async handleStake() {
        if (!this.vaultContract || !this.userAddress) {
            this.showMessage('请先连接钱包', 'error');
            return;
        }

        const stakingProtocol = document.getElementById('staking-protocol');
        const stakingToken = document.getElementById('staking-token');
        const stakingAmount = document.getElementById('staking-amount');
        
        if (!stakingProtocol || !stakingToken || !stakingAmount) return;

        const protocol = stakingProtocol.value;
        const tokenSymbol = stakingToken.value;
        const amount = parseFloat(stakingAmount.value);

        if (!amount || amount <= 0) {
            this.showMessage('请输入有效的质押数量', 'error');
            return;
        }

        try {
            this.showLoading(true);
            
            // 获取代币合约地址
            const tokenAddress = this.contractConfig.tokenAddresses[tokenSymbol];
            if (!tokenAddress || tokenAddress === '0x0000000000000000000000000000000000000000') {
                throw new Error('代币地址未配置，请先部署代币合约');
            }
            
            // 转换数量为wei
            const amountWei = this.contractUtils.parseTokenAmount(amount);
            
            // 调用Vault合约的质押方法
            const result = await this.vaultContract.methods
                .stakeToken(tokenAddress, amountWei)
                .send({ from: this.userAddress });
            
            this.showMessage(`成功质押 ${amount} ${tokenSymbol} 到 ${protocol}`, 'success');
            console.log('质押交易成功:', result);
            
            // 刷新数据
            await this.loadStakingData();
            
        } catch (error) {
            console.error('质押失败:', error);
            this.showMessage(`质押失败: ${error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async handleMint() {
        if (!this.vaultContract || !this.userAddress) {
            this.showMessage('请先连接钱包', 'error');
            return;
        }

        const mintAmount = document.getElementById('mint-amount');
        if (!mintAmount) return;

        const amount = parseFloat(mintAmount.value);
        if (!amount || amount <= 0) {
            this.showMessage('请输入有效的铸造数量', 'error');
            return;
        }

        const mintableAmount = this.getMintableAmount();
        if (amount > mintableAmount) {
            this.showMessage(`铸造数量不能超过可铸造数量 (${mintableAmount.toFixed(2)} NUSD)`, 'error');
            return;
        }

        try {
            this.showLoading(true);
            
            // 转换数量为wei
            const amountWei = this.contractUtils.parseTokenAmount(amount);
            
            // 调用Vault合约的借贷方法
            const result = await this.vaultContract.methods
                .borrowNUSD(amountWei)
                .send({ from: this.userAddress });
            
            this.showMessage(`成功铸造 ${amount.toFixed(2)} NUSD`, 'success');
            console.log('铸造交易成功:', result);
            
            // 刷新数据
            await this.updateMintableAmount();
            mintAmount.value = '';
            
        } catch (error) {
            console.error('铸造失败:', error);
            this.showMessage(`铸造失败: ${error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async handleRepay() {
        if (!this.vaultContract || !this.userAddress) {
            this.showMessage('请先连接钱包', 'error');
            return;
        }

        const mintAmount = document.getElementById('mint-amount');
        if (!mintAmount) return;

        const amount = parseFloat(mintAmount.value);
        if (!amount || amount <= 0) {
            this.showMessage('请输入有效的归还数量', 'error');
            return;
        }

        try {
            this.showLoading(true);
            
            // 转换数量为wei
            const amountWei = this.contractUtils.parseTokenAmount(amount);
            
            // 先授权Vault合约使用NUSD
            await this.nusdContract.methods
                .approve(this.contractConfig.vault.address, amountWei)
                .send({ from: this.userAddress });
            
            // 调用Vault合约的归还方法
            const result = await this.vaultContract.methods
                .repayNUSD(amountWei)
                .send({ from: this.userAddress });
            
            this.showMessage(`成功归还 ${amount.toFixed(2)} NUSD`, 'success');
            console.log('归还交易成功:', result);
            
            // 刷新数据
            await this.updateMintableAmount();
            mintAmount.value = '';
            
        } catch (error) {
            console.error('归还失败:', error);
            this.showMessage(`归还失败: ${error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async handleUnstake() {
        if (!this.vaultContract || !this.userAddress) {
            this.showMessage('请先连接钱包', 'error');
            return;
        }

        const stakingToken = document.getElementById('staking-token');
        const stakingAmount = document.getElementById('staking-amount');
        
        if (!stakingToken || !stakingAmount) return;

        const tokenSymbol = stakingToken.value;
        const amount = parseFloat(stakingAmount.value);

        if (!amount || amount <= 0) {
            this.showMessage('请输入有效的解除质押数量', 'error');
            return;
        }

        try {
            this.showLoading(true);
            
            // 获取代币合约地址
            const tokenAddress = this.contractConfig.tokenAddresses[tokenSymbol];
            if (!tokenAddress || tokenAddress === '0x0000000000000000000000000000000000000000') {
                throw new Error('代币地址未配置，请先部署代币合约');
            }
            
            // 转换数量为wei
            const amountWei = this.contractUtils.parseTokenAmount(amount);
            
            // 调用Vault合约的解质押方法
            const result = await this.vaultContract.methods
                .unstakeToken(tokenAddress, amountWei)
                .send({ from: this.userAddress });
            
            this.showMessage(`成功解除质押 ${amount} ${tokenSymbol}`, 'success');
            console.log('解质押交易成功:', result);
            
            // 刷新数据
            await this.loadStakingData();
            
        } catch (error) {
            console.error('解除质押失败:', error);
            this.showMessage(`解除质押失败: ${error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    onTokenChange() {
        // 代币选择变化时的处理
        this.updateStakingForm();
    }

    onAmountChange() {
        // 质押数量变化时的处理
        const stakingAmount = document.getElementById('staking-amount');
        const stakeBtn = document.getElementById('stake-btn');
        
        if (stakingAmount && stakeBtn) {
            const amount = parseFloat(stakingAmount.value);
            stakeBtn.disabled = !amount || amount <= 0;
        }
    }

    onMintAmountChange() {
        // 铸造数量变化时的处理
        const mintAmount = document.getElementById('mint-amount');
        const mintBtn = document.getElementById('mint-btn');
        
        if (mintAmount && mintBtn) {
            const amount = parseFloat(mintAmount.value);
            const mintableAmount = this.getMintableAmount();
            mintBtn.disabled = !amount || amount <= 0 || amount > mintableAmount;
        }
    }

    getMintableAmount() {
        const mintableEl = document.getElementById('mintable-amount');
        if (mintableEl) {
            const text = mintableEl.textContent;
            return parseFloat(text.replace(/,/g, '')) || 0;
        }
        return 0;
    }

    showMessage(message, type = 'info') {
        // 显示消息提示
        if (window.web3App && window.web3App.showModal) {
            window.web3App.showModal(type === 'error' ? '错误' : '提示', message);
        } else {
            alert(message);
        }
    }

    startPriceAnimation(priceElement, basePrice, priceChange) {
        // 价格动态递增动画
        if (!priceElement) return;
        
        const targetPrice = basePrice * (1 + priceChange / 100);
        const startPrice = basePrice;
        const duration = 2000; // 2秒动画
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // 使用缓动函数
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const currentPrice = startPrice + (targetPrice - startPrice) * easeProgress;
            
            priceElement.textContent = currentPrice.toFixed(2);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }

    showLoading(show) {
        // 显示/隐藏加载指示器
        if (window.web3App && window.web3App.showLoading) {
            window.web3App.showLoading(show);
        }
    }
}

// 页面加载完成后初始化铸币模块
document.addEventListener('DOMContentLoaded', () => {
    window.mintingModule = new MintingModule();
});
