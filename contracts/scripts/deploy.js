const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("使用账户部署:", deployer.address);
  console.log("账户余额:", (await deployer.getBalance()).toString());

  // 部署NUSD合约
  console.log("部署NUSD合约...");
  const NUSD = await ethers.getContractFactory("NUSD");
  const nusd = await NUSD.deploy(deployer.address);
  await nusd.deployed();
  console.log("NUSD合约已部署到:", nusd.address);

  // 部署Vault合约
  console.log("部署Vault合约...");
  const Vault = await ethers.getContractFactory("Vault");
  const vault = await Vault.deploy(nusd.address, deployer.address);
  await vault.deployed();
  console.log("Vault合约已部署到:", vault.address);

  // 将Vault设为NUSD的铸造者
  console.log("设置Vault为NUSD铸造者...");
  await nusd.addMinter(vault.address);
  console.log("Vault已设为NUSD铸造者");

  // 添加一些测试代币支持
  console.log("添加测试代币支持...");
  
  // 这里可以添加一些测试代币，比如USDC、WETH等
  // 注意：价格需要是18位精度，例如：
  // USDC价格 = $1.00 = 1 * 10^18
  // WETH价格 = $2000.00 = 2000 * 10^18
  
  console.log("部署完成！");
  console.log("NUSD合约地址:", nusd.address);
  console.log("Vault合约地址:", vault.address);
  
  // 输出一些有用的信息
  console.log("\n=== 部署后配置 ===");
  console.log("NUSD总供应量:", (await nusd.totalSupply()).toString());
  console.log("Vault是否支持NUSD:", await nusd.minters(vault.address));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
