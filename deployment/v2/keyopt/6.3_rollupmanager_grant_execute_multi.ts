import fs from 'fs';
import { ethers } from 'hardhat';

import keyPathParameters from './key_path.json';
import {buildMultiSigBodyWithBody} from "./utils";
const data = require('./grantRoleOutput.json');

const parameters = require('./parameters.json');

async function main() {
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

    const currentProvider = ethers.provider;
    const deployerPath = keyPathParameters.new_timeLockKeyPath;
    const privateKey = fs.readFileSync(deployerPath, 'utf-8').toString().trim();
    const wallet = new ethers.Wallet(privateKey).connect(currentProvider);

    for (let i = 0; i < changeAdminRoles.length; i++) {
        const { executeData } = data[changeAdminRoles[i]];
        // eslint-disable-next-line no-await-in-loop
        const transactionResponse = await buildMultiSigBodyWithBody(wallet, executeData, parameters.timelockAddress, 'submitTransaction', keyPathParameters.new_timeLockKeyMultiSignerAddress);
        // eslint-disable-next-line no-await-in-loop
        const receipt = await transactionResponse.wait();
        // eslint-disable-next-line no-console
        console.log(receipt);
        // const transactionResponse = await wallet.sendTransaction({
        //     to: timelockAddress,
        //     data: executeData,
        // });
        //
        // // eslint-disable-next-line no-await-in-loop
        // const receipt = await transactionResponse.wait();
        //
        // // eslint-disable-next-line no-console
        // console.log(receipt);
    }

    for (let i = 0; i < changeValidiumRoles.length; i++) {
        const { executeData } = data[changeValidiumRoles[i]];
        // eslint-disable-next-line no-await-in-loop
        const transactionResponse = await buildMultiSigBodyWithBody(wallet, executeData, parameters.timelockAddress, 'submitTransaction', keyPathParameters.new_timeLockKeyMultiSignerAddress);
        // eslint-disable-next-line no-await-in-loop
        const receipt = await transactionResponse.wait();
        // eslint-disable-next-line no-console
        console.log(receipt);
        // const transactionResponse = await wallet.sendTransaction({
        //     to: timelockAddress,
        //     data: executeData,
        // });
        //
        // // eslint-disable-next-line no-await-in-loop
        // const receipt = await transactionResponse.wait();
        //
        // // eslint-disable-next-line no-console
        // console.log(receipt);
    }

    // for (let i = 0; i < changeAdminRoles.length; i++) {
    //     const { scheduleData } = data[changeAdminRoles[i]];
    //     // eslint-disable-next-line no-await-in-loop
    //     const transactionResponse = await wallet.sendTransaction({
    //         to: timelockAddress,
    //         data: scheduleData,
    //     });
    //     // eslint-disable-next-line no-await-in-loop
    //     const receipt = await transactionResponse.wait();
    //
    //     // eslint-disable-next-line no-console
    //     console.log(receipt);
    // }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
