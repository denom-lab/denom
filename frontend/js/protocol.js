// 协议信息模块功能

class ProtocolModule {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadProtocolData();
        this.startDataRefresh();
    }

    setupEventListeners() {
        // 协议统计项点击事件
        this.setupStatsClickEvents();
        
        // 状态指示器点击事件
        this.setupStatusClickEvents();
    }

    setupStatsClickEvents() {
        // 为协议统计项添加点击事件
        const statItems = document.querySelectorAll('.stat-item');
        statItems.forEach(item => {
            item.addEventListener('click', () => {
                const statLabel = item.querySelector('.stat-label').textContent;
                this.showStatDetails(statLabel);
            });
        });
    }

    setupStatusClickEvents() {
        // 为状态指示器添加点击事件
        const statusItems = document.querySelectorAll('.status-item');
        statusItems.forEach(item => {
            item.addEventListener('click', () => {
                const statusLabel = item.querySelector('.status-label').textContent;
                this.showStatusDetails(statusLabel);
            });
        });
    }

    loadProtocolData() {
        this.updateProtocolStats();
        this.updateProtocolStatus();
        this.loadProtocolMetrics();
    }

    updateProtocolStats() {
        const stats = this.getProtocolStats();
        
        Object.keys(stats).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = stats[id];
            }
        });
    }

    updateProtocolStatus() {
        // 更新协议状态指示器
        this.updateSystemStatus();
        this.updatePegStatus();
        this.updateLiquidationStatus();
    }

    updateSystemStatus() {
        const systemStatus = this.getSystemStatus();
        const statusEl = document.querySelector('.status-item .status-value');
        
        if (statusEl) {
            statusEl.className = `status-value ${systemStatus.level}`;
            statusEl.textContent = systemStatus.text;
        }
    }

    updatePegStatus() {
        const pegStatus = this.getPegStatus();
        const statusEl = document.querySelectorAll('.status-item .status-value')[1];
        
        if (statusEl) {
            statusEl.className = `status-value ${pegStatus.level}`;
            statusEl.textContent = pegStatus.text;
        }
    }

    updateLiquidationStatus() {
        const liquidationStatus = this.getLiquidationStatus();
        const statusEl = document.querySelectorAll('.status-item .status-value')[2];
        
        if (statusEl) {
            statusEl.className = `status-value ${liquidationStatus.level}`;
            statusEl.textContent = liquidationStatus.text;
        }
    }

    loadProtocolMetrics() {
        // 加载协议指标数据
        this.updateMarketMetrics();
        this.updateRiskMetrics();
    }

    updateMarketMetrics() {
        // 更新市场指标
        const metrics = this.getMarketMetrics();
        
        // 这里可以添加更多市场指标的显示
        console.log('市场指标已更新:', metrics);
    }

    updateRiskMetrics() {
        // 更新风险指标
        const metrics = this.getRiskMetrics();
        
        // 这里可以添加更多风险指标的显示
        console.log('风险指标已更新:', metrics);
    }

    getProtocolStats() {
        // 模拟协议统计数据
        return {
            'insurance-pool': '$2,500,000',
            'treasury-balance': '$1,800,000',
            'total-staked': '$15,750,000',
            'nusd-circulation': '$8,500,000'
        };
    }

    getSystemStatus() {
        // 模拟系统状态
        const statuses = [
            { level: 'online', text: '正常运行' },
            { level: 'warning', text: '维护中' },
            { level: 'offline', text: '离线' }
        ];
        
        // 90% 概率正常运行
        if (Math.random() > 0.1) {
            return statuses[0];
        } else if (Math.random() > 0.5) {
            return statuses[1];
        } else {
            return statuses[2];
        }
    }

    getPegStatus() {
        // 模拟锚定状态
        const pegDeviation = (Math.random() - 0.5) * 0.02; // -1% 到 +1%
        
        if (Math.abs(pegDeviation) < 0.005) { // 0.5% 以内
            return { level: 'stable', text: '稳定' };
        } else if (Math.abs(pegDeviation) < 0.01) { // 1% 以内
            return { level: 'stable', text: '轻微波动' };
        } else {
            return { level: 'unstable', text: '不稳定' };
        }
    }

    getLiquidationStatus() {
        // 模拟清算状态
        const liquidationRisk = Math.random();
        
        if (liquidationRisk < 0.8) {
            return { level: 'normal', text: '正常' };
        } else if (liquidationRisk < 0.95) {
            return { level: 'warning', text: '注意' };
        } else {
            return { level: 'warning', text: '高风险' };
        }
    }

    getMarketMetrics() {
        // 模拟市场指标
        return {
            totalVolume24h: '$2,500,000',
            activeUsers: '1,250',
            averageAPY: '6.8%',
            marketCap: '$25,000,000'
        };
    }

    getRiskMetrics() {
        // 模拟风险指标
        return {
            averageHealthScore: '78%',
            liquidationThreshold: '50%',
            maxDrawdown: '12%',
            volatilityIndex: 'Medium'
        };
    }

    showStatDetails(statLabel) {
        // 显示统计详情
        let details = '';
        
        switch (statLabel) {
            case '保险池金额':
                details = `
                    <h4>保险池详情</h4>
                    <p><strong>总金额:</strong> $2,500,000</p>
                    <p><strong>来源:</strong> 预结算USDC、协议费用</p>
                    <p><strong>用途:</strong> 市场回购、维护锚定</p>
                    <p><strong>分配:</strong> 60% 市场回购, 40% 流动性提供</p>
                `;
                break;
            case '协议国库余额':
                details = `
                    <h4>国库详情</h4>
                    <p><strong>总余额:</strong> $1,800,000</p>
                    <p><strong>收入来源:</strong> 质押费用、清算费用</p>
                    <p><strong>支出项目:</strong> 开发费用、运营费用</p>
                    <p><strong>储备率:</strong> 85%</p>
                `;
                break;
            case '总质押价值':
                details = `
                    <h4>质押详情</h4>
                    <p><strong>总价值:</strong> $15,750,000</p>
                    <p><strong>代币种类:</strong> 4种</p>
                    <p><strong>平均质押率:</strong> 70%</p>
                    <p><strong>活跃质押者:</strong> 450人</p>
                `;
                break;
            case 'NUSD流通量':
                details = `
                    <h4>NUSD详情</h4>
                    <p><strong>流通量:</strong> $8,500,000</p>
                    <p><strong>锚定状态:</strong> 稳定</p>
                    <p><strong>价格偏差:</strong> 0.2%</p>
                    <p><strong>市场深度:</strong> 高</p>
                `;
                break;
            default:
                details = '<p>暂无详细信息</p>';
        }
        
        this.showModal(`${statLabel}详情`, details);
    }

    showStatusDetails(statusLabel) {
        // 显示状态详情
        let details = '';
        
        switch (statusLabel) {
            case '系统状态':
                details = `
                    <h4>系统状态详情</h4>
                    <p><strong>当前状态:</strong> 正常运行</p>
                    <p><strong>运行时间:</strong> 99.8%</p>
                    <p><strong>最后维护:</strong> 2024-01-10</p>
                    <p><strong>下次维护:</strong> 2024-02-10</p>
                `;
                break;
            case '锚定状态':
                details = `
                    <h4>锚定状态详情</h4>
                    <p><strong>当前偏差:</strong> 0.2%</p>
                    <p><strong>目标范围:</strong> ±1%</p>
                    <p><strong>稳定机制:</strong> 保险池回购</p>
                    <p><strong>历史表现:</strong> 优秀</p>
                `;
                break;
            case '清算状态':
                details = `
                    <h4>清算状态详情</h4>
                    <p><strong>当前风险:</strong> 低</p>
                    <p><strong>清算阈值:</strong> 50%</p>
                    <p><strong>平均健康度:</strong> 78%</p>
                    <p><strong>预警机制:</strong> 已启用</p>
                `;
                break;
            default:
                details = '<p>暂无详细信息</p>';
        }
        
        this.showModal(`${statusLabel}详情`, details);
    }

    startDataRefresh() {
        // 定期刷新协议数据
        setInterval(() => {
            this.updateProtocolStatus();
            this.loadProtocolMetrics();
        }, 60000); // 每分钟更新一次
    }

    showModal(title, content) {
        if (window.web3App && window.web3App.showModal) {
            window.web3App.showModal(title, content);
        } else {
            alert(`${title}\n${content}`);
        }
    }
}

// 页面加载完成后初始化协议信息模块
document.addEventListener('DOMContentLoaded', () => {
    window.protocolModule = new ProtocolModule();
});
