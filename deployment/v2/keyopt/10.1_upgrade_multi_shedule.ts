import path = require("path");
import fs = require("fs");

import * as dotenv from "dotenv";
import {ethers} from "hardhat";
import {ethers as ethers2} from "ethers";

dotenv.config({path: path.resolve(__dirname, "../../.env")});

const newConsensusPath = require("./new-consensus-out.json");
const newVerifierPath = require("./new-verifier-out.json");
const fork9configPath = require("./merlin-upgrade-fork9.json")
// @ts-ignore
const RollupABI = [{"inputs":[{"internalType":"address","name":"consensusImplementation","type":"address"},{"internalType":"contract IVerifierRollup","name":"verifier","type":"address"},{"internalType":"uint64","name":"forkID","type":"uint64"},{"internalType":"uint8","name":"rollupCompatibilityID","type":"uint8"},{"internalType":"bytes32","name":"genesis","type":"bytes32"},{"internalType":"string","name":"description","type":"string"}],"name":"addNewRollupType","outputs":[],"stateMutability":"nonpayable","type":"function"}]
const TimelockABI = [{"inputs":[{"internalType":"address","name":"target","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"bytes","name":"data","type":"bytes"},{"internalType":"bytes32","name":"predecessor","type":"bytes32"},{"internalType":"bytes32","name":"salt","type":"bytes32"},{"internalType":"uint256","name":"delay","type":"uint256"}],"name":"schedule","outputs":[],"stateMutability":"nonpayable","type":"function"}]
const MultiABI = [{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"owners","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function","stateMutability":"view"},{"constant":false,"inputs":[{"name":"owner","type":"address"}],"name":"removeOwner","outputs":[],"payable":false,"type":"function","stateMutability":"nonpayable"},{"constant":false,"inputs":[{"name":"transactionId","type":"uint256"}],"name":"revokeConfirmation","outputs":[],"payable":false,"type":"function","stateMutability":"nonpayable"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"isOwner","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function","stateMutability":"view"},{"constant":true,"inputs":[{"name":"","type":"uint256"},{"name":"","type":"address"}],"name":"confirmations","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function","stateMutability":"view"},{"constant":true,"inputs":[{"name":"pending","type":"bool"},{"name":"executed","type":"bool"}],"name":"getTransactionCount","outputs":[{"name":"count","type":"uint256"}],"payable":false,"type":"function","stateMutability":"view"},{"constant":false,"inputs":[{"name":"owner","type":"address"}],"name":"addOwner","outputs":[],"payable":false,"type":"function","stateMutability":"nonpayable"},{"constant":true,"inputs":[{"name":"transactionId","type":"uint256"}],"name":"isConfirmed","outputs":[{"name":"","type":"bool"}],"payable":false,"type":"function","stateMutability":"view"},{"constant":true,"inputs":[{"name":"transactionId","type":"uint256"}],"name":"getConfirmationCount","outputs":[{"name":"count","type":"uint256"}],"payable":false,"type":"function","stateMutability":"view"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"transactions","outputs":[{"name":"destination","type":"address"},{"name":"value","type":"uint256"},{"name":"data","type":"bytes"},{"name":"executed","type":"bool"}],"payable":false,"type":"function","stateMutability":"view"},{"constant":true,"inputs":[],"name":"getOwners","outputs":[{"name":"","type":"address[]"}],"payable":false,"type":"function","stateMutability":"view"},{"constant":true,"inputs":[{"name":"from","type":"uint256"},{"name":"to","type":"uint256"},{"name":"pending","type":"bool"},{"name":"executed","type":"bool"}],"name":"getTransactionIds","outputs":[{"name":"_transactionIds","type":"uint256[]"}],"payable":false,"type":"function","stateMutability":"view"},{"constant":true,"inputs":[{"name":"transactionId","type":"uint256"}],"name":"getConfirmations","outputs":[{"name":"_confirmations","type":"address[]"}],"payable":false,"type":"function","stateMutability":"view"},{"constant":true,"inputs":[],"name":"transactionCount","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function","stateMutability":"view"},{"constant":false,"inputs":[{"name":"_required","type":"uint256"}],"name":"changeRequirement","outputs":[],"payable":false,"type":"function","stateMutability":"nonpayable"},{"constant":false,"inputs":[{"name":"transactionId","type":"uint256"}],"name":"confirmTransaction","outputs":[],"payable":false,"type":"function","stateMutability":"nonpayable"},{"constant":false,"inputs":[{"name":"destination","type":"address"},{"name":"value","type":"uint256"},{"name":"data","type":"bytes"}],"name":"submitTransaction","outputs":[{"name":"transactionId","type":"uint256"}],"payable":false,"type":"function","stateMutability":"nonpayable"},{"constant":true,"inputs":[],"name":"MAX_OWNER_COUNT","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function","stateMutability":"view"},{"constant":true,"inputs":[],"name":"required","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function","stateMutability":"view"},{"constant":false,"inputs":[{"name":"owner","type":"address"},{"name":"newOwner","type":"address"}],"name":"replaceOwner","outputs":[],"payable":false,"type":"function","stateMutability":"nonpayable"},{"constant":false,"inputs":[{"name":"transactionId","type":"uint256"}],"name":"executeTransaction","outputs":[],"payable":false,"type":"function","stateMutability":"nonpayable"},{"inputs":[{"name":"_owners","type":"address[]"},{"name":"_required","type":"uint256"}],"payable":false,"type":"constructor","stateMutability":"nonpayable"},{"payable":true,"type":"fallback","stateMutability":"payable"},{"anonymous":false,"inputs":[{"indexed":true,"name":"sender","type":"address"},{"indexed":true,"name":"transactionId","type":"uint256"}],"name":"Confirmation","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"sender","type":"address"},{"indexed":true,"name":"transactionId","type":"uint256"}],"name":"Revocation","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"transactionId","type":"uint256"}],"name":"Submission","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"transactionId","type":"uint256"}],"name":"Execution","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"transactionId","type":"uint256"}],"name":"ExecutionFailure","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"sender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Deposit","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"}],"name":"OwnerAddition","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"}],"name":"OwnerRemoval","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"required","type":"uint256"}],"name":"RequirementChange","type":"event"}]

async function main() {
    //let deployerPath = keyPathParameters.new_timeLockKeyPath
    let deployerPath = fork9configPath.timelock_path
    let privateKey = fs.readFileSync(deployerPath, 'utf-8').toString().trim();
    let wallet = new ethers.Wallet(privateKey);

    const currentProvider = ethers.provider;
    // @ts-ignore
    await buildMultiSigBodyWithBody(wallet.connect(currentProvider))
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});


async function buildMultiSigBodyWithBody(wallet: any){
    console.log("!!!!",newConsensusPath.deployedTo)
    console.log("!!!!",newVerifierPath.deployedTo)
    // @ts-ignore
    const contractInterface1 = new ethers2.Interface(RollupABI);
    // @ts-ignore
    const addRollupData = contractInterface1.encodeFunctionData(
        "addNewRollupType",
        [
            newConsensusPath.deployedTo,
            newVerifierPath.deployedTo,
            9,
            0,
            //root "0x5183b7033f156589d9d1190ad08dd5aa2af3cd4197afa57afa0509e0c61b254d",
            fork9configPath.genesis_root,
            "fork9 upgrade"
        ]
    );
    const contractInterface2 = new ethers2.Interface(TimelockABI);
    const timeLockData = contractInterface2.encodeFunctionData(
        "schedule",
        [
            "0xAefb2f4db0766F0D76c47d0dbc0A712D653cace6", 0, addRollupData, ethers.ZeroHash, fork9configPath.salt, fork9configPath.timelock_delay
        ]
    );

    const contractInterface3 = new ethers2.Interface(MultiABI);

    const multiTimelockData = contractInterface3.encodeFunctionData(
        "submitTransaction",
        [
            //timelock contract
            fork9configPath.timelock_contract,
            0, timeLockData
        ]
    );

    console.log("couching's",wallet.address)
    let r = await wallet.sendTransaction({
        //multi timelock address
        to: fork9configPath.multi_timelock,
        data: multiTimelockData,
        value: 0,
        gasLimit: 500000,
        gasPrice: ethers2.parseUnits('10', 'gwei'),
    })
    console.log(r,wallet.address)
}
