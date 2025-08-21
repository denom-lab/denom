// 投资市场模块功能

class InvestmentModule {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadInvestmentData();
    }

    setupEventListeners() {
        // 为池子操作按钮添加事件监听器
        this.setupPoolActions();
    }

    setupPoolActions() {
        // 动态为池子操作按钮添加事件
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-primary') && e.target.textContent.includes('存款')) {
                const poolItem = e.target.closest('.pool-item');
                if (poolItem) {
                    this.handleDeposit(poolItem);
                }
            } else if (e.target.classList.contains('btn-outline') && e.target.textContent.includes('取款')) {
                const poolItem = e.target.closest('.pool-item');
                if (poolItem) {
                    this.handleWithdraw(poolItem);
                }
            }
        });
    }

    loadInvestmentData() {
        this.updatePoolsList();
        this.updateInvestmentTable();
        this.updateInvestmentSummary();
    }

    updatePoolsList() {
        const poolsList = document.getElementById('pools-list');
        if (!poolsList) return;

        const pools = this.getPoolsData();
        
        poolsList.innerHTML = '';
        pools.forEach(pool => {
            const poolItem = document.createElement('div');
            poolItem.className = 'pool-item';
            poolItem.innerHTML = `
                <div class="pool-header">
                    <h4>${pool.name}</h4>
                    <span class="pool-apy">APY: ${pool.apy}</span>
                </div>
                <div class="pool-stats">
                    <div class="stat">
                        <span class="label">总流动性</span>
                        <span class="value">${pool.totalLiquidity}</span>
                    </div>
                    <div class="stat">
                        <span class="label">您的存款</span>
                        <span class="value">${pool.userDeposit}</span>
                    </div>
                </div>
                <div class="pool-actions">
                    <button class="btn btn-primary">存款</button>
                    <button class="btn btn-outline">取款</button>
                </div>
            `;
            poolsList.appendChild(poolItem);
        });
    }

    updateInvestmentTable() {
        const tableBody = document.getElementById('investment-table');
        if (!tableBody) return;

        const investments = this.getUserInvestments();
        
        if (investments.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #666;">暂无投资记录</td></tr>';
        } else {
            tableBody.innerHTML = '';
            investments.forEach(investment => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${investment.pool}</td>
                    <td>$${investment.deposit.toLocaleString()}</td>
                    <td>$${investment.earnings.toLocaleString()}</td>
                    <td>
                        <button class="btn btn-sm btn-outline">取款</button>
                    </td>
                `;
                tableBody.appendChild(tr);
            });
        }
    }

    updateInvestmentSummary() {
        const investments = this.getUserInvestments();
        const totalDeposit = investments.reduce((sum, inv) => sum + inv.deposit, 0);
        const totalEarnings = investments.reduce((sum, inv) => sum + inv.earnings, 0);

        // 更新总存款和总收益显示
        const summaryItems = document.querySelectorAll('.summary-item .value');
        if (summaryItems.length >= 2) {
            summaryItems[0].textContent = `$${totalDeposit.toLocaleString()}`;
            summaryItems[1].textContent = `$${totalEarnings.toLocaleString()}`;
        }
    }

    getPoolsData() {
        return [
            {
                name: '官方流动性池',
                apy: '8.5%',
                totalLiquidity: '$1,250,000',
                userDeposit: '$0.00'
            },
            {
                name: '稳定币池',
                apy: '5.2%',
                totalLiquidity: '$850,000',
                userDeposit: '$0.00'
            }
        ];
    }

    getUserInvestments() {
        // 模拟用户投资数据
        return [
            {
                pool: '官方流动性池',
                deposit: 5000,
                earnings: 125.50,
                startDate: '2024-01-15',
                apy: 8.5
            }
        ];
    }

    async handleDeposit(poolItem) {
        const poolName = poolItem.querySelector('h4').textContent;
        this.showMessage(`存款功能开发中 - ${poolName}`, 'info');
    }

    async handleWithdraw(poolItem) {
        const poolName = poolItem.querySelector('h4').textContent;
        this.showMessage(`取款功能开发中 - ${poolName}`, 'info');
    }

    showMessage(message, type = 'info') {
        if (window.web3App && window.web3App.showModal) {
            window.web3App.showModal(type === 'error' ? '错误' : '提示', message);
        } else {
            alert(message);
        }
    }
}

// 页面加载完成后初始化投资市场模块
document.addEventListener('DOMContentLoaded', () => {
    window.investmentModule = new InvestmentModule();
});
