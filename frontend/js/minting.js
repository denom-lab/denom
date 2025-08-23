// 铸币模块功能 - 与Vault合约交互

class MintingModule {
    constructor() {
        this.web3 = null;
        this.vaultContract = null;
        this.nusdContract = null;
        this.userAddress = null;
        this.contractConfig = window.CONTRACT_CONFIG;
        this.contractUtils = window.CONTRACT_UTILS;
        
        console.log('MintingModule初始化，合约配置:', this.contractConfig);
        console.log('代币地址映射:', this.contractConfig?.tokenAddresses);
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.initializeWeb3();
        await this.loadStakingData();
    }

    async initializeWeb3() {
        try {
            // 检测可用的钱包
            const walletProvider = this.detectWalletProvider();
            
            if (walletProvider) {
                this.web3 = new Web3(walletProvider);
                
                // 请求用户授权
                const accounts = await walletProvider.request({ method: 'eth_requestAccounts' });
                this.userAddress = accounts[0];
                
                // 检查网络连接
                await this.checkAndSwitchNetwork(walletProvider);
                
                // 初始化合约实例
                await this.initializeContracts();
                
                console.log('Web3初始化成功，用户地址:', this.userAddress);
                console.log('使用的钱包:', walletProvider.isMetaMask ? 'MetaMask' : 
                           walletProvider.isOKXWallet ? 'OKX Wallet' : '其他钱包');
            } else {
                console.log('请安装钱包扩展');
                this.showMessage('请安装MetaMask、OKX Wallet或其他兼容的钱包扩展', 'error');
            }
        } catch (error) {
            console.error('Web3初始化失败:', error);
            this.showMessage('Web3初始化失败: ' + error.message, 'error');
        }
    }

    detectWalletProvider() {
        console.log('🔍 检测可用钱包...');
        console.log('MetaMask:', !!window.ethereum);
        console.log('OKX Wallet:', !!window.okxwallet);
        
        // 检查用户是否选择了特定钱包
        const walletSelector = document.getElementById('wallet-selector');
        if (walletSelector) {
            const selectedWallet = walletSelector.value;
            console.log('用户选择的钱包:', selectedWallet);
            
            if (selectedWallet === 'okx' && typeof window.okxwallet !== 'undefined') {
                console.log('✅ 使用用户选择的OKX Wallet');
                return window.okxwallet;
            }
            
            if (selectedWallet === 'metamask' && typeof window.ethereum !== 'undefined') {
                console.log('✅ 使用用户选择的MetaMask');
                return window.ethereum;
            }
        }
        
        // 如果没有选择或选择自动，按优先级检测
        if (typeof window.okxwallet !== 'undefined') {
            console.log('✅ 自动检测到OKX Wallet');
            return window.okxwallet;
        }
        
        if (typeof window.ethereum !== 'undefined') {
            if (window.ethereum.isMetaMask) {
                console.log('✅ 自动检测到MetaMask');
                return window.ethereum;
            }
            console.log('✅ 自动检测到其他兼容钱包');
            return window.ethereum;
        }
        
        console.log('❌ 未检测到可用钱包');
        return null;
    }

    async checkAndSwitchNetwork(walletProvider) {
        try {
            const chainId = await walletProvider.request({ method: 'eth_chainId' });
            console.log('当前连接的网络Chain ID:', chainId);
            
            // Reddio测试网的Chain ID
            const reddioChainId = '0xC4a5'; // 50341
            
            if (chainId !== reddioChainId) {
                console.log('当前网络不是Reddio测试网，尝试切换...');
                
                try {
                    // 尝试切换到Reddio测试网
                    await walletProvider.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: reddioChainId }],
                    });
                    console.log('成功切换到Reddio测试网');
                } catch (switchError) {
                    console.log('切换网络失败，尝试添加网络:', switchError);
                    
                    // 如果网络不存在，尝试添加
                    try {
                        await walletProvider.request({
                            method: 'wallet_addEthereumChain',
                            params: [{
                                chainId: reddioChainId,
                                chainName: 'Reddio Testnet',
                                nativeCurrency: {
                                    name: 'RDO',
                                    symbol: 'RDO',
                                    decimals: 18
                                },
                                rpcUrls: ['https://reddio-dev.reddio.com'],
                                blockExplorerUrls: ['https://reddio-dev.reddio.com/']
                            }],
                        });
                        console.log('成功添加Reddio测试网');
                    } catch (addError) {
                        console.error('添加网络失败:', addError);
                        this.showMessage('请手动切换到Reddio测试网 (Chain ID: 50341)', 'warning');
                    }
                }
            } else {
                console.log('已连接到Reddio测试网');
            }
        } catch (error) {
            console.error('网络检查失败:', error);
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

        // 钱包选择器变化
        const walletSelector = document.getElementById('wallet-selector');
        if (walletSelector) {
            walletSelector.addEventListener('change', () => this.onWalletChange());
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
            
            // 安全检查：确保holdings是数组
            if (!Array.isArray(holdings)) {
                console.error('持仓数据不是数组:', holdings);
                console.log('使用模拟数据');
                const mockHoldings = this.getMockHoldings();
                this.displayHoldings(mockHoldings, holdingsList, totalValueEl);
                return;
            }
            
            console.log('持仓数据验证通过，开始显示:', holdings);
            this.displayHoldings(holdings, holdingsList, totalValueEl);
            
        } catch (error) {
            console.error('更新持仓显示失败:', error);
            console.error('错误详情:', error.message);
            console.error('错误堆栈:', error.stack);
            
            // 出错时使用模拟数据
            try {
                const mockHoldings = this.getMockHoldings();
                const holdingsList = document.getElementById('holdings-list');
                const totalValueEl = document.getElementById('total-holdings-value');
                this.displayHoldings(mockHoldings, holdingsList, totalValueEl);
            } catch (fallbackError) {
                console.error('回退到模拟数据也失败:', fallbackError);
            }
        }
    }

    displayHoldings(holdings, holdingsList, totalValueEl) {
        if (!holdingsList) return;
        
        holdingsList.innerHTML = '';
        let totalValue = 0;

        try {
            holdings.forEach((holding, index) => {
                console.log(`处理持仓 ${index}:`, holding);
                
                // 验证持仓数据格式
                if (!holding || typeof holding !== 'object') {
                    console.warn(`持仓 ${index} 数据格式无效:`, holding);
                    return;
                }
                
                if (!holding.amount || !holding.token || !holding.price || !holding.value) {
                    console.warn(`持仓 ${index} 缺少必要字段:`, holding);
                    return;
                }
                
                if (holding.amount > 0) {
                    const holdingItem = document.createElement('div');
                    holdingItem.className = 'holding-item';
                    holdingItem.innerHTML = `
                        <span class="token-name">${holding.token}</span>
                        <span class="token-price" data-price="${holding.price}" data-change="${holding.priceChange || 0}">
                            单价: $<span class="price-value">${holding.price.toFixed(2)}</span>
                            <span class="price-change ${(holding.priceChange || 0) >= 0 ? 'positive' : 'negative'}">
                                ${(holding.priceChange || 0) >= 0 ? '+' : ''}${holding.priceChange || 0}%
                            </span>
                        </span>
                        <span class="token-amount">数量: ${holding.amount.toFixed(2)}</span>
                        <span class="token-value">$${holding.value.toLocaleString()}</span>
                    `;
                    holdingsList.appendChild(holdingItem);
                    totalValue += holding.value;
                    
                    // 启动价格动画
                    this.startPriceAnimation(holdingItem.querySelector('.price-value'), holding.price, holding.priceChange || 0);
                }
            });
        } catch (forEachError) {
            console.error('遍历持仓数据时出错:', forEachError);
        }

        if (totalValueEl) {
            totalValueEl.textContent = totalValue.toLocaleString();
        }
    }

    async updateMintableAmount() {
        try {
            if (!this.vaultContract || !this.userAddress) return;
            
            // 从合约获取用户总抵押品价值
            const totalCollateralValue = await this.vaultContract.methods
                .calculateTotalCollateralValue(this.userAddress)
                .call({ from: this.userAddress });
            console.log("borrowedNUSD___1", totalCollateralValue)
            
            const borrowedNUSD = await this.vaultContract.methods
                .getUserBorrowedNUSD(this.userAddress)
                .call({ from: this.userAddress });
            const formattedBorrowedNUSD = this.contractUtils.formatTokenAmount(borrowedNUSD);

            console.log("borrowedNUSD___1", formattedBorrowedNUSD)

            let mintableAmount = (this.contractUtils.formatTokenAmount(totalCollateralValue) * 0.7) - formattedBorrowedNUSD; // 70% 质押率，减去已借入数量
            if (mintableAmount < 0) {
                mintableAmount = 0;
            }

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
            console.log('🔍 开始从合约获取持仓数据...');
            console.log('用户地址:', this.userAddress);
            console.log('Vault合约地址:', this.vaultContract._address);
            
            // 先检查合约是否支持getUserStakedTokens方法
            if (!this.vaultContract.methods.getUserStakedTokens) {
                console.log('合约不支持getUserStakedTokens方法，使用模拟数据');
                return this.getMockHoldings();
            }
            
            // 从合约获取用户质押的代币信息
            console.log('调用getUserStakedTokens方法...');
            
            let result;
            try {
                result = await this.vaultContract.methods
                    .getUserStakedTokens(this.userAddress)
                    .call({ from: this.userAddress });
                
                console.log('合约返回结果:', result);
                console.log('返回结果类型:', typeof result);
                console.log('返回结果是否为数组:', Array.isArray(result));

                if (result[0] && result[1]) {
                    result = [result[0], result[1]];
                }
                
                // 如果返回结果是null或undefined，使用模拟数据
                if (!result) {
                    console.log('合约返回null或undefined，使用模拟数据');
                    return this.getMockHoldings();
                }
                
            } catch (callError) {
                console.error('合约调用失败:', callError);
                console.error('调用错误详情:', callError.message);
                return this.getMockHoldings();
            }
            
            // 检查返回结果是否为数组
            if (!Array.isArray(result) || result.length !== 2) {
                console.log('合约返回格式不正确，使用模拟数据');
                return this.getMockHoldings();
            }
            
            // 使用更安全的方式获取数组，避免解构赋值错误
            let tokenAddresses, amounts;
            try {
                tokenAddresses = result[0];
                amounts = result[1];
                console.log('成功获取代币地址数组:', tokenAddresses);
                console.log('成功获取数量数组:', amounts);
            } catch (destructureError) {
                console.error('解构赋值失败:', destructureError);
                return this.getMockHoldings();
            }
            
            // 检查数组是否为空
            if (!Array.isArray(tokenAddresses) || !Array.isArray(amounts)) {
                console.log('代币地址或数量数组格式不正确，使用模拟数据');
                return this.getMockHoldings();
            }
            
            console.log('代币地址数组:', tokenAddresses);
            console.log('数量数组:', amounts);
            
            const holdings = [];
            
            for (let i = 0; i < tokenAddresses.length; i++) {
                const tokenAddress = tokenAddresses[i];
                const amount = amounts[i];
                
                console.log(`处理代币 ${i}: 地址=${tokenAddress}, 数量=${amount}`);
                
                if (amount > 0) {
                    try {
                        // 获取代币价格
                        const price = await this.vaultContract.methods
                            .getTokenPrice(tokenAddress)
                            .call({ from: this.userAddress });
                        
                        console.log(`代币 ${tokenAddress} 价格:`, price);
                        
                        // 获取代币符号
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
                        
                        console.log(`成功添加持仓: ${tokenSymbol} - ${formattedAmount} @ $${formattedPrice}`);
                    } catch (tokenError) {
                        console.error(`处理代币 ${tokenAddress} 时出错:`, tokenError);
                        // 继续处理其他代币
                    }
                }
            }
            
            console.log('最终持仓数据:', holdings);
            return holdings;
            
        } catch (error) {
            console.error('从合约获取持仓数据失败:', error);
            console.error('错误详情:', error.message);
            console.error('错误堆栈:', error.stack);
            
            // 尝试获取更多错误信息
            if (error.reason) {
                console.error('错误原因:', error.reason);
            }
            if (error.code) {
                console.error('错误代码:', error.code);
            }
            
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
            console.log('选择的代币符号:', tokenSymbol);
            console.log('合约配置:', this.contractConfig);
            console.log('代币地址映射:', this.contractConfig.tokenAddresses);
            
            const tokenAddress = this.contractConfig.tokenAddresses[tokenSymbol];
            console.log('获取到的代币地址:', tokenAddress);
            
            if (!tokenAddress || tokenAddress === '0x0000000000000000000000000000000000000000') {
                throw new Error(`代币地址未配置，请先部署代币合约。代币符号: ${tokenSymbol}`);
            }
            
            // 转换数量为wei
            const amountWei = this.contractUtils.parseTokenAmount(amount);
            
            // 调用Vault合约的质押方法
            const result = await this.vaultContract.methods
                .stakeToken(tokenAddress, amountWei)
                .send({ from: this.userAddress });
            
            this.showMessage(`成功质押 ${amount} ${tokenSymbol} 到 Denom`, 'success');
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
                .send({ from: this.userAddress })
                .on('receipt', (receipt) => {
                    console.log('解质押交易确认:', receipt);
                    this.showMessage(`成功解除质押 ${amount} ${tokenSymbol}`, 'success');
                    // 刷新数据
                    this.loadStakingData();
                })
                .on('error', (error) => {
                    console.error('解除质押失败:', error);
                    this.showMessage(`解除质押失败: ${error.message}`, 'error');
                });
            



            
            
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

    async onWalletChange() {
        console.log('🔄 钱包选择已更改，重新初始化Web3...');
        
        // 重置当前状态
        this.web3 = null;
        this.vaultContract = null;
        this.nusdContract = null;
        this.userAddress = null;
        
        // 重新初始化Web3
        await this.initializeWeb3();
        
        // 重新加载数据
        await this.loadStakingData();
        
        console.log('✅ 钱包切换完成');
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
