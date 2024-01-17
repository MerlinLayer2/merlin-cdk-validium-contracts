/* eslint-disable no-await-in-loop, no-use-before-define, no-lonely-if, import/no-dynamic-require */
/* eslint-disable no-console, no-inner-declarations, no-undef, import/no-unresolved */
const { expect } = require('chai');
const { ethers } = require('hardhat');
const hre = require('hardhat');

const gasPriceKeylessDeployment = '100'; // 100 gweis

async function deployCDKValidiumDeployer(deployerAddress, signer) {
    const CDKValidiumDeployerFactory = await ethers.getContractFactory('CDKValidiumDeployer', signer);

    const deployTxCDKValidiumDeployer = (CDKValidiumDeployerFactory.getDeployTransaction(
        deployerAddress,
    )).data;

    let maxFeePerGas;
    if (process.env.CUSTOMIZE_GAS === undefined || process.env.CUSTOMIZE_GAS === 'false') {
        const feeData = await ethers.provider.getFeeData();
        maxFeePerGas = feeData.maxFeePerGas;
    } else {
        maxFeePerGas = ethers.utils.parseUnits(process.env.MAX_FEE_PER_GAS, 'gwei');
    }
    const gasLimit = ethers.BigNumber.from(1000000); // Put 1 Million, aprox 650k are necessary
    const gasPrice = hre.network.name === 'hardhat'
        ? ethers.BigNumber.from(ethers.utils.parseUnits(gasPriceKeylessDeployment, 'gwei'))
        : maxFeePerGas;
    const to = '0x'; // bc deployment transaction, "to" is "0x"
    const tx = {
        to,
        nonce: 0,
        value: 0,
        gasLimit: gasLimit.toHexString(),
        gasPrice: gasPrice.toHexString(),
        data: deployTxCDKValidiumDeployer,
    };
    if (!(hre.network.name === 'hardhat')) {
        tx.chainId = signer.provider.network.chainId;
    }

    const signature = {
        v: 27,
        r: '0x5ca1ab1e0', // Equals 0x00000000000000000000000000000000000000000000000000000005ca1ab1e0
        s: '0x5ca1ab1e', // Equals 0x000000000000000000000000000000000000000000000000000000005ca1ab1e
    };
    const serializedTransaction = ethers.utils.serializeTransaction(tx, signature);
    const resultTransaction = ethers.utils.parseTransaction(serializedTransaction);
    const totalEther = gasLimit.mul(gasPrice); // 0.1 ether

    // Check if it's already deployed
    const cdkValidiumDeployerAddress = ethers.utils.getContractAddress(resultTransaction);
    if (await signer.provider.getCode(cdkValidiumDeployerAddress) !== '0x') {
        const cdkValidiumDeployerContract = CDKValidiumDeployerFactory.attach(cdkValidiumDeployerAddress);
        expect(await cdkValidiumDeployerContract.owner()).to.be.equal(signer.address);
        return [cdkValidiumDeployerContract, ethers.constants.AddressZero];
    }

    // Fund keyless deployment
    const params = {
        to: resultTransaction.from,
        value: totalEther.toHexString(),
    };
    await (await signer.sendTransaction(params)).wait();

    // Deploy supernes2Deployer
    await (await signer.provider.sendTransaction(serializedTransaction)).wait();

    const cdkValidiumDeployerContract = await CDKValidiumDeployerFactory.attach(cdkValidiumDeployerAddress);
    expect(await cdkValidiumDeployerContract.owner()).to.be.equal(deployerAddress);
    return [cdkValidiumDeployerContract, resultTransaction.from];
}

async function create2Deployment(cdkValidiumDeployerContract, salt, deployTransaction, dataCall, deployer, hardcodedGasLimit) {
    // Encode deploy transaction
    const hashInitCode = ethers.utils.solidityKeccak256(['bytes'], [deployTransaction]);

    // Precalculate create2 address
    const precalculatedAddressDeployed = ethers.utils.getCreate2Address(cdkValidiumDeployerContract.address, salt, hashInitCode);
    const amount = 0;

    if (await deployer.provider.getCode(precalculatedAddressDeployed) !== '0x') {
        return [precalculatedAddressDeployed, false];
    }

    if (dataCall) {
        // Deploy using create2 and call
        if (hardcodedGasLimit) {
            const populatedTransaction = await cdkValidiumDeployerContract.populateTransaction.deployDeterministicAndCall(
                amount,
                salt,
                deployTransaction,
                dataCall,
            );
            populatedTransaction.gasLimit = ethers.BigNumber.from(hardcodedGasLimit);
            await (await deployer.sendTransaction(populatedTransaction)).wait();
        } else {
            await (await cdkValidiumDeployerContract.deployDeterministicAndCall(amount, salt, deployTransaction, dataCall)).wait();
        }
    } else {
        // Deploy using create2
        if (hardcodedGasLimit) {
            const populatedTransaction = await cdkValidiumDeployerContract.populateTransaction.deployDeterministic(
                amount,
                salt,
                deployTransaction,
            );
            populatedTransaction.gasLimit = ethers.BigNumber.from(hardcodedGasLimit);
            await (await deployer.sendTransaction(populatedTransaction)).wait();
        } else {
            await (await cdkValidiumDeployerContract.deployDeterministic(amount, salt, deployTransaction)).wait();
        }
    }
    return [precalculatedAddressDeployed, true];
}

module.exports = {
    deployCDKValidiumDeployer,
    create2Deployment,
};
