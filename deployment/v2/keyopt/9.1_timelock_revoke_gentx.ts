import path = require("path");
import fs = require("fs");

import * as dotenv from "dotenv";
import {ethers} from "hardhat";
dotenv.config({path: path.resolve(__dirname, "../../.env")});


const parameters = require("./parameters.json");
const keyPathParameters = require("./key_path.json");

const pathOutputJson = path.join(__dirname, "./revokeRoleOutput2.json");

async function main() {
    const outputJson = {} as any;

    const {polygonRollupManagerAddress, timelockDelay} = parameters;
    const salt = parameters.timelockSalt || ethers.ZeroHash;

    const changeAdminRoles = [
        'TIMELOCK_ADMIN_ROLE',
        'PROPOSER_ROLE',
        'EXECUTOR_ROLE',
        'CANCELLER_ROLE'
    ];

    let deployerPath = keyPathParameters.timeLockKeyPath
    let privateKey = fs.readFileSync(deployerPath, 'utf-8').toString().trim();
    let wallet = new ethers.Wallet(privateKey)
    const currentProvider = ethers.provider;
    const deployer = wallet.connect(currentProvider)
    const oldAdminAddress = keyPathParameters.timeLockKeySignerAddress // new_timeLockKeyMultiSignerAddress
    // for in changeAdminRoles
    for (let i = 0; i < changeAdminRoles.length; i++) {
        await genByRole(polygonRollupManagerAddress, outputJson, deployer, changeAdminRoles[i], oldAdminAddress, salt, timelockDelay)
    }

    console.log(outputJson)
    fs.writeFileSync(pathOutputJson, JSON.stringify(outputJson, null, 1));
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});

async function genByRole(polygonRollupManagerAddress:string, outputJson: any,wallet: any, roleName: string, accountToRevokeRole: string,salt: any,timelockDelay: any) {
    const roleID = ethers.id(roleName);
    const timelockContractFactory = await ethers.getContractFactory("PolygonZkEVMTimelock", wallet);


    const operation = genOperation(
        polygonRollupManagerAddress,
        0, // value
        timelockContractFactory.interface.encodeFunctionData("revokeRole", [roleID, accountToRevokeRole]),
        ethers.ZeroHash, // predecesoor
        salt // salt
    );

    // Schedule operation
    const scheduleData = timelockContractFactory.interface.encodeFunctionData("schedule", [
        operation.target,
        operation.value,
        operation.data,
        operation.predecessor,
        operation.salt,
        timelockDelay,
    ]);
    // Execute operation
    const executeData = timelockContractFactory.interface.encodeFunctionData("execute", [
        operation.target,
        operation.value,
        operation.data,
        operation.predecessor,
        operation.salt,
    ]);
    console.log({scheduleData});
    console.log({executeData});
    if (!outputJson[roleName]) {
        outputJson[roleName] = {};
    }
    outputJson[roleName].scheduleData = scheduleData;
    outputJson[roleName].executeData = executeData;
    // Decode the scheduleData for better readibility
    const timelockTx = timelockContractFactory.interface.parseTransaction({data: scheduleData});
    const paramsArray = timelockTx?.fragment.inputs;
    const objectDecoded = {};

    // @ts-ignore
    for (let i = 0; i < paramsArray?.length; i++) {
        const currentParam = paramsArray[i];
        // @ts-ignore
        //objectDecoded[currentParam.name] = timelockTx?.args[i];
    }

    outputJson[roleName].decodedScheduleData = objectDecoded;
}

// OZ test functions
function genOperation(target: any, value: any, data: any, predecessor: any, salt: any) {
    const abiEncoded = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint256", "bytes", "uint256", "bytes32"],
        [target, value, data, predecessor, salt]
    );
    const id = ethers.keccak256(abiEncoded);
    return {
        id,
        target,
        value,
        data,
        predecessor,
        salt,
    };
}
