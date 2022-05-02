import { ethers } from 'ethers';

export enum EventsEnum {
  Register = 'CommunityRegistered',
  Approve = 'ApprovedBadge',
  Claim = 'ClaimedBadge',
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
