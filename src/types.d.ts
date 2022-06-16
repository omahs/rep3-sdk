import { ethers } from 'ethers';

export interface IContractAddress {
  pocpManger: string;
  pocpBeacon: string;
}

export interface IContractAbi {
  pocpManger: ethers.ContractInterface | string;
  pocpBeacon: ethers.ContractInterface | string;
  pocpProxy: ethers.ContractInterface | string;
}

export interface IContractFactory {
  network: number;
  getAddress(): IContractAddress;
  getAbi(): any;
}

export interface IContract {
  pocpManager: ethers.Contract | undefined;
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
  relayer_token?: string;
  url: string;
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
