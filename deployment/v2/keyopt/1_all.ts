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
    //读deployerPath里面的私钥
    let privateKey = fs.readFileSync(deployerPath, 'utf-8').toString().trim();
    const wallet = new ethers.Wallet(privateKey);

    // 1.transferOwnerShip()
    const newMultiSigner = '0xDCdB53f6633c9D290971Af961689c96B73B79c75' //todo
    /*
    const dataCommitteeContractAddress = '0x5Bd9bF8c2F6cd23fA3f62c2f32d79b1784DBAc4b' //cdkDataCommittee
    transferOwnership(wallet, dataCommitteeContractAddress, newMultiSigner)

    //cdkValidiumDeployerContract": "0x58556D60e530F89226FC12a3C2DA449fD3bbc90a
    const cdkValidiumDeployerContract = '0x58556D60e530F89226FC12a3C2DA449fD3bbc90a'
    transferOwnership(wallet, cdkValidiumDeployerContract, newMultiSigner)

    // 2.setupCommittee
    // "cdkDataCommitteeContract": "0x5Bd9bF8c2F6cd23fA3f62c2f32d79b1784DBAc4b",
    const cdkDataCommitteeContract = '0x5Bd9bF8c2F6cd23fA3f62c2f32d79b1784DBAc4b'
    const _requiredAmountOfSignatures = 3
    const urls = ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'] //todo
    const addresses = ['0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
        '0x4E83362442B8d1beC281594CEA3050c8EB01311C',
        '0xCA35b7d915458EF540aDe6068dFe2F44E8fa733c',
        '0xCA35b7d915458EF540aDe6068dFe2F44E8fa733c',
        '0xCA35b7d915458EF540aDe6068dFe2F44E8fa733c',
    ]; //todo replace addr

    // @ts-ignore
    const addrsBytes = new Uint8Array(addresses.map(address => Array.from(ethers2.utils.arrayify(address))).flat());

    setupCommitte(wallet, cdkDataCommitteeContract, _requiredAmountOfSignatures, urls, addrsBytes);
    */

    // 3.setup trusted sequencer
    //1. polygonValidiumEtrog   = "polygonZkEVMAddress": "0xBf4B031eb29fc34E2bCb4327F9304BED3600cc46",
    //const polygonZkEVMAddress = '0xBf4B031eb29fc34E2bCb4327F9304BED3600cc46'
    const polygonZkEVMAddress = '0x8dAF17A20c9DBA35f005b6324F493785D239719d'
    //todo transfer admin role ???

    //setTrustedSequencer(wallet, polygonZkEVMAddress, newMultiSigner)
    //setTrustedSequencerURL(wallet, polygonZkEVMAddress, 'http://localhost:3000') //todo

    // new rollup address
    // const polygonZkEVMAddress = '0x8dAF17A20c9DBA35f005b6324F493785D239719d'
    // console.log('11111')
    getTrustedSequencer(wallet, polygonZkEVMAddress)
    getTrustedSequencerURL(wallet, polygonZkEVMAddress)

}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
