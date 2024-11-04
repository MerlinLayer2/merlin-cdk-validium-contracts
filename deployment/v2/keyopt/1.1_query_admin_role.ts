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
    "name": "admin",
    "outputs": [
        {
            "name": "",
            "type": "address"
        }
    ],
    "type": "function"
},{
    "constant": true,
    "inputs": [],
    "name": "pendingAdmin",
    "outputs": [
        {
            "name": "",
            "type": "address"
        }
    ],
    "type": "function"
}]

async function queryValidiumOwner(polygonValidiumContract: string, wallet: any) {
    let currentProvider = ethers.provider;
    const contract = new ethers.Contract(polygonValidiumContract, OwnerABI, wallet.connect(currentProvider));
    const owner = await contract.admin();
    const pendingAdmin = await contract.pendingAdmin();
    console.log('PolygonValidium queryValidiumOwner:', owner, 'pending admin', pendingAdmin)
}

async function main() {
    let adminKeyPath = keyPathParameters.adminKeyPath
    let adminprivateKey = fs.readFileSync(adminKeyPath, 'utf-8').toString().trim();

    const adminWallet = new ethers.Wallet(adminprivateKey);

    const polygonValidiumContract = parameters.polygonZkEVMAddress

    queryValidiumOwner(polygonValidiumContract, adminWallet)
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
