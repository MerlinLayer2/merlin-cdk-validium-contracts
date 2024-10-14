/* eslint-disable no-await-in-loop, no-use-before-define, no-lonely-if */
/* eslint-disable no-console, no-inner-declarations, no-undef, import/no-unresolved */
import {expect} from "chai";
import path = require("path");
import fs = require("fs");

import * as dotenv from "dotenv";
dotenv.config({path: path.resolve(__dirname, "../../.env")});
import {ethers, upgrades} from "hardhat";
import "../../helpers/utils";
import {buildMultiSigBody} from "./utils";

const keyPathParameters = require("./key_path.json");
const parameters = require("./parameters.json");

const contractABI = [{
    "inputs": [
        {
            "internalType": "address",
            "name": "newOwner",
            "type": "address"
        }
    ],
    "name": "transferOwnership",
    "outputs": [

    ],
    "stateMutability": "nonpayable",
    "type": "function"
}]

async function transferOwnership(wallet: any, contractAddress: string, newOwner: string) {
    try {
        const contract = new ethers.Contract(contractAddress, contractABI, wallet);

        const tx = await contract.transferOwnership(newOwner);
        const receipt = await tx.wait();

        console.log('Ownership transfer transaction: to newOwner', newOwner, receipt);
    } catch (error) {
        console.error('Error changing ownership:', error);
    }
}


async function main() {
    let deployerPath = keyPathParameters.deployParameterPath
    //读deployerPath里面的私钥
    let currentProvider = ethers.provider;
    let privateKey = fs.readFileSync(deployerPath, 'utf-8').toString().trim();
    const wallet = new ethers.Wallet(privateKey)

    console.log('transferOwnership ')
    let deployerMultiSignerAddr = keyPathParameters.new_deployParameterMultiSignerAddress

    const dataCommitteeContractAddress = parameters.cdkDataCommitteeContract    //cdkDataCommittee
    transferOwnership(wallet.connect(currentProvider), dataCommitteeContractAddress, deployerMultiSignerAddr)

    //sleep 5second
    await new Promise(r => setTimeout(r, 5000));

    const cdkValidiumDeployerContract = parameters.cdkValidiumDeployerContract
    transferOwnership(wallet.connect(currentProvider), cdkValidiumDeployerContract, deployerMultiSignerAddr)
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
