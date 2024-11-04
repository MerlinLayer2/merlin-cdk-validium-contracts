import fs from 'fs';
import {ethers} from "hardhat";

import keyPathParameters from "./key_path.json";
import {PolygonRollupManager} from "../../../typechain-types";
import {optionalRpcOldBlockTag} from "hardhat/internal/core/jsonrpc/types/input/blockTag";
import {buildMultiSigBody, buildMultiSigBodyWithBody} from "./utils";

const data = require('./grantRoleOutput.json');
const parameters = require('./parameters.json');

const ABI = [
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "role",
                "type": "bytes32"
            },
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "name": "grantRole",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }, {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "role",
                "type": "bytes32"
            },
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "name": "revokeRole",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },

]

async function main() {
    const { polygonRollupManagerAddress } = parameters;

    const adminRoleName = "EMERGENCY_COUNCIL_ADMIN";
    const adminRole = ethers.id(adminRoleName)
    const role = ethers.id("EMERGENCY_COUNCIL_ROLE");

    const currentProvider = ethers.provider;
    const deployerPath = keyPathParameters.new_cdkValidiumOwnerKeyPath;
    const privateKey = fs.readFileSync(deployerPath, 'utf-8').toString().trim();
    const deployer = new ethers.Wallet(privateKey).connect(currentProvider);

    const PolgonRollupManagerFactory = await ethers.getContractFactory("PolygonRollupManager", deployer);
    const rollupManagerContract = PolgonRollupManagerFactory.attach(
        polygonRollupManagerAddress
    ) as PolygonRollupManager;

    const oldAddress = keyPathParameters.cdkValidiumOwnerKeySignerAddress;
    const newAddress = keyPathParameters.new_cdkValidiumOwnerKeyMultiSignerAddress;
    console.log("mergency role grant from deployer to newdeployer", oldAddress, newAddress, "role", 'EMERGENCY_COUNCIL_ROLE');
    if (await rollupManagerContract.hasRole(adminRole, newAddress)) {
        console.log("deployer has role", adminRoleName)
        //const r = await rollupManagerContract.grantRole(role, newAddress);
        const r = await buildMultiSigBody(deployer, ABI, "grantRole",[role,newAddress], polygonRollupManagerAddress,'submitTransaction', newAddress)
        console.log(r);
    }
    console.log("mergency role revoke deployer", oldAddress, "role", role);
    const r = await buildMultiSigBody(deployer, ABI, "revokeRole",[role,oldAddress], polygonRollupManagerAddress,'submitTransaction', newAddress)
    console.log(r);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
