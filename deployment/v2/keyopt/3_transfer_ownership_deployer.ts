/* eslint-disable no-await-in-loop, no-use-before-define, no-lonely-if */
/* eslint-disable no-console, no-inner-declarations, no-undef, import/no-unresolved */
import {expect} from "chai";
import path = require("path");
import fs = require("fs");

import * as dotenv from "dotenv";
dotenv.config({path: path.resolve(__dirname, "../../.env")});
import {ethers, upgrades} from "hardhat";
import "../../helpers/utils";

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

async function transferOwnership(wallet: any,contractAddress: string,newOwner: string) {
    try {
        let currentProvider = ethers.provider;

        //console.log('privateKey:', privateKey)

        //const signerNode = await currentProvider.getSigner();
        const contract = new ethers.Contract(contractAddress, contractABI, wallet.connect(currentProvider));

        const tx = await contract.transferOwnership(newOwner);
        const receipt = await tx.wait();

        console.log('Ownership transfer transaction:', receipt);
    } catch (error) {
        console.error('Error changing ownership:', error);
    }
}


async function main() {
    let deployerPath = keyPathParameters.deployParameterPath
    //读deployerPath里面的私钥
    let privateKey = fs.readFileSync(deployerPath, 'utf-8').toString().trim();
    const wallet = new ethers.Wallet(privateKey);

    console.log('transferOwnership ')
    const newDeployer = keyPathParameters.deployParameterPath
    let newMultiSignerAddr = keyPathParameters.new_deployParameterMultiSignerAddress

    const dataCommitteeContractAddress = parameters.cdkDataCommitteeContract    //cdkDataCommittee
    transferOwnership(wallet, dataCommitteeContractAddress, newMultiSignerAddr)

    //cdkValidiumDeployerContract": "0x58556D60e530F89226FC12a3C2DA449fD3bbc90a
    const cdkValidiumDeployerContract = parameters.cdkValidiumDeployerContract
    transferOwnership(wallet, cdkValidiumDeployerContract, newMultiSignerAddr)

    // // 2.setupCommittee
    // // "cdkDataCommitteeContract": "0x5Bd9bF8c2F6cd23fA3f62c2f32d79b1784DBAc4b",
    // const cdkDataCommitteeContract = '0x5Bd9bF8c2F6cd23fA3f62c2f32d79b1784DBAc4b'
    // const _requiredAmountOfSignatures = parameters.committeeThreshold
    // const urls = parameters.committeeUrl
    // const addresses = parameters.committeeAddr
    // @ts-ignore
    //const addrsBytes = new Uint8Array(addresses.map(address => Array.from(ethers2.utils.arrayify(address))).flat());

    //setupCommitte(wallet, cdkDataCommitteeContract, _requiredAmountOfSignatures, urls, addrsBytes);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
