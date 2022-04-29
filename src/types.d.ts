import { ethers } from 'ethers';

export interface IContractAddress {
  pocp: string;
  forwarder: string;
}

export interface IContractAbi {
  pocp: ethers.ContractInterface | string;
  forwarder: ethers.ContractInterface | string;
}

export interface IContractFactory {
  network: number;
  getAddress(): IContractAddress;
  getAbi(): any;
}

export interface IContract {
  pocp: ethers.Contract | undefined;
  forwarder: ethers.Contract | undefined;
}

export interface RegisterDaoResponse {
  transactionReceipt: ethers.Transaction;
}

export interface IPocpConfig {
  relayer_token?: string;
}
