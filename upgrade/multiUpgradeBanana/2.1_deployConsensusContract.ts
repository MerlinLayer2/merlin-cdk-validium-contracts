/* eslint-disable no-await-in-loop, no-use-before-define, no-lonely-if */
/* eslint-disable no-console, no-inner-declarations, no-undef, import/no-unresolved */
import {expect} from "chai";
import path = require("path");
import fs = require("fs");

import * as dotenv from "dotenv";
dotenv.config({path: path.resolve(__dirname, "../../.env")});
import {ethers, upgrades} from "hardhat";

const fork12configPath = require("./merlin-upgrade-fork12.json");

const pathOutputJson = path.join(__dirname, `./new-consensus-out.json`);

import {PolygonRollupManager} from "../../typechain-types";
import "../../deployment/helpers/utils";

async function main() {
    const outputJson = {} as any;

    let deployerPath = fork12configPath.admin_path
    let privateKey = fs.readFileSync(deployerPath, 'utf-8').toString().trim();
    let polygonRollupManagerAddress = fork12configPath.polygonRollupManagerAddress
    let consensusContract =  "PolygonValidiumEtrog"

    // Load provider
    let currentProvider = ethers.provider;
    // Load deployer
    let deployer;
    if (deployerPath !== undefined || deployerPath !== "") {
        deployer = new ethers.Wallet(privateKey, currentProvider);
    } else if (process.env.MNEMONIC) {
        deployer = ethers.HDNodeWallet.fromMnemonic(
            ethers.Mnemonic.fromPhrase(process.env.MNEMONIC),
            "m/44'/60'/0'/0/0"
        ).connect(currentProvider);
    } else {
        [deployer] = await ethers.getSigners();
    }

    console.log("Using with: ", deployer.address);

    // Load Rollup manager
    const PolgonRollupManagerFactory = await ethers.getContractFactory("PolygonRollupManager", deployer);
    const rollupManagerContract = PolgonRollupManagerFactory.attach(
        polygonRollupManagerAddress
    ) as PolygonRollupManager;

    // get data from rollupManagerContract
    const polygonZkEVMBridgeAddress = await rollupManagerContract.bridgeAddress();
    const polygonZkEVMGlobalExitRootAddress = await rollupManagerContract.globalExitRootManager();
    const polTokenAddress = await rollupManagerContract.pol();

    // Create consensus implementation if needed
    let polygonConsensusContractAddress;

    const PolygonconsensusFactory = (await ethers.getContractFactory(consensusContract, deployer)) as any;
    let PolygonconsensusContract;

    PolygonconsensusContract = await PolygonconsensusFactory.deploy(
            polygonZkEVMGlobalExitRootAddress,
            polTokenAddress,
            polygonZkEVMBridgeAddress,
            polygonRollupManagerAddress
    );
    await PolygonconsensusContract.waitForDeployment();

    console.log("#######################\n");
    console.log(`new PolygonconsensusContract impl: ${PolygonconsensusContract.target}`);

    console.log("Copy the following constructor arguments on: upgrade/arguments.js \n", [
        polygonZkEVMGlobalExitRootAddress,
        polTokenAddress,
        polygonZkEVMBridgeAddress,
        polygonRollupManagerAddress,
    ]);

    polygonConsensusContractAddress = PolygonconsensusContract.target;

    outputJson.polygonConsensusContractAddress = polygonConsensusContractAddress;
    // add time to output path
    fs.writeFileSync(pathOutputJson, JSON.stringify(outputJson, null, 1));
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
