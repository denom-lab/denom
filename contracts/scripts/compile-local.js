const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log("🔧 使用本地编译器编译合约...");

// 本地编译器路径
const SOLC_PATH = path.join(process.env.HOME, '.cache/hardhat-nodejs/compilers-v2/solc-v0.8.24+commit.e11b9ed9');

// 检查编译器是否存在
if (!fs.existsSync(SOLC_PATH)) {
    console.error("❌ 本地编译器不存在:", SOLC_PATH);
    process.exit(1);
}

console.log("✅ 找到本地编译器:", SOLC_PATH);

// 创建输出目录
const outputDir = path.join(__dirname, '../artifacts');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// 编译tAAPL合约
console.log("\n📦 编译 tAAPL.sol...");
try {
    const taaplOutput = execSync(`${SOLC_PATH} --bin --abi --base-path . --include-path node_modules src/tAAPL.sol`, {
        cwd: path.join(__dirname, '..'),
        encoding: 'utf8'
    });
    
    // 解析输出
    const lines = taaplOutput.split('\n');
    let contractName = '';
    let binary = '';
    let abi = '';
    
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('======= src/tAAPL.sol:tAAPL =======')) {
            contractName = 'tAAPL';
            // 获取二进制码
            if (i + 1 < lines.length && lines[i + 1].startsWith('Binary:')) {
                binary = lines[i + 1].replace('Binary:', '').trim();
            }
            // 获取ABI
            if (i + 2 < lines.length && lines[i + 2].startsWith('Contract JSON ABI')) {
                abi = lines[i + 2].replace('Contract JSON ABI:', '').trim();
            }
        }
    }
    
    if (contractName && binary && abi) {
        const artifact = {
            _format: "hh-sol-artifact-1",
            contractName: contractName,
            sourceName: "src/tAAPL.sol",
            abi: JSON.parse(abi),
            bytecode: `0x${binary}`,
            deployedBytecode: `0x${binary}`,
            linkReferences: {},
            deployedLinkReferences: {}
        };
        
        fs.writeFileSync(path.join(outputDir, 'tAAPL.json'), JSON.stringify(artifact, null, 2));
        console.log("✅ tAAPL 编译成功");
    } else {
        console.log("⚠️ tAAPL 编译输出解析失败");
        console.log("输出:", taaplOutput);
    }
} catch (error) {
    console.error("❌ tAAPL 编译失败:", error.message);
}

console.log("\n🎉 本地编译完成！");
console.log("输出目录:", outputDir);
