export interface IContractAddress {
  pocpManger: string;
  pocpBeacon: string;
  pocpRouter: string;
  trustedForwarder: string;
}

export interface IContractAbi {
  pocpManger: string | any;
  pocpBeacon: string | any;
  pocpProxy: string | any;
  pocpRouter: string | any;
}

export interface IContractFactory {
  network: number;
  getAddress(): IContractAddress;
  getAbi(): any;
}

export interface IContract {
  pocpManager: any | undefined;
  pocpBeacon: any | undefined;
}

export interface IPocpConfig {
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
