/* eslint-disable no-await-in-loop, no-use-before-define, no-lonely-if */
/* eslint-disable no-console, no-inner-declarations, no-undef, import/no-unresolved */
import {expect} from "chai";
import path = require("path");
import fs = require("fs");

import * as dotenv from "dotenv";
dotenv.config({path: path.resolve(__dirname, "../../.env")});
import {ethers} from "hardhat";

const addRollupParameters = require("./grantRole.json");
const parameters = require("./parameters.json");
const keyPathParameters = require("./key_path.json");

const pathOutputJson = path.join(__dirname, "./grantRoleOutput2.json");

async function main() {
    //getRoleAdmin(ethers.id("TRUSTED_AGGREGATOR_ROLE_ADMIN"))
    const outputJson = {} as any;

    const {accountToGrantRole, polygonRollupManagerAddress, timelockAddress, timelockDelay} = addRollupParameters;
    const salt = addRollupParameters.timelockSalt || ethers.ZeroHash;

    const changeAdminRoles = [
        "TIMELOCK_ADMIN_ROLE",
    ];

    let deployerPath = keyPathParameters.new_adminKeyPath
    let privateKey = fs.readFileSync(deployerPath, 'utf-8').toString().trim();
    let wallet = new ethers.Wallet(privateKey);
    const newAdminAddress = keyPathParameters.new_adminKeyMultiSignerAddress

    console.log(timelockAddress, newAdminAddress)
    // for in changeAdminRoles
    for (let i = 0; i < changeAdminRoles.length; i++) {
        console.log('to grant address ', newAdminAddress)
        await genByRole(timelockAddress, outputJson, wallet, changeAdminRoles[i], newAdminAddress, salt, timelockDelay)
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});

async function genByRole(timelockAddress:string, outputJson: any,wallet: any, roleName: string, accountToGrantRole: string,salt: any,timelockDelay: any) {
    const roleID = ethers.id(roleName);
    const timelockContractFactory = await ethers.getContractFactory("PolygonZkEVMTimelock", wallet);


    const operation = genOperation(
        timelockAddress,
        0, // value
        timelockContractFactory.interface.encodeFunctionData("grantRole", [roleID, accountToGrantRole]),
        //PolgonRollupManagerFactory.interface.encodeFunctionData("revokeRole", [roleID, accountToGrantRole]),
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

    console.log(outputJson)
    fs.writeFileSync(pathOutputJson, JSON.stringify(outputJson, null, 1));
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
