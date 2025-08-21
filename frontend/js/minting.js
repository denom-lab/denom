// 铸币模块功能

class MintingModule {
    constructor() {
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
        const holdings = this.getMockHoldings();
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
                        <span class="token-amount">数量: ${holding.amount.toFixed(2)}</span>
                        <span class="token-value">$${holding.value.toLocaleString()}</span>
                    `;
                    holdingsList.appendChild(holdingItem);
                    totalValue += holding.value;
                }
            });

            if (totalValueEl) {
                totalValueEl.textContent = totalValue.toLocaleString();
            }
        }
    }

    updateMintableAmount() {
        // 更新可铸造数量
        const holdings = this.getMockHoldings();
        const totalValue = holdings.reduce((sum, holding) => sum + holding.value, 0);
        const mintableAmount = totalValue * 0.7; // 70% 质押率

        const mintableEl = document.getElementById('mintable-amount');
        if (mintableEl) {
            mintableEl.textContent = mintableAmount.toLocaleString();
        }
    }

    getMockHoldings() {
        // 模拟持仓数据
        return [
            { token: 'tAAPL', amount: 100.5, value: 15075.75 },
            { token: 'tGOOGL', amount: 25.0, value: 3750.00 },
            { token: 'tMSFT', amount: 50.0, value: 18750.00 }
        ];
    }

    async handleStake() {
        const stakingToken = document.getElementById('staking-token');
        const stakingAmount = document.getElementById('staking-amount');
        
        if (!stakingToken || !stakingAmount) return;

        const token = stakingToken.value;
        const amount = parseFloat(stakingAmount.value);

        if (!amount || amount <= 0) {
            this.showMessage('请输入有效的质押数量', 'error');
            return;
        }

        try {
            this.showLoading(true);
            
            // 模拟质押操作
            await this.simulateStake(token, amount);
            
            this.showMessage(`成功质押 ${amount} ${token}`, 'success');
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
    async simulateStake(token, amount) {
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log(`模拟质押 ${amount} ${token}`);
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
