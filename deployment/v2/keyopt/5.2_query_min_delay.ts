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

import keyPathParameters from "./key_path.json";
import parameters from "./parameters.json";

const ContractABI = [
    {
        "inputs": [],
        "name": "getMinDelay",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "duration",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
]

async function queryMinDelay(wallet: any, contractAddress: string) {
    try {
        let currentProvider = ethers.provider;
        const contract = new ethers.Contract(contractAddress, ContractABI, wallet.connect(currentProvider));
        //const contractAddress = parameters.cdkDataCommitteeContract;

        console.log('queryMinDelay', contractAddress);
        const minDelay = await contract.getMinDelay();
        console.log('minDelay:', minDelay.toString());

    } catch (error) {
        console.error('Error getting committee members:', error);
    }
}

async function main() {
    let deployerPath = keyPathParameters.new_deployParameterPath //todo right?
    let privateKey = fs.readFileSync(deployerPath, 'utf-8').toString().trim();
    const wallet = new ethers.Wallet(privateKey);

    console.log('query minDelay')

    // setupCommittee
    //const cdkDataCommitteeContract = parameters.cdkDataCommitteeContract
    const timelockContract = parameters.timelockAddress

    queryMinDelay(wallet, timelockContract)
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});

