import ContractFactory from '../contracts';
import {
  IContract,
  IContractAbi,
  IContractAddress,
  IContractFactory,
  IMembershipVoucherV1,
  IMembershipVoucherV2,
  IConfig,
} from '../types';
// import { eventListener, EventsEnum } from '../utils/eventListeners';
import ProxyV1 from '../contracts/abi/proxy/proxyV1.json';
import Web3 from 'web3';
import { createVoucher, generateData } from '../utils/voucherCreater';
import { getApproversForDao } from '../utils/internalFunctions';

class Rep3 {
  signer!: any;
  signerAddress!: string;
  config!: IConfig;
  ContractAbi!: IContractAbi;
  ContractAddress!: IContractAddress;
  chainId: number;
  Instance!: IContract;
  contractInfo!: IContractFactory;
  ProxyContractInstance!: any;
  biconomyInstance: any;
  networkWeb3: typeof Web3.givenProvider | undefined;
  walletWeb3: typeof Web3.givenProvider;
  packageInitialised: boolean;

  constructor(
    getSigner: any,
    walletProvider: typeof Web3.givenProvider,
    chainId: number,
    contractAddressConfig: IContractAddress | any,
    config: IConfig | undefined
  ) {
    this.signer = getSigner;
    this.walletWeb3 = new Web3(walletProvider);
    this.chainId = chainId;
    this.ContractAddress = contractAddressConfig;
    this.packageInitialised = false;
    if (config) {
      this.config = config;
      this.biconomyInstance = new this.config.biconomyInstance(
        new Web3.providers.HttpProvider(this.config.relayURL),
        {
          walletProvider,
          apiKey: this.config.apiKey,
          debug: true,
        }
      );
      this.networkWeb3 = new Web3(this.biconomyInstance);
    }
  }

  /*
   * Checks the chain id from the signer
   * @returns contract instances for forwarder and pocp
   * @throws error if not deployed in specified class initiated chain Id
   */

  createInstance = async () => {
    this.contractInfo = new ContractFactory(this.chainId);
    this.ContractAbi = this.contractInfo.getAbi();
    this.signerAddress = await this.signer.getAddress();

    if (this.config) {
      this.biconomyInstance
        .onEvent(this.biconomyInstance.READY, async () => {
          this.Instance = {
            manager: new this.networkWeb3.eth.Contract(
              this.ContractAbi?.manager,
              this.ContractAddress?.manager
            ),
            beacon: undefined,
          };
          this.packageInitialised = true;
          console.log(
            'Biconomy Initialized successfully!!!!',
            this.packageInitialised
          );
        })
        .onEvent(this.biconomyInstance.ERROR, (error: any, message: any) => {
          throw {
            error,
            message,
          };
        });

      return Rep3;
    } else {
      this.Instance = {
        manager: new this.walletWeb3.eth.Contract(
          this.ContractAbi?.manager,
          this.ContractAddress?.manager
        ),
        beacon: undefined,
      };

      return Rep3;
    }
  };

  /*
   * @param dao name in string
   * @param dao symbol in string
   * @param approver address in array
   * @returns The transaction receipt is contract call success
   * @throws "Contract call fails"
   * @throws "Metamask errors"
   * @throws "Relayer Api Call errors"
   */

  daoDeploy = async (
    daoName: string,
    daoSymbol: string,
    approverAddresses: [string],
    transactionHashCallback: Function,
    callbackFunction?: Function
  ) => {
    //performs relay function if config file is set

    if (this.config) {
      const domainType = [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'verifyingContract', type: 'address' },
        { name: 'salt', type: 'bytes32' },
      ];
      const metaTransactionType = [
        { name: 'nonce', type: 'uint256' },
        { name: 'from', type: 'address' },
        { name: 'functionSignature', type: 'bytes' },
      ];
      let domainData = {
        name: 'Manager',
        version: '1',
        verifyingContract: this.ContractAddress.manager,
        salt: '0x' + this.chainId.toString(16).padStart(64, '0'),
      };

      const nonce: any = await this.Instance?.manager?.methods
        .getNonce(this.signerAddress)
        .call();

      let functionSignature = this.Instance?.manager?.methods
        .deployREP3TokenProxy(
          daoName,
          daoSymbol,
          approverAddresses,
          this.ContractAddress.beacon,
          this.ContractAddress.router
        )
        .encodeABI();

      let message: any = {};
      message.nonce = parseInt(nonce);
      message.from = this.signerAddress;
      message.functionSignature = functionSignature;

      const dataToSign = JSON.stringify({
        types: {
          EIP712Domain: domainType,
          MetaTransaction: metaTransactionType,
        },
        domain: domainData,
        primaryType: 'MetaTransaction',
        message: message,
      });

      await this.walletWeb3.currentProvider.sendAsync(
        {
          jsonrpc: '2.0',
          id: 999999999999,
          method: 'eth_signTypedData_v3',
          params: [this.signerAddress, dataToSign],
        },
        async (err: any, result: any) => {
          if (err) {
            console.log('error caught then catch', err);
            throw err;
          }
          if (result && !result.result) {
            const signature = result.substring(2);
            const r = '0x' + signature.substring(0, 64);
            const s = '0x' + signature.substring(64, 128);
            const v = parseInt(signature.substring(128, 130), 16);
            console.log(
              'sig',
              result,
              'r',
              r,
              's',
              s,
              'v',
              v,
              'funcSig',
              functionSignature
            );
            const promiEvent: any = this.Instance?.manager?.methods
              .executeMetaTransaction(
                this.signerAddress,
                functionSignature,
                r,
                s,
                v
              )
              .send({
                from: this.signerAddress,
              });
            promiEvent
              .on('transactionHash', async (hash: any) => {
                try {
                  await transactionHashCallback(hash);
                } catch (error) {
                  throw error;
                }
              })
              .once(
                'confirmation',
                async (_confirmationNumber: any, receipt: any) => {
                  try {
                    if (receipt.status) {
                      console.log('Transaction processed successfully');
                      if (callbackFunction) {
                        try {
                          await callbackFunction(receipt);
                        } catch (error) {
                          throw error;
                        }
                      }
                    } else {
                      throw 'Transaction failed';
                    }
                  } catch (error) {
                    throw error;
                  }
                }
              );
          } else if (result && result.result) {
            const signature = result.result.substring(2);
            const r = '0x' + signature.substring(0, 64);
            const s = '0x' + signature.substring(64, 128);
            const v = parseInt(signature.substring(128, 130), 16);
            console.log(
              'sig',
              result,
              'r',
              r,
              's',
              s,
              'v',
              v,
              'funcSig',
              functionSignature
            );
            const promiEvent: any = this.Instance?.manager?.methods
              .executeMetaTransaction(
                this.signerAddress,
                functionSignature,
                r,
                s,
                v
              )
              .send({
                from: this.signerAddress,
              });
            promiEvent
              .on('transactionHash', async (hash: any) => {
                try {
                  await transactionHashCallback(hash);
                } catch (error) {
                  throw error;
                }
              })
              .once(
                'confirmation',
                async (_confirmationNumber: any, receipt: any) => {
                  try {
                    if (receipt.status) {
                      console.log('Transaction processed successfully');
                      if (callbackFunction) {
                        try {
                          await callbackFunction(receipt);
                        } catch (error) {
                          throw error;
                        }
                      }
                    } else {
                      throw 'Transaction failed';
                    }
                  } catch (error) {
                    throw error;
                  }
                }
              );
          } else {
            throw 'Could not get user signature. Check console for error';
          }
        }
      );
    } else {
      //performs direct contract call if no config file is set
    }
  };

  /*
   * @param dao's contract address in string
   * @param dao's membershipNFT object of type
   * @param approver address in array
   * @returns The transaction receipt is contract call success
   * @throws "Contract call fails"
   * @throws "Metamask errors"
   * @throws "Relayer Api Call errors"
   */
  createMembershipVoucher = async (
    proxyAddress: string,
    levels: [number],
    categories: [number],
    end: [number],
    to: [string],
    tokenUris: string,
    signType: string
  ) => {
    console.log('Address', to);
    const domain = {
      name: 'REP3Signer',
      version: '0.0.1',
      verifyingContract: proxyAddress, //contract address
      salt: '0x' + this.chainId.toString(16).padStart(64, '0'), //For mainnet replace 80001 with 137
    };
    // types is the types
    const typesV2 = {
      NFTVoucher: [
        { name: 'data', type: 'uint256[]' },
        { name: 'end', type: 'uint8[]' },
        { name: 'to', type: 'address[]' },
        { name: 'tokenUris', type: 'string' },
      ],
    };
    const typesV1 = {
      NFTVoucher: [
        { name: 'levelCategory', type: 'uint16[]' },
        { name: 'end', type: 'uint8[]' },
        { name: 'to', type: 'address[]' },
        { name: 'tokenUris', type: 'string' },
      ],
    };

    try {
      const voucher = createVoucher(
        levels,
        categories,
        end,
        to,
        tokenUris,
        signType
      );
      const signature = await this.signer._signTypedData(
        domain,
        signType === 'signTypedDatav2.0' ? typesV2 : typesV1,
        voucher
      );
      const obj = {
        ...voucher,
        signature,
      };
      return obj;
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  };

  /*
   * @param dao's contract address in string
   * @param claimer's membershipNFT voucher
   * @param approver address index in number
   * @returns The transaction receipt is contract call success
   * @throws "Contract call fails"
   * @throws "Metamask errors"
   * @throws "Relayer Api Call errors"
   */
  claimMembershipNft = async (
    contractAddress: string,
    voucher: IMembershipVoucherV1 | IMembershipVoucherV2,
    approvedAddressIndex: number,
    signType: string,
    gas: number,
    gasLimit: number,
    transactionHashCallback: Function,
    callbackFunction?: Function
  ) => {
    if (this.config) {
      let contract = new this.networkWeb3.eth.Contract(
        this.ContractAbi.router,
        this.ContractAddress.router
      );
      let userAddress = this.signerAddress;
      const proxyContract = new this.walletWeb3.eth.Contract(
        signType === 'signTypedDatav2.0'
          ? this.ContractAbi.proxy
          : ProxyV1,
        contractAddress
      );
      try {
        let tx = contract.methods
          .routeRequest({
            to: contractAddress,
            gas,
            value: 0,
            data: proxyContract.methods
              .claimMembership(voucher, approvedAddressIndex)
              .encodeABI(),
          })
          .send({
            from: userAddress,
            signatureType: this.biconomyInstance.EIP712_SIGN,
            gasLimit,
          });
        tx.on('transactionHash', async function(hash: any) {
          try {
            await transactionHashCallback(hash);
          } catch (error) {
            throw error;
          }
        }).once(
          'confirmation',
          async (confirmationNumber: any, receipt: any) => {
            console.log(receipt);
            console.log(receipt.transactionHash, confirmationNumber);
            if (callbackFunction) {
              try {
                await callbackFunction(receipt);
              } catch (error) {
                throw error;
              }
            }
          }
        );
      } catch (error) {
        console.log('Catched Error', error);
      }
    } else {
      //performs direct contract call if no config file is set
    }
  };

  /*
   * @param dao's contract address in string
   * @param  membershipNFT tokenId in number
   * @param level in number
   * @param category in number
   * @param metadataHash in string
   * @returns The transaction receipt is contract call success
   * @throws "Contract call fails"
   * @throws "Metamask errors"
   * @throws "Relayer Api Call errors"
   */
  upgradeMembershipNft = async (
    contractAddress: string,
    tokenId: number,
    level: number,
    category: number,
    metaDataHash: string,
    gas: number,
    gasLimit: number,
    transactionHashCallback: Function,
    callbackFunction?: Function
  ) => {
    if (this.config) {
      let contract = new this.networkWeb3.eth.Contract(
        this.ContractAbi.router,
        this.ContractAddress.router
      );

      let userAddress = this.signerAddress;

      const proxyContract = new this.walletWeb3.eth.Contract(
        this.ContractAbi.proxy,
        contractAddress
      );

      const data = generateData([level], [category])[0];
      try {
        let tx = contract.methods
          .routeRequest({
            to: contractAddress,
            gas,
            value: 0,
            data: proxyContract.methods
              .updateMembership(tokenId, data, metaDataHash)
              .encodeABI(),
          })
          .send({
            from: userAddress,
            signatureType: this.biconomyInstance.EIP712_SIGN,
            gasLimit,
          });
        tx.on('transactionHash', async function(hash: any) {
          try {
            console.log(`Transaction hash is ${hash}`);
            await transactionHashCallback(hash);
          } catch (error) {
            throw error;
          }
        }).once(
          'confirmation',
          async (confirmationNumber: any, receipt: any) => {
            console.log(receipt);
            console.log(receipt.transactionHash, confirmationNumber);
            if (callbackFunction) {
              console.log('hash tx....', receipt);
              try {
                await callbackFunction(receipt);
              } catch (error) {
                throw error;
              }
            }
          }
        );
      } catch (error) {
        console.log('Catched Error', error);
      }
    }
  };

  createBadgeVoucher = async (
    proxyAddress: string,
    arrayOfMemberTokenId: [string],
    arrayofBadgeType: [number],
    arrayOfTokenUri: [string],
    arrayOfNounce: [string],
    arrayOfData: [number]
  ) => {
    try {
      const domain = {
        name: 'REP3Signer',
        version: '0.0.1',
        verifyingContract: proxyAddress, //contract address
        salt: '0x' + this.chainId.toString(16).padStart(64, '0'), //For mainnet replace 80001 with 137
      };

      const types = {
        BadgeVoucher: [
          { name: 'index', type: 'uint32' },
          { name: 'memberTokenIds', type: 'uint256[]' },
          { name: 'type_', type: 'uint8[]' },
          { name: 'tokenUri', type: 'string' },
          { name: 'data', type: 'uint256[]' },
          { name: 'nonces', type: 'uint32[]' },
        ],
      };

      const badgeVoucher = {
        index: 0,
        memberTokenIds: arrayOfMemberTokenId,
        type_: arrayofBadgeType,
        tokenUri: `${arrayOfTokenUri.toString()},`,
        data: arrayOfData,
        nonces: arrayOfNounce,
      };

      const signature = await this.signer._signTypedData(
        domain,
        types,
        badgeVoucher
      );
      return {
        ...badgeVoucher,
        signature,
      };
    } catch (error) {
      console.log('error', error);
      throw error;
    }
  };

  claimContributionBadges = async (
    contractAddress: string,
    voucher: any,
    memberTokenId: number,
    approveIndex: [number],
    gas: number,
    gasLimit: number,
    transactionHashCallback: Function,
    callbackFunction?: Function
  ) => {
    if (this.config) {
      let contract = new this.networkWeb3.eth.Contract(
        this.ContractAbi.router,
        this.ContractAddress.router
      );

      let userAddress = this.signerAddress;

      const proxyContract = new this.walletWeb3.eth.Contract(
        this.ContractAbi.proxy,
        contractAddress
      );

      try {
        let tx = contract.methods
          .routeRequest({
            to: contractAddress,
            gas,
            value: 0,
            data: proxyContract.methods
              .claimBadge(voucher, memberTokenId, approveIndex)
              .encodeABI(),
          })
          .send({
            from: userAddress,
            signatureType: this.biconomyInstance.EIP712_SIGN,
            gasLimit,
          });
        tx.on('transactionHash', async function(hash: any) {
          try {
            console.log(`Transaction hash is ${hash}`);
            await transactionHashCallback(hash);
          } catch (error) {
            throw error;
          }
        }).once(
          'confirmation',
          async (confirmationNumber: any, receipt: any) => {
            console.log(receipt.transactionHash, confirmationNumber);
            if (callbackFunction) {
              console.log('hash tx....', receipt);
              try {
                await callbackFunction(receipt);
              } catch (error) {
                throw error;
              }
            }
          }
        );
      } catch (error) {
        console.log('Catched Error', error);
      }
    } else {
      //performs direct contract call if no config file is set
      // try {
      //   this.ProxyContractInstance = new this.walletWeb3.eth.Contract(
      //     this.ContractAbi?.pocpProxy,
      //     contractAddress
      //   );
      //   const res = await (
      //     await this.ProxyContractInstance?.claimMembership(
      //       voucher,
      //       approvedAddressIndex
      //     )
      //   ).wait();
      //   if (callbackFunction) {
      //     try {
      //       await eventListener(
      //         this.PocpInstance.pocpManager,
      //         EventsEnum.MembershipClaimed,
      //         callbackFunction,
      //         res.transactionHash
      //       );
      //     } catch (error) {
      //       throw error;
      //     }
      //   }
      //   return res;
      // } catch (error) {
      //   throw error;
      // }
    }
  };

  updateApprovers = async (
    approverAddresses: [string],
    contractAddress: string,
    subgraphUrl: string,
    gas: number,
    gasLimit: number,
    transactionHashCallback: Function,
    callbackFunction?: Function
  ) => {
    if (this.config) {
      let contract = new this.networkWeb3.eth.Contract(
        this.ContractAbi.router,
        this.ContractAddress.router
      );

      let userAddress = this.signerAddress;

      const proxyContract = new this.walletWeb3.eth.Contract(
        this.ContractAbi.proxy,
        contractAddress
      );

      try {
        let currentApprovers: [string] = await getApproversForDao(
          contractAddress,
          subgraphUrl
        );

        const approverAddressesInLowercase = approverAddresses.map(ele =>
          ele.toLowerCase()
        );

        const removedApprovers = currentApprovers.filter(
          ele => !approverAddressesInLowercase.includes(ele.toLowerCase())
        );
        const newlyAddedApprovers = approverAddressesInLowercase.filter(
          ele => !currentApprovers.includes(ele.toLowerCase())
        );
        console.log(
          'removed approvers and added approvers',
          removedApprovers,
          newlyAddedApprovers
        );
        let tx = contract.methods
          .routeRequest({
            to: contractAddress,
            gas,
            value: 0,
            data: proxyContract.methods
              .changeApprover(newlyAddedApprovers, removedApprovers)
              .encodeABI(),
          })
          .send({
            from: userAddress,
            signatureType: this.biconomyInstance.EIP712_SIGN,
            gasLimit,
          });
        tx.on('transactionHash', async function(hash: any) {
          try {
            console.log(`Transaction hash is ${hash}`);
            await transactionHashCallback(hash);
          } catch (error) {
            throw error;
          }
        }).once(
          'confirmation',
          async (confirmationNumber: any, receipt: any) => {
            console.log(receipt.transactionHash, confirmationNumber);
            if (callbackFunction) {
              console.log('receipt tx....', receipt);
              try {
                await callbackFunction(receipt);
              } catch (error) {
                throw error;
              }
            }
          }
        );
      } catch (error) {
        console.log('Catched Error', error);
      }
    }
  };

  /*
   * @param dao's contract address in string
   * @param claimer's membershipNFT voucher
   * @param approver address index in number
   * @returns The transaction receipt is contract call success
   * @throws "Contract call fails"
   * @throws "Metamask errors"
   * @throws "Relayer Api Call errors"
   */
  directIssueBadgeBatch = async (
    contractAddress: string,
    memberTokenIds: [number],
    type_: [number],
    data: [number],
    arrayOfTokenUri: [string],
    signType: string,
    gas: number,
    gasLimit: number,
    transactionHashCallback: Function,
    callbackFunction?: Function
  ) => {
    if (this.config) {
      let contract = new this.networkWeb3.eth.Contract(
        this.ContractAbi.router,
        this.ContractAddress.router
      );
      let userAddress = this.signerAddress;
      const proxyContract = new this.walletWeb3.eth.Contract(
        signType === 'signTypedDatav2.0'
          ? this.ContractAbi.proxy
          : ProxyV1,
        contractAddress
      );
      try {
        let tx = contract.methods
          .routeRequest({
            to: contractAddress,
            gas,
            value: 0,
            data: proxyContract.methods
              .batchIssueBadge(
                memberTokenIds,
                type_,
                data,
                `${arrayOfTokenUri.toString()},`
              )
              .encodeABI(),
          })
          .send({
            from: userAddress,
            signatureType: this.biconomyInstance.EIP712_SIGN,
            gasLimit,
          });
        tx.on('transactionHash', async function(hash: any) {
          try {
            await transactionHashCallback(hash);
          } catch (error) {
            throw error;
          }
        }).once(
          'confirmation',
          async (confirmationNumber: any, receipt: any) => {
            console.log(receipt);
            console.log(receipt.transactionHash, confirmationNumber);
            if (callbackFunction) {
              try {
                await callbackFunction(receipt);
              } catch (error) {
                throw error;
              }
            }
          }
        );
      } catch (error) {
        console.log('Catched Error', error);
      }
    } else {
      //performs direct contract call if no config file is set
      const proxyContract = new this.walletWeb3.eth.Contract(
        signType === 'signTypedDatav2.0'
          ? this.ContractAbi.proxy
          : ProxyV1,
        contractAddress
      );
      proxyContract.methods
        .batchIssueBadge(
          memberTokenIds,
          type_,
          data,
          `${arrayOfTokenUri.toString()},`
        )
        .send({
          from: this.signerAddress,
        })
        .on('receipt', async (receipt: any) => {
          try {
            await transactionHashCallback(receipt);
          } catch (error) {
            throw error;
          }
        })
        .on('error', function(err: any) {
          console.error('-------err-------', new Error(err).message);
          throw err;
        });
    }
  };
}

export default Rep3;
