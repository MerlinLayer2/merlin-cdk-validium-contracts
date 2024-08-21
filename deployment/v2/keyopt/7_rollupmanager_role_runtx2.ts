import fs from 'fs';
import { ethers } from 'hardhat';

import keyPathParameters from './key_path.json';

const addRollupParameters = require("./grantRole.json");

async function main() {
    const {accountToGrantRole, polygonRollupManagerAddress, timelockAddress, timelockDelay} = addRollupParameters;
    const changeAdminRoles = [
        // admin privatekey
        'OBSOLETE_ROLLUP_TYPE_ROLE',
        'CREATE_ROLLUP_ROLE',
        'STOP_EMERGENCY_ROLE',
        'TWEAK_PARAMETERS_ROLE',
        'SET_FEE_ROLE',
        'TRUSTED_AGGREGATOR_ROLE_ADMIN',
    ];
    const changeValidiumRoles = [
        'EMERGENCY_COUNCIL_ADMIN', // 使用 cdkValidiumOwner.privatekey
    ];

    let deployerPath = keyPathParameters.new_adminKeyPath
    let privateKey = fs.readFileSync(deployerPath, 'utf-8').toString().trim();
    let wallet = new ethers.Wallet(privateKey);

    for (let i = 0; i < changeAdminRoles.length; i++) {
        const { executeData } = addRollupParameters[changeAdminRoles[i]];
        // eslint-disable-next-line no-await-in-loop
        const transactionResponse = await wallet.sendTransaction({
            to: timelockAddress,
            data: executeData,
        });

        // eslint-disable-next-line no-await-in-loop
        const receipt = await transactionResponse.wait();

        // eslint-disable-next-line no-console
        console.log(receipt);
    }

    deployerPath = keyPathParameters.new_cdkValidiumOwnerKeyPath
    privateKey = fs.readFileSync(deployerPath, 'utf-8').toString().trim();
    wallet = new ethers.Wallet(privateKey);

    for (let i = 0; i < changeValidiumRoles.length; i++) {
        const { executeData } = addRollupParameters[changeAdminRoles[i]];
        // eslint-disable-next-line no-await-in-loop
        const transactionResponse = await wallet.sendTransaction({
            to: timelockAddress,
            data: executeData,
        });

        // eslint-disable-next-line no-await-in-loop
        const receipt = await transactionResponse.wait();

        // eslint-disable-next-line no-console
        console.log(receipt);
    }

    for (let i = 0; i < changeAdminRoles.length; i++) {
        const { scheduleData } = addRollupParameters[changeAdminRoles[i]];
        // eslint-disable-next-line no-await-in-loop
        const transactionResponse = await wallet.sendTransaction({
            to: timelockAddress,
            data: scheduleData,
        });
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
