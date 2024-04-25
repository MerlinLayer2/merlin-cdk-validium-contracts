/* eslint-disable no-await-in-loop, no-use-before-define, no-lonely-if */
/* eslint-disable no-console, no-inner-declarations, no-undef, import/no-unresolved */
import {expect} from "chai";
import path = require("path");
import fs = require("fs");

import * as dotenv from "dotenv";
dotenv.config({path: path.resolve(__dirname, "../../.env")});
import {ethers, upgrades} from "hardhat";
import {CDKDataCommittee, CDKValidium} from "../../typechain-types";
import {ProxyAdmin} from "../../typechain-types";

const pathOutputJson = path.join(__dirname, "./upgrade_outputL1.json");

const deployParameters = require("./deploy_parameters_l1.json");
const deployOutputParameters = require("./deploy_output_l1.json");
const upgradeParameters = require("./upgrade_parameters.json");

async function main() {
    upgrades.silenceWarnings();

    /*
     * Check upgrade parameters
     * Check that every necessary parameter is fullfilled
     */
    const mandatoryUpgradeParameters = ["realVerifier", "newForkID", "timelockDelay", "polTokenAddress"];

    for (const parameterName of mandatoryUpgradeParameters) {
        if (upgradeParameters[parameterName] === undefined || upgradeParameters[parameterName] === "") {
            throw new Error(`Missing parameter: ${parameterName}`);
        }
    }

    const {realVerifier, newForkID, timelockDelay, polTokenAddress} = upgradeParameters;
    const salt = upgradeParameters.timelockSalt || ethers.ZeroHash;

    /*
     * Check output parameters
     * Check that every necessary parameter is fullfilled
     */
    const mandatoryOutputParameters = [
        "polygonValidiumBridgeAddress",
        "polygonValidiumGlobalExitRootAddress",
        "polygonValidiumAddress",
        "timelockContractAddress",
        "cdkDataCommitteeContract",
    ];

    for (const parameterName of mandatoryOutputParameters) {
        if (deployOutputParameters[parameterName] === undefined || deployOutputParameters[parameterName] === "") {
            throw new Error(`Missing parameter: ${parameterName}`);
        }
    }

    const currentBridgeAddress = deployOutputParameters.polygonValidiumBridgeAddress;
    const currentGlobalExitRootAddress = deployOutputParameters.polygonValidiumGlobalExitRootAddress;
    const currentPolygonValidiumAddress = deployOutputParameters.polygonValidiumAddress;
    const currentTimelockAddress = deployOutputParameters.timelockContractAddress;
    const currentCDKDataCommitteeAddress = deployOutputParameters.cdkDataCommitteeContract;

    // Load onchain parameters
    const polygonValidiumFactory = await ethers.getContractFactory("CDKValidium");
    const polygonValidiumContract = (await polygonValidiumFactory.attach(currentPolygonValidiumAddress)) as CDKValidium;

    const admin = await polygonValidiumContract.admin();
    const trustedAggregator = await polygonValidiumContract.trustedAggregator();
    const trustedAggregatorTimeout = await polygonValidiumContract.trustedAggregatorTimeout();
    const pendingStateTimeout = await polygonValidiumContract.pendingStateTimeout();
    const chainID = await polygonValidiumContract.chainID();
    const emergencyCouncilAddress = await polygonValidiumContract.owner();

    console.log(
        {admin},
        {trustedAggregator},
        {trustedAggregatorTimeout},
        {pendingStateTimeout},
        {chainID},
        {emergencyCouncilAddress}
    );

    // Load provider
    let currentProvider = ethers.provider;
    if (deployParameters.multiplierGas || deployParameters.maxFeePerGas) {
        if (process.env.HARDHAT_NETWORK !== "hardhat") {
            currentProvider = ethers.getDefaultProvider(
                `https://${process.env.HARDHAT_NETWORK}.infura.io/v3/${process.env.INFURA_PROJECT_ID}`
            ) as any;
            if (deployParameters.maxPriorityFeePerGas && deployParameters.maxFeePerGas) {
                console.log(
                    `Hardcoded gas used: MaxPriority${deployParameters.maxPriorityFeePerGas} gwei, MaxFee${deployParameters.maxFeePerGas} gwei`
                );
                const FEE_DATA = new ethers.FeeData(
                    null,
                    ethers.parseUnits(deployParameters.maxFeePerGas, "gwei"),
                    ethers.parseUnits(deployParameters.maxPriorityFeePerGas, "gwei")
                );

                currentProvider.getFeeData = async () => FEE_DATA;
            } else {
                console.log("Multiplier gas used: ", deployParameters.multiplierGas);
                async function overrideFeeData() {
                    const feedata = await ethers.provider.getFeeData();
                    return new ethers.FeeData(
                        null,
                        ((feedata.maxFeePerGas as bigint) * BigInt(deployParameters.multiplierGas)) / 1000n,
                        ((feedata.maxPriorityFeePerGas as bigint) * BigInt(deployParameters.multiplierGas)) / 1000n
                    );
                }
                currentProvider.getFeeData = overrideFeeData;
            }
        }
    }

    // Load deployer
    let deployer;
    if (deployParameters.deployerPvtKey) {
        deployer = new ethers.Wallet(deployParameters.deployerPvtKey, currentProvider);
    } else if (process.env.MNEMONIC) {
        deployer = ethers.HDNodeWallet.fromMnemonic(
            ethers.Mnemonic.fromPhrase(process.env.MNEMONIC),
            "m/44'/60'/0'/0/0"
        ).connect(currentProvider);
    } else {
        [deployer] = await ethers.getSigners();
    }

    console.log("deploying with: ", deployer.address);

    const proxyAdminAddress = await upgrades.erc1967.getAdminAddress(currentPolygonValidiumAddress as string);
    const proxyAdminFactory = await ethers.getContractFactory("@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol:ProxyAdmin", deployer);
    const proxyAdmin  = proxyAdminFactory.attach(proxyAdminAddress) as ProxyAdmin;
    console.log('proxyAdminAddress', proxyAdminAddress)

    // deploy new verifier
    let verifierContract;
    if (realVerifier === true) {
        const VerifierRollup = await ethers.getContractFactory("FflonkVerifier", deployer);
        verifierContract = await VerifierRollup.deploy();
        await verifierContract.waitForDeployment();
    } else {
        const VerifierRollupHelperFactory = await ethers.getContractFactory("VerifierRollupHelperMock", deployer);
        verifierContract = await VerifierRollupHelperFactory.deploy();
        await verifierContract.waitForDeployment();
    }
    console.log("#######################\n");
    console.log("Verifier deployed to:", verifierContract.target);
    console.log(`npx hardhat verify ${verifierContract.target} --network ${process.env.HARDHAT_NETWORK}`);
    // load timelock
    const timelockContractFactory = await ethers.getContractFactory("CDKValidiumTimelock", deployer);

    // prapare upgrades

    // Prepare Upgrade PolygonDataCommittee
    const polygonDataCommitteeFactory = await ethers.getContractFactory("PolygonDataCommittee", deployer);
    const newDAImpl = await polygonDataCommitteeFactory.deploy();
    console.log("#######################\n");
    console.log(`PolygonDataCommittee impl: ${newDAImpl.target}`);

    console.log("you can verify the new impl address with:");
    console.log(`npx hardhat verify ${newDAImpl.target} --network ${process.env.HARDHAT_NETWORK}`);

    const CDKDataCommitteeFactory = await ethers.getContractFactory("CDKDataCommittee");
    const CDKDataCommitteeContract = (await CDKDataCommitteeFactory.attach(currentCDKDataCommitteeAddress)) as CDKDataCommittee;
    const memberCnt = await CDKDataCommitteeContract.getAmountOfMembers();
    console.log("current members: ");
    let member;
    for (let i = 0; i < memberCnt; i++) {
        member = await CDKDataCommitteeContract.members(i);
        console.log(member[0], member[1]);
    }

    const operationDA = genOperation(
        proxyAdmin.target,
        0, // value
        proxyAdmin.interface.encodeFunctionData("upgrade", [currentCDKDataCommitteeAddress, newDAImpl.target]),
        ethers.ZeroHash, // predecesoor
        salt // salt
    );


    // Prepare Upgrade PolygonValidiumBridge
    const polygonValidiumBridgeFactory = await ethers.getContractFactory("ZKFairZkEVMBridgeV2", deployer);
    const newBridgeImpl = await polygonValidiumBridgeFactory.deploy();

    console.log("#######################\n");
    console.log(`PolygonValidiumBridge impl: ${newBridgeImpl.target}`);

    console.log("you can verify the new impl address with:");
    console.log(`npx hardhat verify ${newBridgeImpl.target} --network ${process.env.HARDHAT_NETWORK}`);

    const operationBridge = genOperation(
        proxyAdmin.target,
        0, // value
        proxyAdmin.interface.encodeFunctionData("upgrade", [currentBridgeAddress, newBridgeImpl.target]),
        ethers.ZeroHash, // predecesoor
        salt // salt
    );

    // prepare upgrade global exit root
    // Prepare Upgrade  PolygonZkEVMGlobalExitRootV2
    const polygonGlobalExitRootV2 = await ethers.getContractFactory("PolygonZkEVMGlobalExitRootV2", deployer);
    const newGlobalExitRoortImpl = await polygonGlobalExitRootV2.deploy(currentPolygonValidiumAddress, currentBridgeAddress);

    console.log("#######################\n");
    console.log(`polygonGlobalExitRootV2 impl: ${newGlobalExitRoortImpl.target}`);

    console.log("you can verify the new impl address with:");
    console.log(
        `npx hardhat verify --constructor-args upgrade/arguments.js ${newGlobalExitRoortImpl.target} --network ${process.env.HARDHAT_NETWORK}\n`
    );
    console.log("Copy the following constructor arguments on: upgrade/arguments.js \n", [
        currentPolygonValidiumAddress,
        currentBridgeAddress,
    ]);

    const operationGlobalExitRoot = genOperation(
        proxyAdmin.target,
        0, // value
        proxyAdmin.interface.encodeFunctionData("upgrade", [currentGlobalExitRootAddress, newGlobalExitRoortImpl.target]),
        ethers.ZeroHash, // predecesoor
        salt // salt
    );

    // Update current system to rollup manager

    // deploy polygon zkEVM impl
    const PolygonValidiumV2ExistentFactory = await ethers.getContractFactory("PolygonValidiumExistentEtrog", deployer);
    const polygonValidiumEtrogImpl = await PolygonValidiumV2ExistentFactory.deploy(
        currentGlobalExitRootAddress,
        polTokenAddress,
        currentBridgeAddress,
        currentPolygonValidiumAddress
    );
    await polygonValidiumEtrogImpl.waitForDeployment();

    console.log("#######################\n");
    console.log(`new PolygonValidium impl: ${polygonValidiumEtrogImpl.target}`);

    console.log("you can verify the new impl address with:");
    console.log(
        `npx hardhat verify --constructor-args upgrade/arguments.js ${polygonValidiumEtrogImpl.target} --network ${process.env.HARDHAT_NETWORK}\n`
    );
    console.log("Copy the following constructor arguments on: upgrade/arguments.js \n", [
        currentGlobalExitRootAddress,
        polTokenAddress,
        currentBridgeAddress,
        currentPolygonValidiumAddress,
    ]);

    // deploy polygon zkEVM proxy
    const PolygonTransparentProxy = await ethers.getContractFactory("PolygonTransparentProxy", deployer);
    const newPolygonValidiumContract = await PolygonTransparentProxy.deploy(
        polygonValidiumEtrogImpl.target,
        currentPolygonValidiumAddress,
        "0x"
    );
    await newPolygonValidiumContract.waitForDeployment();
    console.log("#######################\n");
    console.log(`new PolygonValidium Proxy: ${newPolygonValidiumContract.target}`);

    console.log("you can verify the new impl address with:");
    console.log(
        `npx hardhat verify --constructor-args upgrade/arguments.js ${newPolygonValidiumContract.target} --network ${process.env.HARDHAT_NETWORK}\n`
    );
    console.log("Copy the following constructor arguments on: upgrade/arguments.js \n", [
        polygonValidiumEtrogImpl.target,
        currentPolygonValidiumAddress,
        "0x",
    ]);

    // Upgrade to rollup manager previous polygonZKEVM
    const PolygonRollupManagerFactory = await ethers.getContractFactory("PolygonRollupManager", deployer);
    const implRollupManager = await PolygonRollupManagerFactory.deploy(currentGlobalExitRootAddress, polTokenAddress, currentBridgeAddress);
    // const implRollupManager = await upgrades.prepareUpgrade(currentPolygonValidiumAddress, PolygonRollupManagerFactory, {
    //     constructorArgs: [currentGlobalExitRootAddress, polTokenAddress, currentBridgeAddress],
    //     unsafeAllow: ["constructor", "state-variable-immutable"],
    // });

    console.log("#######################\n");
    console.log(`Polygon rollup manager: ${implRollupManager.target}`);

    console.log("you can verify the new impl address with:");
    console.log(
        `npx hardhat verify --constructor-args upgrade/arguments.js ${implRollupManager.target} --network ${process.env.HARDHAT_NETWORK}\n`
    );
    console.log("Copy the following constructor arguments on: upgrade/arguments.js \n", [
        currentGlobalExitRootAddress,
        polTokenAddress,
        currentBridgeAddress,
    ]);

    const operationRollupManager = genOperation(
        proxyAdmin.target,
        0, // value
        proxyAdmin.interface.encodeFunctionData("upgradeAndCall", [
            currentPolygonValidiumAddress,
            implRollupManager.target,
            PolygonRollupManagerFactory.interface.encodeFunctionData("initialize", [
                trustedAggregator,
                pendingStateTimeout,
                trustedAggregatorTimeout,
                admin,
                currentTimelockAddress,
                emergencyCouncilAddress,
                newPolygonValidiumContract.target,
                verifierContract.target,
                newForkID,
                chainID,
            ]),
        ]),
        ethers.ZeroHash, // predecesoor
        salt // salt
    );

    // Schedule operation
    const scheduleData = timelockContractFactory.interface.encodeFunctionData("scheduleBatch", [
        [operationGlobalExitRoot.target, operationBridge.target, operationRollupManager.target, operationDA.target],
        [operationGlobalExitRoot.value, operationBridge.value, operationRollupManager.value, operationDA.value],
        [operationGlobalExitRoot.data, operationBridge.data, operationRollupManager.data, operationDA.data],
        ethers.ZeroHash, // predecesoor
        salt, // salt
        timelockDelay,
    ]);

    // Execute operation
    const executeData = timelockContractFactory.interface.encodeFunctionData("executeBatch", [
        [operationGlobalExitRoot.target, operationBridge.target, operationRollupManager.target, operationDA.target],
        [operationGlobalExitRoot.value, operationBridge.value, operationRollupManager.value, operationDA.value],
        [operationGlobalExitRoot.data, operationBridge.data, operationRollupManager.data, operationDA.data],
        ethers.ZeroHash, // predecesoor
        salt, // salt
    ]);

    console.log({scheduleData});
    console.log({executeData});

    const outputJson = {
        scheduleData,
        executeData,
        verifierAddress: verifierContract.target,
        newPolygonZKEVM: newPolygonValidiumContract.target,
        timelockContractAdress: currentTimelockAddress,
    };
    fs.writeFileSync(pathOutputJson, JSON.stringify(outputJson, null, 1));
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});

// OZ test functions
function genOperation(target: any, value: any, data: any, predecessor: any, salt: any) {
    const abiEncoded = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint256", "bytes", "uint256", "bytes32"],
        [target, value, data, predecessor, salt]
    );
    const id = ethers.keccak256(abiEncoded);
    return {
        id,
        target,
        value,
        data,
        predecessor,
        salt,
    };
}
