import fs from 'fs';
import { ethers } from 'hardhat';

import keyPathParameters from './key_path.json';
import {buildMultiSigBodyWithBody} from "./utils";

const data = require('./revokeRoleOutput2.json');
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

    const deployerPath = keyPathParameters.new_timeLockKeyPath;
    const privateKey = fs.readFileSync(deployerPath, 'utf-8').toString().trim();
    const wallet = new ethers.Wallet(privateKey);
    const deployer = wallet.connect(currentProvider);

    for (let i = 0; i < changeAdminRoles.length; i++) {
        const { executeData } = data[changeAdminRoles[i]];
        // eslint-disable-next-line no-await-in-loop
        const transactionResponse = await buildMultiSigBodyWithBody(deployer, executeData, parameters.timelockAddress, 'submitTransaction', keyPathParameters.new_timeLockKeyMultiSignerAddress);
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
