import fs from 'fs';
import {ethers} from "hardhat";

import keyPathParameters from "./key_path.json";

const data = require('./grantRoleOutput2.json');
const addRollupParameters = require("./grantRole.json");

async function main() {
    const { timelockAddress } = addRollupParameters;
    // 提取 scheduleData 和 executeData

    const changeAdminRoles = [
        'TIMELOCK_ADMIN_ROLE',
    ];
    const currentProvider = ethers.provider;

    const deployerPath = keyPathParameters.adminKeyPath
    const privateKey = fs.readFileSync(deployerPath, 'utf-8').toString().trim();
    const wallet = new ethers.Wallet(privateKey);
    const deployer = wallet.connect(currentProvider);

    for (let i = 0; i < changeAdminRoles.length; i++) {
        const { executeData } = data[changeAdminRoles[i]];
        // eslint-disable-next-line no-await-in-loop
        const transactionResponse = await deployer.sendTransaction({
            to: timelockAddress,
            data: executeData,
        });

        // 等待交易被挖矿
        // eslint-disable-next-line no-await-in-loop
        const receipt = await transactionResponse.wait();

        // eslint-disable-next-line no-console
        console.log(receipt);
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
