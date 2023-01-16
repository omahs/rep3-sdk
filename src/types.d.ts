export interface IContractAddress {
  manager: string;
  beacon: string;
  router: string;
}

export interface IContractAbi {
  manager: string | any;
  beacon: string | any;
  proxy: string | any;
  router: string | any;
}

export interface IContractFactory {
  network: number;
  getAddress(): IContractAddress;
  getAbi(): any;
}

export interface IContract {
  manager: any | undefined;
  beacon: any | undefined;
}

export interface IConfig {
  biconomyInstance?: any;
  apiKey: number;
  relayURL: string;
}

export interface IMembershipVoucherV1 {
  levelCategory: [number];
  end: [number] | [];
  to: [string];
  tokenUris: string;
  signature: string;
}
export interface IMembershipVoucherV2 {
  data: [number];
  end: [number] | [];
  to: [string];
  tokenUris: string;
  signature: string;
}

export type RegisterEventCallback = (
  communityId: number,
  communityName: string,
  txSigner: string
) => any;
