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

const contractABI3 = [
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

async function setTrustedSequencer(wallet: any, contractAddress: string, newTrustedSequencer: string) {
    try {
        let currentProvider = ethers.provider;
        const contract = new ethers.Contract(contractAddress, contractABI3, wallet.connect(currentProvider));

        const tx = await contract.setTrustedSequencer(newTrustedSequencer);
        const receipt = await tx.wait();

        console.log('Trusted sequencer setup transaction:', receipt);
    } catch (error) {
        console.error('Error setting up trusted sequencer:', error);
    }
}

async function setTrustedSequencerURL(wallet: any, contractAddress: string, newTrustedSequencerURL: string) {
    try {
        let currentProvider = ethers.provider;
        const contract = new ethers.Contract(contractAddress, contractABI3, wallet.connect(currentProvider));

        const tx = await contract.setTrustedSequencerURL(newTrustedSequencerURL);
        const receipt = await tx.wait();

        console.log('Trusted sequencer URL setup transaction:', receipt);
    } catch (error) {
        console.error('Error setting up trusted sequencer URL:', error);
    }
}

async function getTrustedSequencer(wallet: any, contractAddress: string) {
    try {
        let currentProvider = ethers.provider;
        const contract = new ethers.Contract(contractAddress, contractABI3, wallet.connect(currentProvider));

        const trustedSequencer = await contract.trustedSequencer();

        console.log('Trusted sequencer:', trustedSequencer);
    } catch (error) {
        console.error('Error getting trusted sequencer:', error);
    }
}

async function getTrustedSequencerURL(wallet: any, contractAddress: string) {
    try {
        let currentProvider = ethers.provider;
        const contract = new ethers.Contract(contractAddress, contractABI3, wallet.connect(currentProvider));

        const trustedSequencerURL = await contract.trustedSequencerURL();

        console.log('Trusted sequencer URL:', trustedSequencerURL);
    } catch (error) {
        console.error('Error getting trusted sequencer URL:', error);
    }
}

async function main() {
    let deployerPath = keyPathParameters.deployParameterPath
    let privateKey = fs.readFileSync(deployerPath, 'utf-8').toString().trim(); //todo
    const wallet = new ethers.Wallet(privateKey);

    const polygonZkEVMAddress = parameters.polygonZkEVMAddress //
    //parameters.trustedSequencer parameters.trustedSequencerURL
    console.log('polygonZkEVMAddress:', polygonZkEVMAddress,'begin to set to:', 'trustedSequencer:', parameters.trustedSequencer, 'trustedSequencerURL:', parameters.trustedSequencerURL)
    setTrustedSequencer(wallet, polygonZkEVMAddress, parameters.trustedSequencer)
    //sleep 2 seconds
    await new Promise((resolve) => { setTimeout(resolve, 2000); });
    setTrustedSequencerURL(wallet, polygonZkEVMAddress, parameters.trustedSequencerURL)
    await new Promise((resolve) => { setTimeout(resolve, 2000); });
    console.log('==========================set done query new trusted sequencer and url==========================')
    getTrustedSequencer(wallet, polygonZkEVMAddress)
    getTrustedSequencerURL(wallet, polygonZkEVMAddress)
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
