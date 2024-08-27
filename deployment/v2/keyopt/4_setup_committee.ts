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
}, {
    "constant": true,
    "inputs": [{"name": "", "type": "uint256"}],
    "name": "members",
    "outputs": [
        {"name": "url", "type": "string"},
        {"name": "addr", "type": "address"}
    ],
    "type": "function"
},{
    "inputs": [],
    "name": "getAmountOfMembers",
    "outputs": [
        {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
        }
    ],
    "stateMutability": "view",
    "type": "function"
}]

async function setupCommitte(wallet: any, contractAddress: string, _requiredAmountOfSignatures: number, urls: string[], addrsBytes: Uint8Array) {
    try {
        let currentProvider = ethers.provider;
        const contract = new ethers.Contract(contractAddress, contractABI2, wallet.connect(currentProvider));

        const tx = await contract.setupCommittee(_requiredAmountOfSignatures, urls, addrsBytes);
        const receipt = await tx.wait();

        //const transactionResponse = await buildMultiSigBody(wallet.connect(currentProvider), contractABI2, 'setupCommittee', [_requiredAmountOfSignatures, urls, addrsBytes], contractAddress,  'submitTransaction', keyPathParameters.new_deployParameterMultiSignerAddress) //todo use new deployParameterPath
        // let receipt = await transactionResponse.wait();
        // console.log('setupCommittee submitTransaction', receipt);
    } catch (error) {
        console.error('Error setting up committee:', error);
    }
}

async function getCommitteeMembers(wallet: any, contractAddress: string) {
    try {
        let currentProvider = ethers.provider;
        const contract = new ethers.Contract(contractAddress, contractABI2, wallet.connect(currentProvider));

        console.log('datacommittee contract address', contractAddress)
        const memberCount = await contract.getAmountOfMembers();
        console.log('Amount of committee members:', memberCount.toString());
        for (let i = 0; i < memberCount; i++) {
            const member = await contract.members(i);
            console.log(`Member ${i}:`, member);
        }
    } catch (error) {
        console.error('Error getting committee members:', error);
    }
}

async function main() {
    let deployerPath = keyPathParameters.deployParameterPath
    let privateKey = fs.readFileSync(deployerPath, 'utf-8').toString().trim();
    const wallet = new ethers.Wallet(privateKey);

    console.log('setup committee')

    // setupCommittee
    const cdkDataCommitteeContract = parameters.cdkDataCommitteeContract
    const _requiredAmountOfSignatures = parameters.committeeThreshold
    const urls = parameters.committeeUrl
    const addresses = parameters.committeeAddr

    const addrsBytes = new Uint8Array(addresses.map(address => Array.from(Buffer.from(address.slice(2), 'hex'))).flat());

    getCommitteeMembers(wallet, cdkDataCommitteeContract)

    setupCommitte(wallet, cdkDataCommitteeContract, _requiredAmountOfSignatures, urls, addrsBytes);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
