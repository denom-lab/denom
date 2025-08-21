const fs = require('fs');
const path = require('path');

console.log("🔍 验证合约文件结构...");

// 检查src目录
const srcDir = path.join(__dirname, '../src');
if (!fs.existsSync(srcDir)) {
    console.log("❌ src目录不存在");
    process.exit(1);
}

// 检查合约文件
const contracts = ['tAAPL.sol', 'NUSD.sol', 'Vault.sol'];
let allExist = true;

contracts.forEach(contract => {
    const contractPath = path.join(srcDir, contract);
    if (fs.existsSync(contractPath)) {
        console.log(`✅ ${contract} 存在`);
        
        // 检查文件内容
        const content = fs.readFileSync(contractPath, 'utf8');
        if (content.includes('pragma solidity')) {
            console.log(`   📝 包含Solidity声明`);
        } else {
            console.log(`   ❌ 缺少Solidity声明`);
            allExist = false;
        }
        
        if (content.includes('contract')) {
            console.log(`   📋 包含合约定义`);
        } else {
            console.log(`   ❌ 缺少合约定义`);
            allExist = false;
        }
    } else {
        console.log(`❌ ${contract} 不存在`);
        allExist = false;
    }
});

// 检查配置文件
const configFile = path.join(__dirname, '../hardhat.config.js');
if (fs.existsSync(configFile)) {
    console.log("✅ hardhat.config.js 存在");
} else {
    console.log("❌ hardhat.config.js 不存在");
    allExist = false;
}

// 检查环境文件
const envFile = path.join(__dirname, '../.env');
if (fs.existsSync(envFile)) {
    console.log("✅ .env 文件存在");
} else {
    console.log("❌ .env 文件不存在");
    allExist = false;
}

// 检查部署脚本
const deployScript = path.join(__dirname, 'deploy.js');
if (fs.existsSync(deployScript)) {
    console.log("✅ deploy.js 脚本存在");
} else {
    console.log("❌ deploy.js 脚本不存在");
    allExist = false;
}

console.log("\n📊 验证结果:");
if (allExist) {
    console.log("🎉 所有文件检查通过！");
    console.log("\n📋 下一步:");
    console.log("1. 确保网络连接正常");
    console.log("2. 运行: npx hardhat compile");
    console.log("3. 运行: npx hardhat run scripts/deploy.js --network reddio");
} else {
    console.log("❌ 部分文件检查失败，请检查上述错误");
    process.exit(1);
}
