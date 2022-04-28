import { ethers } from 'ethers';

export interface IContractAddress {
  pocp: string;
  forwarder: string;
}

export interface IContractAbi {
  pocp: ethers.ContractInterface;
  forwarder: ethers.ContractInterface;
}

export interface IContractFactory {
  network: number;
  getAddress(): ContractAddress;
  getAbi(): ContractAbi;
}
