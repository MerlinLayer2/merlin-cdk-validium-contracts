/* eslint-disable no-await-in-loop, no-use-before-define, no-lonely-if */
/* eslint-disable no-console, no-inner-declarations, no-undef, import/no-unresolved */
import {expect} from "chai";
import path = require("path");
import fs = require("fs");

import * as dotenv from "dotenv";
dotenv.config({path: path.resolve(__dirname, "../../.env")});
import {ethers, upgrades} from "hardhat";
import {HardhatEthersSigner} from "@nomicfoundation/hardhat-ethers/signers";
import "../../helpers/utils";

import {
    PolygonRollupManager,
    PolygonZkEVMV2,
    PolygonZkEVMBridgeV2,
    PolygonValidium,
    PolygonValidiumEtrog, PolygonZkEVMTimelock,
} from "../../typechain-types";
import keyPathParameters from "./key_path.json";
import parameters from "./parameters.json";


// const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
// const ADD_ROLLUP_TYPE_ROLE = ethers.id("ADD_ROLLUP_TYPE_ROLE");
// const OBSOLETE_ROLLUP_TYPE_ROLE = ethers.id("OBSOLETE_ROLLUP_TYPE_ROLE");
// const CREATE_ROLLUP_ROLE = ethers.id("CREATE_ROLLUP_ROLE");
// const ADD_EXISTING_ROLLUP_ROLE = ethers.id("ADD_EXISTING_ROLLUP_ROLE");
// const UPDATE_ROLLUP_ROLE = ethers.id("UPDATE_ROLLUP_ROLE");
// // const TRUSTED_AGGREGATOR_ROLE = ethers.id("TRUSTED_AGGREGATOR_ROLE");
// // const TRUSTED_AGGREGATOR_ROLE_ADMIN = ethers.id("TRUSTED_AGGREGATOR_ROLE_ADMIN");
// const TWEAK_PARAMETERS_ROLE = ethers.id("TWEAK_PARAMETERS_ROLE");
// const SET_FEE_ROLE = ethers.id("SET_FEE_ROLE");
// const STOP_EMERGENCY_ROLE = ethers.id("STOP_EMERGENCY_ROLE");
// const EMERGENCY_COUNCIL_ROLE = ethers.id("EMERGENCY_COUNCIL_ROLE");
// const EMERGENCY_COUNCIL_ADMIN = ethers.id("EMERGENCY_COUNCIL_ADMIN");
// const TIMELOCK_ADMIN_ROLE = ethers.id("TIMELOCK_ADMIN_ROLE");


async function main() {
    let deployerPath = keyPathParameters.new_deployParameterPath //todo right?
    let privateKey = fs.readFileSync(deployerPath, 'utf-8').toString().trim();
    const wallet = new ethers.Wallet(privateKey);
    const deployer = wallet.connect(ethers.provider);

    // Load Rollup manager
    const PolgonRollupManagerFactory = await ethers.getContractFactory("PolygonRollupManager", deployer);
    const rollupManagerContract = PolgonRollupManagerFactory.attach(
        parameters.polygonRollupManagerAddress
    ) as PolygonRollupManager;

    const timelockContractFactory = await ethers.getContractFactory("PolygonZkEVMTimelock", deployer);
    const timelockContract = timelockContractFactory.attach(
        parameters.timelockAddress
    ) as PolygonZkEVMTimelock;

    // todo use for timelock admin change query
    // const timelockContractFactory = await ethers.getContractFactory("PolygonZkEVMTimelock", deployer);
    // const timelockContract = timelockContractFactory.attach(
    //     parameters.timelockAddress
    // ) as PolygonZkEVMTimelock;

    // const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
    // if ((await rollupManagerContract.hasRole(DEFAULT_ADMIN_ROLE, deployer.address)) == false) {
    //     throw new Error(
    //         `Deployer does not have admin role. Use the test flag on deploy_parameters if this is a test deployment`
    //     );
    // }

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
    const timelockAdminRoles = [
        "TIMELOCK_ADMIN_ROLE",
    ]
    console.log('=======================1 admin check ============================')
    const adminAddress = keyPathParameters.adminKeySignerAddress
    const newAdminAddress = keyPathParameters.new_adminKeyMultiSignerAddress
    for (let i = 0; i < changeAdminRoles.length; i++) {
        const role = ethers.id(changeAdminRoles[i])
        if ((await rollupManagerContract.hasRole(role, adminAddress)) == true){
            console.log(changeAdminRoles[i],'old admin has role true',  adminAddress)
        }else{
            console.log(changeAdminRoles[i],'new admin has role false',  adminAddress)
        }
        if ((await rollupManagerContract.hasRole(role, newAdminAddress)) == true){
            console.log(changeAdminRoles[i],'new admin has role true',  newAdminAddress)
        }else{
            console.log(changeAdminRoles[i],'new admin has role false',  newAdminAddress)
        }
    }
    console.log('=======================2 emergency check============================')
    const validiumAddress = keyPathParameters.cdkValidiumOwnerKeySignerAddress
    const newValidiumAddress = keyPathParameters.new_cdkValidiumOwnerKeyMultiSignerAddress

    for (let i = 0; i < changeValidiumRoles.length; i++) {
        const role = ethers.id(changeValidiumRoles[i])
        if ((await rollupManagerContract.hasRole(role, validiumAddress)) == true){
            console.log(changeValidiumRoles[i],'old admin has role true',  validiumAddress)
        }else{
            console.log(changeValidiumRoles[i],'old admin has role false',  validiumAddress)
        }
        if ((await rollupManagerContract.hasRole(role, newValidiumAddress)) == true){
            console.log(changeValidiumRoles[i],'new admin has role true',  newValidiumAddress)
        }else{
            console.log(changeValidiumRoles[i],'new admin has role false',  newValidiumAddress)
        }
    }

    console.log('=======================3 timelock admin check============================')
    const timelockAddress = keyPathParameters.timeLockKeySignerAddress
    const newTimeLockAdmin = keyPathParameters.new_timeLockKeyMultiSignerAddress

    for (let i = 0; i < timelockAdminRoles.length; i++) {
        const role = ethers.id(timelockAdminRoles[i])
        if ((await timelockContract.hasRole(role, timelockAddress)) == true){
            console.log(timelockAdminRoles[i],'old admin has role true',  timelockAddress)
        }else{
            console.log(timelockAdminRoles[i],'old admin has role false',  timelockAddress)
        }
        if ((await timelockContract.hasRole(role, newTimeLockAdmin)) == true){
            console.log(timelockAdminRoles[i],'new admin has role true',  newTimeLockAdmin)
        }else{
            console.log(timelockAdminRoles[i],'new admin has role false',  newTimeLockAdmin)
        }
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
