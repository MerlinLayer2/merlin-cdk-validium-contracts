import {expect} from "chai";
import path = require("path");
import fs = require("fs");

import * as dotenv from "dotenv";
dotenv.config({path: path.resolve(__dirname, "../../.env")});
import {ethers, upgrades} from "hardhat";
import "../../helpers/utils";
import {PolygonValidium} from "../../../typechain-types";

import { ethers as ethers2 } from 'ethers';

import {buildMultiSigBody} from './utils'

const keyPathParameters = require("./key_path.json");
const parameters = require("./parameters.json");

async function changeValidiumOwner(polygonValidiumContract: string, fromWallet: any, toWallet: any, toAddress: string) {
    const consensusContract = 'PolygonZkEVMEtrog'
    const PolygonconsensusFactory = (await ethers.getContractFactory(consensusContract, fromWallet)) as any;
    const PolygonconsensusFactory2 = (await ethers.getContractFactory(consensusContract, toWallet)) as any;

    const PolygonValidiumContract = (await PolygonconsensusFactory.attach(polygonValidiumContract)) as PolygonValidium;
    const PolygonValidiumContract2 = (await PolygonconsensusFactory2.attach(polygonValidiumContract)) as PolygonValidium;

    // 1.transferAdminRole
    const tx = await PolygonValidiumContract.transferAdminRole(toAddress)
    const receipt = await tx.wait();
    console.log('changeValidiumOwner Ownership transferAdminRole to:', toAddress, 'transaction:', receipt);

    // no use
    // const tx2 = await PolygonValidiumContract2.acceptAdminRole()
    // const receipt2 = await tx2.wait();
    // console.log('changeValidiumOwner Ownership transfer transaction:', receipt2);

    // 2.acceptAdminRole

    const roleABI = [{"inputs":[],"name":"acceptAdminRole","outputs":[],"stateMutability":"nonpayable","type":"function"}]
    const transactionResponse = await buildMultiSigBody(toWallet, roleABI, 'acceptAdminRole', [], polygonValidiumContract,  'submitTransaction', keyPathParameters.new_adminKeyMultiSignerAddress)
    let receipt2 = await transactionResponse.wait();
    console.log('changeValidiumOwner submitTransaction',receipt2);
}



async function main() {
    let adminKeyPath = keyPathParameters.adminKeyPath
    let newAdminKeyPath = keyPathParameters.new_adminKeyPath
    let adminprivateKey = fs.readFileSync(adminKeyPath, 'utf-8').toString().trim();
    let newadminprivateKey = fs.readFileSync(newAdminKeyPath, 'utf-8').toString().trim();
    const currentProvider = ethers.provider;
    const adminWallet = new ethers.Wallet(adminprivateKey).connect(currentProvider);
    const newAdminWallet = new ethers.Wallet(newadminprivateKey).connect(currentProvider)

    const polygonValidiumContract = parameters.polygonZkEVMAddress
    const newAdminAddress = keyPathParameters.new_adminKeyMultiSignerAddress

    changeValidiumOwner(polygonValidiumContract, adminWallet, newAdminWallet, newAdminAddress)
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
