import { ethers } from 'ethers';

export enum EventsEnum {
  DaoContractDeployed = 'ProxyDeployed',
  MembershipClaimed = 'Claimed',
  IssueBadge = 'Issue',
  FunctionRouted = 'FunctionRouted',
}

export const eventListener = async (
  contractInstance: ethers.Contract | undefined,
  eventType: EventsEnum,
  callbackFunction: Function,
  txHash: string
) => {
  contractInstance?.on(eventType, async (...args) => {
    if (args[args.length - 1].transactionHash === txHash) {
      try {
        await callbackFunction(args);
      } catch (error) {
        throw error;
      }
    }
  });
};
