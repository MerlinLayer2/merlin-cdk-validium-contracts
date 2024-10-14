/* eslint-disable no-await-in-loop, no-use-before-define, no-lonely-if */
/* eslint-disable no-console, no-inner-declarations, no-undef, import/no-unresolved */
import {expect} from "chai";
import path = require("path");
import fs = require("fs");

import * as dotenv from "dotenv";
dotenv.config({path: path.resolve(__dirname, "../../.env")});
import {ethers} from "hardhat";

const parameters = require("./parameters.json");
const keyPathParameters = require("./key_path.json");

const pathOutputJson = path.join(__dirname, "./grantRoleOutput.json");

async function main() {
    const outputJson = {} as any;

    const {polygonRollupManagerAddress, timelockDelay} = parameters;
    const salt = parameters.timelockSalt || ethers.ZeroHash;

    const changeAdminRoles = [
        // "DEFAULT_ADMIN_ROLE",
        // "ADD_ROLLUP_TYPE_ROLE",
        // "ADD_EXISTING_ROLLUP_ROLE",
        // "UPDATE_ROLLUP_ROLE",

        // admin privatekey
        "OBSOLETE_ROLLUP_TYPE_ROLE",
        "CREATE_ROLLUP_ROLE",
        "STOP_EMERGENCY_ROLE",
        "TWEAK_PARAMETERS_ROLE",
        "SET_FEE_ROLE",
        "TRUSTED_AGGREGATOR_ROLE_ADMIN",
    ];
    const changeValidiumRoles = [
        "EMERGENCY_COUNCIL_ADMIN", //使用 cdkValidiumOwner.privatekey
    ]

    let deployerPath = keyPathParameters.new_adminKeyPath
    let privateKey = fs.readFileSync(deployerPath, 'utf-8').toString().trim();
    let wallet = new ethers.Wallet(privateKey);
    const newAdminAddress = keyPathParameters.new_adminKeyMultiSignerAddress
    // for in changeAdminRoles
    for (let i = 0; i < changeAdminRoles.length; i++) {
        await genByRole(polygonRollupManagerAddress, outputJson, wallet, changeAdminRoles[i], newAdminAddress, salt, timelockDelay)
    }

    const newValidiumAddress = keyPathParameters.new_cdkValidiumOwnerKeyMultiSignerAddress
    deployerPath = keyPathParameters.new_cdkValidiumOwnerKeyPath
    privateKey = fs.readFileSync(deployerPath, 'utf-8').toString().trim();
    wallet = new ethers.Wallet(privateKey);
    for (let i = 0; i < changeValidiumRoles.length; i++) {
        await genByRole(polygonRollupManagerAddress, outputJson, wallet, changeValidiumRoles[i], newValidiumAddress, salt, timelockDelay)
    }

    // const newTimeLockAdmin = keyPathParameters.new_timeLockKeyMultiSignerAddress
    // deployerPath = keyPathParameters.new_timeLockKeyPath
    // privateKey = fs.readFileSync(deployerPath, 'utf-8').toString().trim();
    // wallet = new ethers.Wallet(privateKey);
    // for (let i = 0; i < timeLockAdmin.length; i++) {
    //     await genByRole(timelockAddress, outputJson, wallet, timeLockAdmin[i],newTimeLockAdmin,salt, timelockDelay)
    // }

    console.log(outputJson)
    fs.writeFileSync(pathOutputJson, JSON.stringify(outputJson, null, 1));
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});

async function genByRole(polygonRollupManagerAddress:string, outputJson: any,wallet: any, roleName: string, accountToGrantRole: string,salt: any,timelockDelay: any) {
    const roleID = ethers.id(roleName);
    const timelockContractFactory = await ethers.getContractFactory("PolygonZkEVMTimelock", wallet);

    // Load Rollup manager
    const PolgonRollupManagerFactory = await ethers.getContractFactory("PolygonRollupManager", wallet);

    const operation = genOperation(
        polygonRollupManagerAddress,
        0, // value
        PolgonRollupManagerFactory.interface.encodeFunctionData("grantRole", [roleID, accountToGrantRole]),
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
