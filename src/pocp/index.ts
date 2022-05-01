import { networks_ENUM } from '../constants';
import ContractFactory from '../contracts';
import { ethers } from 'ethers';
import {
  IContract,
  IContractAbi,
  IContractAddress,
  IContractFactory,
  IPocpConfig,
  RegisterDaoResponse,
  relayerData,
} from '../types';
import {
  signedTypedData,
  SignMethodFunctionCall,
} from '../utils/signTypedData';

class Pocp {
  signer!: ethers.Signer;
  signerAddress!: string;
  config!: IPocpConfig;
  ContractAbi!: IContractAbi;
  ContractAddress!: IContractAddress;
  chainId: any;
  PocpInstance!: IContract;
  contractInfo!: IContractFactory;
  constructor(getSigner: ethers.Signer, config: IPocpConfig | undefined) {
    this.signer = getSigner;
    if (config) {
      this.config = config;
    }
  }

  /*
   * Checks the chain id from the signer
   * @returns contract instances for forwarder and pocp
   * @throws error if not deployed in specified class initiated chain Id
   */

  createInstance = async () => {
    this.chainId = await this.signer.getChainId();
    this.contractInfo = new ContractFactory(this.chainId);
    this.ContractAbi = this.contractInfo.getAbi();
    this.ContractAddress = this.contractInfo.getAddress();
    this.signerAddress = await this.signer.getAddress();

    // mumbai network config
    if (this.chainId === networks_ENUM.MUMBAI) {
      this.PocpInstance = {
        pocp: new ethers.Contract(
          this.ContractAddress?.pocp,
          this.ContractAbi?.pocp,
          this.signer
        ),
        forwarder: new ethers.Contract(
          this.ContractAddress?.forwarder,
          this.ContractAbi?.forwarder,
          this.signer
        ),
      };
      return Pocp;
    }

    //polygon network config
    else if (this.chainId === networks_ENUM.POLYGON) {
      this.PocpInstance = {
        pocp: undefined,
        forwarder: undefined,
      };
      throw {
        errorMessage: `Pocp V1 is currently in mumbai testnet  and not in main net yet !`,
      };
    } else {
      this.PocpInstance = {
        pocp: undefined,
        forwarder: undefined,
      };
      throw {
        errorMessage: `Pocp V1 is currently in polygon  and not in other networks yet !`,
      };
    }
  };

  /*
   * @param dao name in string
   * @param array of approvers wallet address
   * @returns The transaction receipt is contract call success
   * @throws "Contract call fails"
   * @throws "Metamask errors"
   */

  registerDaoToPocp = async (
    daoName?: string,
    approverAddresses?: [string],
    relayerConfig?: relayerData,
    functionCall?: SignMethodFunctionCall
  ) => {
    console.log(relayerConfig);
    if (relayerConfig) {
      try {
        const signedMessage = await signedTypedData(
          this.signer,
          this.signerAddress,
          this.PocpInstance,
          this.ContractAddress,
          relayerConfig,
          this.chainId,
          functionCall
        );
        console.log('Signed message', signedMessage);
      } catch (error) {
        console.log('error', error);
      }
    } else {
      try {
        const res = await (
          await this.PocpInstance.pocp?.register(daoName, approverAddresses)
        ).wait();
        return res;
      } catch (error) {
        throw error;
      }
    }
  };

  /*
   * @param community id in number
   * @param array of claimers wallet address
   * @param array of ipfs badge url
   * @param array of identifiers
   * @returns The transaction receipt is contract call success
   * @throws "Contract call fails"
   * @throws "Metamask errors"
   */

  approveBadgeToContributor = async (
    communityId?: number,
    claimerAddresses?: [string],
    ipfsUrls?: [string],
    arrayOfIdentifiers?: [string],
    relayerConfig?: relayerData,
    functionCall?: SignMethodFunctionCall
  ): Promise<RegisterDaoResponse | string | unknown> => {
    if (relayerConfig) {
      try {
        const signedMessage = await signedTypedData(
          this.signer,
          this.signerAddress,
          this.PocpInstance,
          this.ContractAddress,
          relayerConfig,
          this.chainId,
          functionCall
        );
        console.log('Signed message', signedMessage);
      } catch (error) {
        console.log('error', error);
      }
    } else {
      try {
        const res = await (
          await this.PocpInstance.pocp?.approveBadge(
            communityId,
            claimerAddresses,
            ipfsUrls,
            arrayOfIdentifiers
          )
        ).wait();
        return res;
      } catch (error) {
        throw error;
      }
    }
  };

  /*
   * @param array of token ids
   * @returns The transaction receipt is contract call success
   * @throws "Contract call fails"
   * @throws "Metamask errors"
   */

  claimBadgesByClaimers = async (
    tokenIds?: [number],
    relayerConfig?: relayerData,
    functionCall?: SignMethodFunctionCall
  ): Promise<RegisterDaoResponse | string | unknown> => {
    if (relayerConfig) {
      try {
        const signedMessage = await signedTypedData(
          this.signer,
          this.signerAddress,
          this.PocpInstance,
          this.ContractAddress,
          relayerConfig,
          this.chainId,
          functionCall
        );
        console.log('Signed message', signedMessage);
      } catch (error) {
        console.log('error', error);
      }
    } else {
      try {
        const res = await (
          await this.PocpInstance.pocp?.claim(tokenIds)
        ).wait();
        return res;
      } catch (error) {
        throw error;
      }
    }
  };
}

export default Pocp;
