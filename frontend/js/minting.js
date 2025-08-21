// 铸币模块功能

class MintingModule {
    constructor() {
        // 从配置文件获取合约配置
        this.contractConfig = {
            contractAddress: window.CONTRACT_CONFIG?.contractAddress || '',
            rpcUrl: window.CONTRACT_CONFIG?.rpcUrl || '',
            chainId: window.CONTRACT_CONFIG?.chainId || '',
            abi: window.CONTRACT_CONFIG?.abi || []
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadStakingData();
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

    loadStakingData() {
        // 加载质押数据
        this.updateStakingForm();
        this.updateHoldingsDisplay();
        this.updateMintableAmount();
    }

    updateStakingForm() {
        // 更新质押表单状态
        const stakingToken = document.getElementById('staking-token');
        const stakingAmount = document.getElementById('staking-amount');
        
        if (stakingToken && stakingAmount) {
            // 重置表单
            stakingAmount.value = '';
            this.onAmountChange();
        }
    }

    updateHoldingsDisplay() {
        // 更新持仓显示
        this.getHoldingsFromContract().then(holdings => {
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
                                    <span class="token-custodian">代持方: ${holding.custodian}</span>
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
        });
    }

    updateMintableAmount() {
        // 更新可铸造数量
        this.getHoldingsFromContract().then(holdings => {
            const totalValue = holdings.reduce((sum, holding) => sum + holding.value, 0);
            const mintableAmount = totalValue * 0.7; // 70% 质押率

            const mintableEl = document.getElementById('mintable-amount');
            if (mintableEl) {
                mintableEl.textContent = mintableAmount.toLocaleString();
            }
        });
    }

    async getHoldingsFromContract() {
        // 从合约获取持仓数据
        if (!this.contractConfig.contractAddress || !this.contractConfig.rpcUrl) {
            console.log('合约配置未完成，使用模拟数据');
            return this.getMockHoldings();
        }

        try {
            // 这里应该调用智能合约方法获取持仓数据
            // 示例：const holdings = await contract.methods.getUserHoldings(userAddress).call();
            
            // 暂时返回模拟数据，实际应用中替换为合约调用
            return this.getMockHoldings();
        } catch (error) {
            console.error('从合约获取持仓数据失败:', error);
            return this.getMockHoldings();
        }
    }

    getMockHoldings() {
        // 模拟持仓数据 - 包含单价信息
        return [
            { 
                token: 'tAAPL', 
                amount: 100.5, 
                price: 150.00, // 单价
                value: 15075.75, 
                custodian: 'StableStocks',
                priceChange: 2.5 // 价格变化百分比
            },
            { 
                token: 'tGOOGL', 
                amount: 25.0, 
                price: 150.00, 
                value: 3750.00, 
                custodian: 'XStocks',
                priceChange: -1.2
            },
            { 
                token: 'tMSFT', 
                amount: 50.0, 
                price: 375.00, 
                value: 18750.00, 
                custodian: 'StableStocks',
                priceChange: 0.8
            }
        ];
    }

    async handleStake() {
        const stakingToken = document.getElementById('staking-token');
        const stakingCustodian = document.getElementById('staking-custodian');
        const stakingAmount = document.getElementById('staking-amount');
        
        if (!stakingToken || !stakingCustodian || !stakingAmount) return;

        const token = stakingToken.value;
        const custodian = stakingCustodian.value;
        const amount = parseFloat(stakingAmount.value);

        if (!amount || amount <= 0) {
            this.showMessage('请输入有效的质押数量', 'error');
            return;
        }

        try {
            this.showLoading(true);
            
            // 模拟质押操作
            await this.simulateStake(token, amount, custodian);
            
            this.showMessage(`成功质押 ${amount} ${token} 到 ${custodian}`, 'success');
            this.updateHoldingsDisplay();
            this.updateMintableAmount();
            this.updateStakingForm();
            
        } catch (error) {
            this.showMessage(`质押失败: ${error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async handleMint() {
        const mintAmount = document.getElementById('mint-amount');
        if (!mintAmount) return;

        const amount = parseFloat(mintAmount.value);
        if (!amount || amount <= 0) {
            this.showMessage('请输入有效的铸造数量', 'error');
            return;
        }

        const mintableAmount = this.getMintableAmount();
        if (amount > mintableAmount) {
            this.showMessage(`铸造数量不能超过可铸造数量 (${mintableAmount.toLocaleString()} NUSD)`, 'error');
            return;
        }

        try {
            this.showLoading(true);
            
            // 模拟铸造操作
            await this.simulateMint(amount);
            
            this.showMessage(`成功铸造 ${amount.toLocaleString()} NUSD`, 'success');
            this.updateMintableAmount();
            mintAmount.value = '';
            
        } catch (error) {
            this.showMessage(`铸造失败: ${error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async handleRepay() {
        const mintAmount = document.getElementById('mint-amount');
        if (!mintAmount) return;

        const amount = parseFloat(mintAmount.value);
        if (!amount || amount <= 0) {
            this.showMessage('请输入有效的归还数量', 'error');
            return;
        }

        try {
            this.showLoading(true);
            
            // 模拟归还操作
            await this.simulateRepay(amount);
            
            this.showMessage(`成功归还 ${amount.toLocaleString()} NUSD`, 'success');
            this.updateMintableAmount();
            mintAmount.value = '';
            
        } catch (error) {
            this.showMessage(`归还失败: ${error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async handleUnstake() {
        const stakingToken = document.getElementById('staking-token');
        const stakingAmount = document.getElementById('staking-amount');
        
        if (!stakingToken || !stakingAmount) return;

        const token = stakingToken.value;
        const amount = parseFloat(stakingAmount.value);

        if (!amount || amount <= 0) {
            this.showMessage('请输入有效的解除质押数量', 'error');
            return;
        }

        try {
            this.showLoading(true);
            
            // 模拟解除质押操作
            await this.simulateUnstake(token, amount);
            
            this.showMessage(`成功解除质押 ${amount} ${token}`, 'success');
            this.updateHoldingsDisplay();
            this.updateMintableAmount();
            this.updateStakingForm();
            
        } catch (error) {
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

    // 模拟操作函数
    async simulateStake(token, amount, custodian) {
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log(`模拟质押 ${amount} ${token} 到 ${custodian}`);
                
                // 更新模拟持仓数据
                const holdings = this.getMockHoldings();
                const existingHolding = holdings.find(h => h.token === token && h.custodian === custodian);
                
                if (existingHolding) {
                    existingHolding.amount += amount;
                    existingHolding.value = existingHolding.amount * 150; // 模拟价格
                } else {
                    holdings.push({
                        token: token,
                        amount: amount,
                        value: amount * 150, // 模拟价格
                        custodian: custodian
                    });
                }
                
                // 保存到localStorage（实际应用中应该保存到区块链）
                localStorage.setItem('mockHoldings', JSON.stringify(holdings));
                
                resolve();
            }, 1000);
        });
    }

    async simulateMint(amount) {
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log(`模拟铸造 ${amount} NUSD`);
                resolve();
            }, 1000);
        });
    }

    async simulateRepay(amount) {
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log(`模拟归还 ${amount} NUSD`);
                resolve();
            }, 1000);
        });
    }

    async simulateUnstake(token, amount) {
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log(`模拟解除质押 ${amount} ${token}`);
                resolve();
            }, 1000);
        });
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
