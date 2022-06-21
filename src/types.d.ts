import { ethers } from 'ethers';
import Web3 from 'web3';
const web3 = new Web3();

export interface IContractAddress {
  pocpManger: string;
  pocpBeacon: string;
  pocpRouter: string;
}

export interface IContractAbi {
  pocpManger: ethers.ContractInterface | string | any;
  pocpBeacon: ethers.ContractInterface | string | any;
  pocpProxy: ethers.ContractInterface | string | any;
  pocpRouter: ethers.ContractInterface | string | any;
}

export interface IContractFactory {
  network: number;
  getAddress(): IContractAddress;
  getAbi(): any;
}

export interface IContract {
  pocpManager: web3.eth.Contract | undefined;
  pocpBeacon: ethers.Contract | undefined;
}

export interface RegisterDaoResponse {
  transactionReceipt: ethers.Transaction;
  communityId: number;
}

export interface RelayRequestResponse {
  transactionHash: string;
}

export interface IPocpConfig {
  biconomyInstance?: any;
  relayNetwork: number;
}

export interface relayerData {
  daoName?: string;
  approverAddresses?: [string];
  communityId?: number;
  claimerAddresses?: [string];
  ipfsUrls?: [string];
  arrayOfIdentifiers?: [string];
  tokenIds?: [number];
}

export interface relayerRequestData {
  from: string;
  to: string;
  nonce: number;
  value: number;
  gas: number;
  data: string | boolean | undefined;
}

export type RegisterEventCallback = (
  communityId: number,
  communityName: string,
  txSigner: string
) => any;
