import {
  networks_ENUM,
  SIGNING_DOMAIN_NAME,
  SIGNING_DOMAIN_VERSION,
} from '../constants';
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
  signer!: ethers.Signer | any;
  provider!: ethers.providers.Provider;
  signerAddress!: string;
  config!: IPocpConfig;
  ContractAbi!: IContractAbi;
  ContractAddress!: IContractAddress;
  chainId: any;
  PocpInstance!: IContract;
  contractInfo!: IContractFactory;
  ProxyContractInstance!: ethers.Contract;
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
        pocpManager: new ethers.Contract(
          this.ContractAddress?.pocpManger,
          this.ContractAbi?.pocpManger,
          this.signer
        ),
        pocpBeacon: new ethers.Contract(
          this.ContractAddress?.pocpBeacon,
          this.ContractAbi?.pocpBeacon,
          this.signer
        ),
      };
      return Pocp;
    }

    // Polygon Mainnet network config
    // else if (this.chainId === networks_ENUM.POLYGON) {
    //   this.PocpInstance = {
    //     pocp: new ethers.Contract(
    //       this.ContractAddress?.pocp,
    //       this.ContractAbi?.pocp,
    //       this.signer
    //     ),
    //     forwarder: new ethers.Contract(
    //       this.ContractAddress?.forwarder,
    //       this.ContractAbi?.forwarder,
    //       this.signer
    //     ),
    //   };
    //   return Pocp;
    // }
    else {
      this.PocpInstance = {
        pocpManager: undefined,
        pocpBeacon: undefined,
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
    daoSymbol: string,
    approverAddresses: [string],
    callbackFunction?: Function
  ) => {
    //performs relay function if config file is set

    if (this.config) {
    } else {
      //performs direct contract call if no config file is set

      try {
        const res = await (
          await this.PocpInstance.pocpManager?.deployREP3TokenProxy(
            daoName,
            daoSymbol,
            approverAddresses,
            this.contractInfo.getAddress().pocpBeacon
          )
        ).wait();
        if (callbackFunction) {
          try {
            await eventListener(
              this.PocpInstance.pocpManager,
              EventsEnum.DaoContractDeployed,
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

  async _signingDomain(verifyingContract: string) {
    const chainId = await this.chainId;
    const _domain = {
      name: SIGNING_DOMAIN_NAME,
      version: SIGNING_DOMAIN_VERSION,
      verifyingContract,
      chainId,
    };
    return _domain;
  }

  generateLevelCategory(levels: [number], categories: [number]) {
    let levelCategoryArray = [];
    for (let i = 0; i < levels.length; i++) {
      const levelCategory = (levels[i] << 8) | categories[i];
      levelCategoryArray.push(levelCategory);
    }
    return levelCategoryArray;
  }

  createMembershipVoucher = async (
    proxyAddress: string,
    levels: [number],
    categories: [number],
    end: [number],
    to: [string],
    tokenUris: string
  ) => {
    const levelCategory = this.generateLevelCategory(levels, categories);
    const voucher = { levelCategory, end, to, tokenUris };
    const domain = await this._signingDomain(proxyAddress);
    const types = {
      NFTVoucher: [
        { name: 'levelCategory', type: 'uint16[]' },
        { name: 'end', type: 'uint8[]' },
        { name: 'to', type: 'address[]' },
        { name: 'tokenUris', type: 'string' },
      ],
    };
    const signature = await this.signer._signTypedData(domain, types, voucher);
    return {
      ...voucher,
      signature,
    };
  };

  claimMembershipNft = async (
    contractAddress: string,
    voucher: any,
    approvedAddressIndex: number,
    callbackFunction?: Function
  ) => {
    if (this.config) {
    } else {
      //performs direct contract call if no config file is set
      try {
        this.ProxyContractInstance = new ethers.Contract(
          contractAddress,
          this.ContractAbi?.pocpProxy,
          this.signer
        );
        const res = await (
          await this.ProxyContractInstance?.claimMembership(
            voucher,
            approvedAddressIndex
          )
        ).wait();
        if (callbackFunction) {
          try {
            await eventListener(
              this.PocpInstance.pocpManager,
              EventsEnum.MembershipClaimed,
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

  // approveBadgeToContributor = async (
  //   communityId?: number,
  //   claimerAddresses?: [string],
  //   ipfsUrls?: [string],
  //   arrayOfIdentifiers?: [string],
  //   callbackFunction?: Function
  // ) => {
  //   if (this.config) {
  //     if (typeof this.config.relayer_token === 'string') {
  //       try {
  //         const signedMessage = await signedTypedData(
  //           this.signer,
  //           this.signerAddress,
  //           this.PocpInstance,
  //           this.ContractAddress,
  //           { communityId, claimerAddresses, ipfsUrls, arrayOfIdentifiers },
  //           this.chainId,
  //           SignMethodFunctionCall.ApproveBadge
  //         );
  //         if (signedMessage.signature) {
  //           const transactionHash = await relayerServerCall(
  //             this.config.url,
  //             this.config.relayer_token,
  //             RelayMethodFunctionCall.APPROVE,
  //             signedMessage.data,
  //             signedMessage.signature,
  //             this.chainId
  //           );
  //           const transactionReceipt = await this.provider.getTransaction(
  //             transactionHash.transactionHash
  //           );
  //           if (callbackFunction) {
  //             try {
  //               await eventListener(
  //                 this.PocpInstance.pocp,
  //                 EventsEnum.Approve,
  //                 callbackFunction,
  //                 transactionHash.transactionHash
  //               );
  //             } catch (error) {
  //               throw error;
  //             }
  //           }

  //           return transactionReceipt;
  //         }
  //       } catch (error) {
  //         throw error;
  //       }
  //     } else {
  //       throw 'Relayer token is not a string';
  //     }
  //   } else {
  //     try {
  //       const res = await (
  //         await this.PocpInstance.pocp?.approveBadge(
  //           communityId,
  //           claimerAddresses,
  //           ipfsUrls,
  //           arrayOfIdentifiers
  //         )
  //       ).wait();
  //       if (callbackFunction) {
  //         try {
  //           await eventListener(
  //             this.PocpInstance.pocp,
  //             EventsEnum.Approve,
  //             callbackFunction,
  //             res.transactionHash
  //           );
  //         } catch (error) {
  //           throw error;
  //         }
  //       }
  //       return res;
  //     } catch (error) {
  //       throw error;
  //     }
  //   }
  // };

  /*
   * @param array of token ids
   * @returns The transaction receipt is contract call success
   * @throws "Contract call fails"
   * @throws "Metamask errors"
   * @throws "Relayer Api Call errors"
   */

  // claimBadgesByClaimers = async (
  //   tokenIds?: [number],
  //   callbackFunction?: Function
  // ) => {
  //   if (this.config) {
  //     if (typeof this.config.relayer_token === 'string') {
  //       try {
  //         const signedMessage = await signedTypedData(
  //           this.signer,
  //           this.signerAddress,
  //           this.PocpInstance,
  //           this.ContractAddress,
  //           { tokenIds },
  //           this.chainId,
  //           SignMethodFunctionCall.ClaimBadge
  //         );
  //         if (signedMessage.signature) {
  //           const transactionHash = await relayerServerCall(
  //             this.config.url,
  //             this.config.relayer_token,
  //             RelayMethodFunctionCall.CLAIM,
  //             signedMessage.data,
  //             signedMessage.signature,
  //             this.chainId
  //           );
  //           const transactionReceipt = await this.provider.getTransaction(
  //             transactionHash.transactionHash
  //           );
  //           if (callbackFunction) {
  //             try {
  //               await eventListener(
  //                 this.PocpInstance.pocp,
  //                 EventsEnum.Claim,
  //                 callbackFunction,
  //                 transactionHash.transactionHash
  //               );
  //             } catch (error) {
  //               throw error;
  //             }
  //           }
  //           return transactionReceipt;
  //         }
  //       } catch (error) {
  //         throw error;
  //       }
  //     } else {
  //       throw 'Relayer token is not a string';
  //     }
  //   } else {
  //     try {
  //       const res = await (
  //         await this.PocpInstance.pocp?.claim(tokenIds)
  //       ).wait();
  //       if (callbackFunction) {
  //         try {
  //           await eventListener(
  //             this.PocpInstance.pocp,
  //             EventsEnum.Claim,
  //             callbackFunction,
  //             res.transactionHash
  //           );
  //         } catch (error) {
  //           throw error;
  //         }
  //       }
  //       return res;
  //     } catch (error) {
  //       throw error;
  //     }
  //   }
  // };
}

export default Pocp;
