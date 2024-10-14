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

const contractABI = [
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "newTrustedSequencer",
                "type": "address"
            }
        ],
        "name": "setTrustedSequencer",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "newTrustedSequencerURL",
                "type": "string"
            }
        ],
        "name": "setTrustedSequencerURL",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "trustedSequencer",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "trustedSequencerURL",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
]

async function getTrustedSequencer(wallet: any, contractAddress: string) {
    try {
        let currentProvider = ethers.provider;
        const contract = new ethers.Contract(contractAddress, contractABI, wallet.connect(currentProvider));

        const trustedSequencer = await contract.trustedSequencer();

        console.log('Trusted sequencer:', trustedSequencer);
    } catch (error) {
        console.error('Error getting trusted sequencer:', error);
    }
}

async function getTrustedSequencerURL(wallet: any, contractAddress: string) {
    try {
        let currentProvider = ethers.provider;
        const contract = new ethers.Contract(contractAddress, contractABI, wallet.connect(currentProvider));

        const trustedSequencerURL = await contract.trustedSequencerURL();

        console.log('Trusted sequencer URL:', trustedSequencerURL);
    } catch (error) {
        console.error('Error getting trusted sequencer URL:', error);
    }
}

async function main() {
    let deployerPath = keyPathParameters.deployParameterPath
    //读deployerPath里面的私钥
    let privateKey = fs.readFileSync(deployerPath, 'utf-8').toString().trim();
    const wallet = new ethers.Wallet(privateKey);
    const polygonZkEVMAddress = parameters.polygonZkEVMAddress

    getTrustedSequencer(wallet, polygonZkEVMAddress)
    getTrustedSequencerURL(wallet, polygonZkEVMAddress)
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
