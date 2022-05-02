import { networks_ENUM } from '../constants';
import ContractFactory from '../contracts';
import { ethers } from 'ethers';
import {
  IContract,
  IContractAbi,
  IContractAddress,
  IContractFactory,
  IPocpConfig,
} from '../types';
import {
  signedTypedData,
  SignMethodFunctionCall,
} from '../utils/signTypedData';
import {
  relayerServerCall,
  RelayMethodFunctionCall,
} from '../utils/relayFunction';
import { eventListener, EventsEnum } from '../utils/eventListeners';

class Pocp {
  signer!: ethers.Signer;
  provider!: ethers.providers.Provider;
  signerAddress!: string;
  config!: IPocpConfig;
  ContractAbi!: IContractAbi;
  ContractAddress!: IContractAddress;
  chainId: any;
  PocpInstance!: IContract;
  contractInfo!: IContractFactory;
  constructor(
    getSigner: ethers.Signer,
    getProvider: ethers.providers.Provider,
    config: IPocpConfig | undefined
  ) {
    this.signer = getSigner;
    this.provider = getProvider;

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

    // Polygon Mumbai network config
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

    // Polygon Mainnet network config
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
   * @throws "Relayer Api Call errors"
   */

  registerDaoToPocp = async (
    daoName: string,
    approverAddresses: [string],
    callbackFunction?: Function
  ) => {
    //performs relay function if config file is set

    if (this.config) {
      if (typeof this.config.relayer_token === 'string') {
        try {
          const signedMessage = await signedTypedData(
            this.signer,
            this.signerAddress,
            this.PocpInstance,
            this.ContractAddress,
            { daoName, approverAddresses },
            this.chainId,
            SignMethodFunctionCall.Register
          );

          if (signedMessage.signature) {
            const transactionHash = await relayerServerCall(
              this.config.relayer_token,
              RelayMethodFunctionCall.REGISTER,
              signedMessage.data,
              signedMessage.signature
            );
            const transactionReceipt = await this.provider.getTransaction(
              transactionHash.transactionHash
            );

            if (callbackFunction) {
              try {
                await eventListener(
                  this.PocpInstance.pocp,
                  EventsEnum.Register,
                  callbackFunction,
                  transactionHash.transactionHash
                );
              } catch (error) {
                throw error;
              }
            }
            return transactionReceipt;
          }
        } catch (error) {
          throw error;
        }
      } else {
        throw 'Relayer Token not a string or invalid';
      }
    } else {
      //performs direct contract call if no config file is set

      try {
        const res = await (
          await this.PocpInstance.pocp?.register(daoName, approverAddresses)
        ).wait();
        if (callbackFunction) {
          try {
            await eventListener(
              this.PocpInstance.pocp,
              EventsEnum.Register,
              callbackFunction,
              res.transactionHash
            );
          } catch (error) {
            throw error;
          }
        }
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
   * @throws "Relayer Api Call errors"
   */

  approveBadgeToContributor = async (
    communityId?: number,
    claimerAddresses?: [string],
    ipfsUrls?: [string],
    arrayOfIdentifiers?: [string],
    callbackFunction?: Function
  ) => {
    console.log(arrayOfIdentifiers);
    if (this.config) {
      if (typeof this.config.relayer_token === 'string') {
        try {
          const signedMessage = await signedTypedData(
            this.signer,
            this.signerAddress,
            this.PocpInstance,
            this.ContractAddress,
            { communityId, claimerAddresses, ipfsUrls, arrayOfIdentifiers },
            this.chainId,
            SignMethodFunctionCall.ApproveBadge
          );
          if (signedMessage.signature) {
            const transactionHash = await relayerServerCall(
              this.config.relayer_token,
              RelayMethodFunctionCall.APPROVE,
              signedMessage.data,
              signedMessage.signature
            );
            const transactionReceipt = await this.provider.getTransaction(
              transactionHash.transactionHash
            );
            if (callbackFunction) {
              try {
                await eventListener(
                  this.PocpInstance.pocp,
                  EventsEnum.Approve,
                  callbackFunction,
                  transactionHash.transactionHash
                );
              } catch (error) {
                throw error;
              }
            }

            return transactionReceipt;
          }
        } catch (error) {
          throw error;
        }
      } else {
        throw 'Relayer token is not a string';
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
        if (callbackFunction) {
          try {
            await eventListener(
              this.PocpInstance.pocp,
              EventsEnum.Approve,
              callbackFunction,
              res.transactionHash
            );
          } catch (error) {
            throw error;
          }
        }
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
   * @throws "Relayer Api Call errors"
   */

  claimBadgesByClaimers = async (
    tokenIds?: [number],
    callbackFunction?: Function
  ) => {
    if (this.config) {
      if (typeof this.config.relayer_token === 'string') {
        try {
          const signedMessage = await signedTypedData(
            this.signer,
            this.signerAddress,
            this.PocpInstance,
            this.ContractAddress,
            { tokenIds },
            this.chainId,
            SignMethodFunctionCall.ClaimBadge
          );
          if (signedMessage.signature) {
            const transactionHash = await relayerServerCall(
              this.config.relayer_token,
              RelayMethodFunctionCall.CLAIM,
              signedMessage.data,
              signedMessage.signature
            );
            const transactionReceipt = await this.provider.getTransaction(
              transactionHash.transactionHash
            );
            if (callbackFunction) {
              try {
                await eventListener(
                  this.PocpInstance.pocp,
                  EventsEnum.Claim,
                  callbackFunction,
                  transactionHash.transactionHash
                );
              } catch (error) {
                throw error;
              }
            }
            return transactionReceipt;
          }
        } catch (error) {
          throw error;
        }
      } else {
        throw 'Relayer token is not a string';
      }
    } else {
      try {
        const res = await (
          await this.PocpInstance.pocp?.claim(tokenIds)
        ).wait();
        if (callbackFunction) {
          try {
            await eventListener(
              this.PocpInstance.pocp,
              EventsEnum.Claim,
              callbackFunction,
              res.transactionHash
            );
          } catch (error) {
            throw error;
          }
        }
        return res;
      } catch (error) {
        throw error;
      }
    }
  };
}

export default Pocp;
