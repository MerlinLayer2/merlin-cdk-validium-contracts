import fs from 'fs';
import { ethers } from 'hardhat';

import keyPathParameters from './key_path.json';

const data = require('./grantRoleOutput2.json');
const parameters = require('./parameters.json');

async function main() {
    const { timelockAddress } = parameters;
    // 提取 scheduleData 和 executeData

    const changeAdminRoles = [
        'TIMELOCK_ADMIN_ROLE',
        'PROPOSER_ROLE',
        'EXECUTOR_ROLE',
        'CANCELLER_ROLE',
    ];
    const currentProvider = ethers.provider;

    const deployerPath = keyPathParameters.timeLockKeyPath;
    const privateKey = fs.readFileSync(deployerPath, 'utf-8').toString().trim();
    const wallet = new ethers.Wallet(privateKey);
    const deployer = wallet.connect(currentProvider);

    for (let i = 0; i < changeAdminRoles.length; i++) {
        const { scheduleData } = data[changeAdminRoles[i]];
        // eslint-disable-next-line no-await-in-loop
        const transactionResponse = await deployer.sendTransaction({
            to: timelockAddress,
            data: scheduleData,
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
