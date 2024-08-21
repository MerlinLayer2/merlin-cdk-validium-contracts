import fs from 'fs';
import {ethers} from "hardhat";

import keyPathParameters from "./key_path.json";

const data = require('./grantRoleOutput.json');
const addRollupParameters = require("./grantRole.json");


async function main() {
    const {accountToGrantRole, polygonRollupManagerAddress, timelockAddress, timelockDelay} = addRollupParameters;
    // 提取 scheduleData 和 executeData

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

    let deployerPath = keyPathParameters.adminKeyPath
    let privateKey = fs.readFileSync(deployerPath, 'utf-8').toString().trim();
    let wallet = new ethers.Wallet(privateKey);

    for (let i = 0; i < changeAdminRoles.length; i++) {
        const { scheduleData } = data[changeAdminRoles[i]];
        // eslint-disable-next-line no-await-in-loop
        const transactionResponse = await wallet.sendTransaction({
            to: timelockAddress,
            data: scheduleData,
        });

        // 等待交易被挖矿
        // eslint-disable-next-line no-await-in-loop
        const receipt = await transactionResponse.wait();

        // eslint-disable-next-line no-console
        console.log(receipt);
    }

    deployerPath = keyPathParameters.cdkValidiumOwnerKeyPath;
    privateKey = fs.readFileSync(deployerPath, 'utf-8').toString().trim();
    wallet = new ethers.Wallet(privateKey);

    for (let i = 0; i < changeValidiumRoles.length; i++) {
        const { scheduleData } = data[changeAdminRoles[i]];
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
