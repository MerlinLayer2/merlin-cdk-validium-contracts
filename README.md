# Overview

Merlin Chain is the first Bitcoin Layer 2 solution built on the Polygon CDK, fully integrating a ZK-Rollup network, decentralized oracle network, and on-chain BTC fraud proof module. By leveraging these advanced technologies, Merlin Chain offers Bitcoin users significantly lower fees, reduced operational complexity, enhanced functionality, and broader asset compatibility. Our mission is to enhance the native capabilities of Bitcoin, making its use more efficient and enjoyable, and ultimately, to Make Bitcoin Fun Again.

# Merlin contracts

This repository contains the key contracts deployed on both Layer 1 and Layer 2 for the Merlin mainnet and testnet. These contracts provide crucial support for batch submission, cross-chain asset registration, zk-proof verification, and the overall upgrade and management of the chain.

## Mainnet Contracts:

### Layer 1

RPC: http://18.142.49.94:8545

| Contract Name | Address                                                                                                               |
|---------------| --------------------------------------------------------------------------------------------------------------------- |
| PolygonZkEVM  | 0xBf4B031eb29fc34E2bCb4327F9304BED3600cc46 |
| PolygonRollupManager | 0x68DdbE6638d7514a9Ed0B9B2980B65970e532cdB |
| PolToken | 0x9e2bC6EB2c9396ccbCC66353da011b67A0ff4604 |
| polygonZkEVMGlobalExitRoot | 0x8b97BF5C42739C375a2db080813E9b4C9A4a2c9A |


### Layer 2

Explorer: https://scan.merlinchain.io

| Contract Name             | Address                                                                                                               |
|---------------------------| --------------------------------------------------------------------------------------------------------------------- |
| CDKValidiumDeployer       | 0x9082c398077031e79E74C0A334cbC139C9c90851 |
| ProxyAdmin                | 0x0f4F82b3E7B27A9f8eC1b21e9bC43fd113fF0cf3 |
| PolygonZkEVMBridge    | 0xD7f0012F4909Ffa7e5DbfE5fbFf15aB734B42ED4 |
| PolygonZkEVMGlobalExitRootL2 | 0xa40D5f56745a118D0906a34E69aeC8C0Db1cB8fA |
| CDKValidiumTimelock | 0x7d72cc8E89B187a93581ee44FB1884b498989A40 |


## Testnet Contracts:

### Layer 1

RPC: http://61.10.9.18:7545

| Contract Name | Address                                                                                                               |
|---------------| --------------------------------------------------------------------------------------------------------------------- |
| PolygonZkEVM  | 0x8173da1A9d41287158E9b6E38Ca9CDabBAE6bb6B |
| PolygonRollupManager | 0xAefb2f4db0766F0D76c47d0dbc0A712D653cace6 |
| PolToken | 0xCC1975Bd1a1A2740ea47f9090f84755817049D94 |
| polygonZkEVMGlobalExitRoot | 0x07eb659bd996Ac74c154dfe86Ea875570647961C |
| CDKValidiumDeployer | 0x67c47bF785A538a96eF513507FbF6692170a9CB2 |
| FflonkVerifier | 0x636e55e6a34A02ec8383A88Bd4b0796C4F155107 |
| ProxyAdmin | 0x9ea2b4766D5af554053E7088149d7e5FF3dB5E07 |
| PolygonZkEVMBridge | 0xCa122881173F773A5d2DF68c2917D906ebb7133A |
| CDKDataCommittee | 0xC2B6bE3E2D867F199E056e8741D94949CB864ad2 |
| 

### Layer 2

Explorer: https://testnet-scan.merlinchain.io

| Contract Name             | Address                                                                                                               |
|---------------------------| --------------------------------------------------------------------------------------------------------------------- |
| CDKValidiumDeployer       | 0x357a1B9013Ab0175AE6802508D9Fc16A5b160b36 |
| ProxyAdmin                | 0x3Ee5586DEd0f89b82b90eeDE1aF929f6b45b48E3 |
| PolygonZkEVMBridge    | 0x5f1E2a726d1Fc49fb6B98b9A2041399823D6f3A9 |
| PolygonZkEVMGlobalExitRootL2 | 0xa40d5f56745a118d0906a34e69aec8c0db1cb8fa |
| CDKValidiumTimelock | 0x1434Da5133F8C56D69294Ee2CF4E6E386cfEbABa |



## Requirements

-   node version: 16.x
-   npm version: 7.x

## Install repo

```
npm i
```

## Run tests

```
npm run test
```

## Deploy on hardhat

```
npm run deploy:testnet:ZkEVM:localhost
```
