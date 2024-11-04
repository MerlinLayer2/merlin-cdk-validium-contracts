import {expect} from "chai";
import path = require("path");
import fs = require("fs");

import * as dotenv from "dotenv";
dotenv.config({path: path.resolve(__dirname, "../../.env")});
import {ethers, upgrades} from "hardhat";
import "../../helpers/utils";
import {PolygonValidium} from "../../../typechain-types";

const keyPathParameters = require("./key_path.json");
const parameters = require("./parameters.json");

const OwnerABI = [{
    "constant": true,
    "inputs": [],
    "name": "owner",
    "outputs": [
        {
            "name": "",
            "type": "address"
        }
    ],
    "type": "function"
}]

async function queryValidiumOwner(polygonValidiumContract: string, wallet: any)  {
    let currentProvider = ethers.provider;
    const contract = new ethers.Contract(polygonValidiumContract, OwnerABI, wallet.connect(currentProvider));
    const owner = await contract.owner();
    return owner
}

async function main() {
    let adminKeyPath = keyPathParameters.adminKeyPath
    let adminprivateKey = fs.readFileSync(adminKeyPath, 'utf-8').toString().trim();

    const adminWallet = new ethers.Wallet(adminprivateKey);

    //const polygonValidiumContract = parameters.polygonZkEVMAddress
    //polygonDataCommittee,polygonZkevmDeployer
    const polygonValidiumContract = parameters.cdkDataCommitteeContract
    const polygonZkevmDeployer = parameters.cdkValidiumDeployerContract


    const owner1 = await queryValidiumOwner(polygonValidiumContract, adminWallet)
    const owner2 = await queryValidiumOwner(polygonZkevmDeployer, adminWallet)
    console.log('polygonValidiumContract owner:', owner1,'polygonZkevmDeployer owner:', owner2)
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
