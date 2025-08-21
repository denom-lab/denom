// 数据面板模块功能

class DashboardModule {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadDashboardData();
        this.startHealthMonitoring();
    }

    setupEventListeners() {
        // 清算相关按钮
        const claimTaaplBtn = document.getElementById('claim-taapl-btn');
        if (claimTaaplBtn) {
            claimTaaplBtn.addEventListener('click', () => this.handleClaimTaapl());
        }

        const claimUsdcBtn = document.getElementById('claim-usdc-btn');
        if (claimUsdcBtn) {
            claimUsdcBtn.addEventListener('click', () => this.handleClaimUsdc());
        }
    }

    loadDashboardData() {
        this.updateHealthIndicator();
        this.updateRiskLevel();
        this.updateHoldingsDetailTable();
        this.loadNotifications();
        this.updateLiquidationStatus();
    }

    updateHealthIndicator() {
        const healthFill = document.getElementById('health-fill');
        const healthPercentage = document.getElementById('health-percentage');
        
        if (healthFill && healthPercentage) {
            const health = this.calculateHealthScore();
            
            healthFill.style.width = `${health}%`;
            healthPercentage.textContent = `${health}%`;
            
            if (health >= 80) {
                healthFill.style.background = 'linear-gradient(90deg, #10b981, #059669)';
            } else if (health >= 60) {
                healthFill.style.background = 'linear-gradient(90deg, #f59e0b, #d97706)';
            } else {
                healthFill.style.background = 'linear-gradient(90deg, #ef4444, #dc2626)';
            }
        }
    }

    updateRiskLevel() {
        const riskLevelEl = document.getElementById('risk-level');
        if (riskLevelEl) {
            const health = this.calculateHealthScore();
            let level, text;
            
            if (health >= 80) {
                level = 'low';
                text = '低风险';
            } else if (health >= 60) {
                level = 'medium';
                text = '中等风险';
            } else {
                level = 'high';
                text = '高风险';
            }
            
            riskLevelEl.className = `risk-level ${level}`;
            riskLevelEl.textContent = text;
        }
    }

    updateHoldingsDetailTable() {
        const tableBody = document.getElementById('holdings-detail-table');
        if (!tableBody) return;

        const holdings = this.getDetailedHoldings();
        
        tableBody.innerHTML = '';
        holdings.forEach(holding => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${holding.token}</td>
                <td>${holding.amount.toFixed(2)}</td>
                <td>$${holding.value.toLocaleString()}</td>
                <td>${holding.ratio}</td>
            `;
            tableBody.appendChild(tr);
        });
    }

    loadNotifications() {
        const notificationsList = document.getElementById('notifications-list');
        if (!notificationsList) return;

        const notifications = this.getNotifications();
        
        notificationsList.innerHTML = '';
        notifications.forEach(notification => {
            const notificationItem = document.createElement('div');
            notificationItem.className = `notification-item ${notification.type}`;
            notificationItem.innerHTML = `
                <i class="fas fa-${notification.icon}"></i>
                <span>${notification.message}</span>
            `;
            notificationsList.appendChild(notificationItem);
        });
    }

    updateLiquidationStatus() {
        const liquidationStatus = this.checkLiquidationStatus();
        
        if (liquidationStatus.hasLiquidation) {
            this.showLiquidationWarning(liquidationStatus);
        }
    }

    calculateHealthScore() {
        const baseScore = 85;
        const volatility = Math.random() * 20 - 10;
        return Math.max(0, Math.min(100, baseScore + volatility));
    }

    getDetailedHoldings() {
        return [
            { token: 'tAAPL', amount: 100.5, value: 15075.75, ratio: '70%' },
            { token: 'tGOOGL', amount: 25.0, value: 3750.00, ratio: '65%' },
            { token: 'tMSFT', amount: 50.0, value: 18750.00, ratio: '75%' }
        ];
    }

    getNotifications() {
        return [
            { type: 'info', message: '系统正常运行中', icon: 'info-circle' },
            { type: 'success', message: '质押操作成功完成', icon: 'check-circle' },
            { type: 'warning', message: '建议增加抵押品以提高健康度', icon: 'exclamation-triangle' }
        ];
    }

    checkLiquidationStatus() {
        const health = this.calculateHealthScore();
        return {
            hasLiquidation: health < 50,
            remainingAssets: health < 50 ? this.getRemainingAssets() : null
        };
    }

    getRemainingAssets() {
        return {
            taapl: 25.5,
            usdc: 1250.00
        };
    }

    showLiquidationWarning(status) {
        if (status.hasLiquidation) {
            const warning = document.createElement('div');
            warning.className = 'notification-item error';
            warning.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                <span>清算已发生！请及时claim剩余资产</span>
            `;
            
            const notificationsList = document.getElementById('notifications-list');
            if (notificationsList) {
                notificationsList.insertBefore(warning, notificationsList.firstChild);
            }
        }
    }

    async handleClaimTaapl() {
        try {
            this.showLoading(true);
            await this.simulateClaimTaapl();
            this.showMessage('成功claim tAAPL代币', 'success');
            this.updateHoldingsDetailTable();
        } catch (error) {
            this.showMessage(`Claim失败: ${error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async handleClaimUsdc() {
        try {
            this.showLoading(true);
            await this.simulateClaimUsdc();
            this.showMessage('成功claim USDC', 'success');
        } catch (error) {
            this.showMessage(`Claim失败: ${error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    startHealthMonitoring() {
        setInterval(() => {
            this.updateHealthIndicator();
            this.updateRiskLevel();
            this.updateLiquidationStatus();
        }, 30000);
    }

    async simulateClaimTaapl() {
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('模拟claim tAAPL');
                resolve();
            }, 1000);
        });
    }

    async simulateClaimUsdc() {
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('模拟claim USDC');
                resolve();
            }, 1000);
        });
    }

    showMessage(message, type = 'info') {
        if (window.web3App && window.web3App.showModal) {
            window.web3App.showModal(type === 'error' ? '错误' : '提示', message);
        } else {
            alert(message);
        }
    }

    showLoading(show) {
        if (window.web3App && window.web3App.showLoading) {
            window.web3App.showLoading(show);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.dashboardModule = new DashboardModule();
});
