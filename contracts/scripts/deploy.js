const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 开始部署合约到Reddio测试网...");
    
    // 获取部署账户
    const [deployer] = await ethers.getSigners();
    console.log("📝 部署账户:", deployer.address);
    console.log("💰 账户余额:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");
    
    // 部署tAAPL合约
    console.log("\n📦 部署tAAPL合约...");
    const tAAPL = await ethers.getContractFactory("tAAPL");
    const taapl = await tAAPL.deploy(deployer.address);
    await taapl.waitForDeployment();
    const taaplAddress = await taapl.getAddress();
    console.log("✅ tAAPL合约已部署到:", taaplAddress);
    
    // 部署NUSD合约
    console.log("\n📦 部署NUSD合约...");
    const NUSD = await ethers.getContractFactory("NUSD");
    const nusd = await NUSD.deploy(deployer.address);
    await nusd.waitForDeployment();
    const nusdAddress = await nusd.getAddress();
    console.log("✅ NUSD合约已部署到:", nusdAddress);
    
    // 部署Vault合约
    console.log("\n📦 部署Vault合约...");
    const Vault = await ethers.getContractFactory("Vault");
    const vault = await Vault.deploy(nusdAddress, taaplAddress, deployer.address);
    await vault.waitForDeployment();
    const vaultAddress = await vault.getAddress();
    console.log("✅ Vault合约已部署到:", vaultAddress);
    
    // 配置权限
    console.log("\n⚙️ 配置合约权限...");
    
    // 将Vault设为NUSD的minter
    console.log("🔐 设置Vault为NUSD的minter...");
    const addMinterTx = await nusd.addMinter(vaultAddress);
    await addMinterTx.wait();
    console.log("✅ Vault已设为NUSD的minter");
    
    // 将Vault设为tAAPL的minter
    console.log("🔐 设置Vault为tAAPL的minter...");
    const updateOracleTx = await taapl.updatePriceOracle(vaultAddress);
    await updateOracleTx.wait();
    console.log("✅ Vault已设为tAAPL的priceOracle");
    
    // 验证部署
    console.log("\n🔍 验证部署结果...");
    
    const taaplSymbol = await taapl.symbol();
    const taaplName = await taapl.name();
    const taaplDecimals = await taapl.decimals();
    const taaplTotalSupply = await taapl.totalSupply();
    
    const nusdSymbol = await nusd.symbol();
    const nusdName = await nusd.name();
    const nusdDecimals = await nusd.decimals();
    const nusdTotalSupply = await nusd.totalSupply();
    
    console.log("📊 tAAPL合约信息:");
    console.log("   Symbol:", taaplSymbol);
    console.log("   Name:", taaplName);
    console.log("   Decimals:", taaplDecimals);
    console.log("   Total Supply:", ethers.formatEther(taaplTotalSupply));
    
    console.log("\n📊 NUSD合约信息:");
    console.log("   Symbol:", nusdSymbol);
    console.log("   Name:", nusdName);
    console.log("   Decimals:", nusdDecimals);
    console.log("   Total Supply:", ethers.formatEther(nusdTotalSupply));
    
    console.log("\n📊 Vault合约信息:");
    console.log("   NUSD地址:", nusdAddress);
    console.log("   tAAPL地址:", taaplAddress);
    console.log("   所有者:", deployer.address);
    
    // 保存部署信息
    const deploymentInfo = {
        network: "Reddio Testnet",
        chainId: 50341,
        deployer: deployer.address,
        contracts: {
            tAAPL: {
                address: taaplAddress,
                symbol: taaplSymbol,
                name: taaplName,
                decimals: taaplDecimals,
                totalSupply: ethers.formatEther(taaplTotalSupply)
            },
            NUSD: {
                address: nusdAddress,
                symbol: nusdSymbol,
                name: nusdName,
                decimals: nusdDecimals,
                totalSupply: ethers.formatEther(nusdTotalSupply)
            },
            Vault: {
                address: vaultAddress,
                nusdAddress: nusdAddress,
                taaplAddress: taaplAddress,
                owner: deployer.address
            }
        },
        timestamp: new Date().toISOString(),
        blockNumber: await deployer.provider.getBlockNumber()
    };
    
    // 写入部署信息到文件
    const fs = require('fs');
    fs.writeFileSync('deployment.json', JSON.stringify(deploymentInfo, null, 2));
    console.log("\n💾 部署信息已保存到 deployment.json");
    
    console.log("\n🎉 所有合约部署完成！");
    console.log("\n📋 部署摘要:");
    console.log("   tAAPL:", taaplAddress);
    console.log("   NUSD:", nusdAddress);
    console.log("   Vault:", vaultAddress);
    
    console.log("\n🔗 在Reddio测试网浏览器中查看:");
    console.log("   https://reddio-dev.reddio.com/");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ 部署失败:", error);
        process.exit(1);
    });
