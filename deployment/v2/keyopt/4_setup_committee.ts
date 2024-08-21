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

const contractABI2 = [{
    "inputs": [
        {
            "internalType": "uint256",
            "name": "_requiredAmountOfSignatures",
            "type": "uint256"
        },
        {
            "internalType": "string[]",
            "name": "urls",
            "type": "string[]"
        },
        {
            "internalType": "bytes",
            "name": "addrsBytes",
            "type": "bytes"
        }
    ],
    "name": "setupCommittee",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
}]

async function setupCommitte(wallet: any, contractAddress: string, _requiredAmountOfSignatures: number, urls: string[], addrsBytes: Uint8Array) {
    try {
        let currentProvider = ethers.provider;
        const contract = new ethers.Contract(contractAddress, contractABI2, wallet.connect(currentProvider));

        const tx = await contract.setupCommittee(_requiredAmountOfSignatures, urls, addrsBytes);
        const receipt = await tx.wait();

        console.log('Committee setup transaction:', receipt);
    } catch (error) {
        console.error('Error setting up committee:', error);
    }
}

async function main() {
    let deployerPath = keyPathParameters.new_deployParameterPath //todo right?
    let privateKey = fs.readFileSync(deployerPath, 'utf-8').toString().trim();
    const wallet = new ethers.Wallet(privateKey);

    console.log('setup committee')

    // setupCommittee
    const cdkDataCommitteeContract = parameters.cdkDataCommitteeContract
    const _requiredAmountOfSignatures = parameters.committeeThreshold
    const urls = parameters.committeeUrl
    const addresses = parameters.committeeAddr
    //@ts-ignore
    const addrsBytes = new Uint8Array(addresses.map(address => Array.from(ethers2.utils.arrayify(address))).flat());

    setupCommitte(wallet, cdkDataCommitteeContract, _requiredAmountOfSignatures, urls, addrsBytes);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
