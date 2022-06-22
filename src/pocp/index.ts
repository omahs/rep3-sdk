import ContractFactory from '../contracts';
import {
  IContract,
  IContractAbi,
  IContractAddress,
  IContractFactory,
  IPocpConfig,
} from '../types';

import { eventListener, EventsEnum } from '../utils/eventListeners';
import Web3 from 'web3';
import { createVoucher } from '../utils/voucherCreater';

class Pocp {
  signer!: any;
  provider!: any;
  signerAddress!: string;
  config!: IPocpConfig;
  ContractAbi!: IContractAbi;
  ContractAddress!: IContractAddress;
  chainId: any;
  PocpInstance!: IContract;
  contractInfo!: IContractFactory;
  ProxyContractInstance!: any;
  biconomyInstance: any;
  networkWeb3: any;
  walletWeb3: any;

  constructor(
    getSigner: any,
    getProvider: any,
    walletProvider: any,
    chainId: any,
    config: IPocpConfig | undefined
  ) {
    this.signer = getSigner;
    this.provider = getProvider;
    this.walletWeb3 = new Web3(walletProvider);
    this.chainId = chainId;
    if (config) {
      this.config = config;
      this.biconomyInstance = new this.config.biconomyInstance(
        new Web3.providers.HttpProvider('https://rpc-mumbai.maticvigil.com'),
        {
          walletProvider,
          apiKey: 'h3GRiJo5V.ea5e72c1-a3dd-44cf-824e-1bd77a681ff7',
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
    // this.chainId = await this.signer.getChainId();
    this.contractInfo = new ContractFactory(80001);
    this.ContractAbi = this.contractInfo.getAbi();
    this.ContractAddress = this.contractInfo.getAddress();
    this.signerAddress = await this.signer.getAddress();

    // Polygon Mumbai network config
    // if (this.chainId === networks_ENUM.MUMBAI) {
    if (this.config) {
      this.biconomyInstance
        .onEvent(this.biconomyInstance.READY, async () => {
          // Initialize your contracts here using biconomy's provider instance
          // Initialize dapp here like getting user accounts etc
          // Initializing manager contract

          this.PocpInstance = {
            pocpManager: new this.networkWeb3.eth.Contract(
              this.ContractAbi?.pocpManger,
              this.ContractAddress?.pocpManger
            ),
            pocpBeacon: undefined,
          };
        })
        .onEvent(this.biconomyInstance.ERROR, (error: any, message: any) => {
          throw {
            error,
            message,
          };
        });

      return Pocp;
    } else {
      this.PocpInstance = {
        pocpManager: new this.walletWeb3.eth.Contract(
          this.ContractAbi?.pocpManger,
          this.ContractAddress?.pocpManger
        ),
        pocpBeacon: undefined,
        // pocpBeacon: new this.walletWeb3.Contract(
        //   this.ContractAddress?.pocpBeacon,
        //   this.ContractAbi?.pocpBeacon,
        //   this.signer
        // ),
      };

      return Pocp;
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

  daoDeploy = async (
    daoName: string,
    daoSymbol: string,
    approverAddresses: [string],
    upgradeableBeacon: string,
    _trustedForwarder: string,
    callbackFunction?: Function
  ) => {
    //performs relay function if config file is set

    if (this.config) {
      console.log('config file setup');
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
      // replace the chainId 42 if network is not kovan
      let domainData = {
        name: 'Manager',
        version: '1',
        verifyingContract: this.ContractAddress.pocpManger,
        // converts Number to bytes32. Use your own chainId instead of 42 for other networks
        salt: '0x' + (80001).toString(16).padStart(64, '0'),
      };

      const nonce: any = await this.PocpInstance?.pocpManager?.methods
        .getNonce(this.signerAddress)
        .call();

      let functionSignature = this.PocpInstance?.pocpManager?.methods
        .deployREP3TokenProxy(
          daoName,
          daoSymbol,
          approverAddresses,
          upgradeableBeacon,
          _trustedForwarder
        )
        .encodeABI();

      let message: any = {};
      message.nonce = parseInt(nonce);
      message.from = this.signerAddress;
      message.functionSignature = functionSignature;
      // //copy from this point on
      const dataToSign = JSON.stringify({
        types: {
          EIP712Domain: domainType,
          MetaTransaction: metaTransactionType,
        },
        domain: domainData,
        primaryType: 'MetaTransaction',
        message: message,
      });

      this.walletWeb3.currentProvider.sendAsync(
        {
          jsonrpc: '2.0',
          id: 999999999999,
          method: 'eth_signTypedData_v4',
          params: [this.signerAddress, dataToSign],
        },
        async (err: any, result: any) => {
          if (err) {
            return console.error(err);
          }
          if (result && result.result) {
            const signature = result.result.substring(2);
            const r = '0x' + signature.substring(0, 64);
            const s = '0x' + signature.substring(64, 128);
            const v = parseInt(signature.substring(128, 130), 16);
            console.log(r, 'r');
            console.log(s, 's');
            console.log(v, 'v');

            const promiEvent: any = this.PocpInstance?.pocpManager?.methods
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
              // .on('transactionHash', (hash: any) => {})
              .once(
                'confirmation',
                async (_confirmationNumber: any, receipt: any) => {
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
                    console.log('Transaction failed');
                  }
                }
              );
          } else {
            console.log(
              'Could not get user signature. Check console for error'
            );
          }
        }
      );
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

  createMembershipVoucher = async (
    proxyAddress: string,
    levels: [number],
    categories: [number],
    end: [number],
    to: [string],
    tokenUris: string
  ) => {
    const domain = {
      name: 'REP3Signer',
      version: '0.0.1',
      verifyingContract: proxyAddress, //contract address
      salt: '0x' + (80001).toString(16).padStart(64, '0'), //For mainnet replace 80001 with 137
    };

    // types is the types
    const types = {
      NFTVoucher: [
        { name: 'levelCategory', type: 'uint16[]' },
        { name: 'end', type: 'uint8[]' },
        { name: 'to', type: 'address[]' },
        { name: 'tokenUris', type: 'string' },
      ],
    };
    const voucher = createVoucher(levels, categories, end, to, tokenUris);
    const signature = await this.signer._signTypedData(domain, types, voucher);
    console.log(
      JSON.stringify({
        ...voucher,
        signature,
      })
    );
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
      let contract = new this.networkWeb3.eth.Contract(
        this.ContractAbi.pocpRouter,
        this.ContractAddress.pocpRouter
      );

      let userAddress = this.signerAddress;

      const proxyContract = new this.walletWeb3.eth.Contract(
        this.ContractAbi.pocpProxy,
        contractAddress
      );

      // //Call your target method (must be registered on the dashboard).. here we are calling setQuote() method of our contract
      let tx = contract.methods
        .routeRequest({
          to: contractAddress,
          gas: 1e6,
          value: 0,
          data: proxyContract.methods
            .claimMembership(voucher, approvedAddressIndex)
            .encodeABI(),
        })
        .send({
          from: userAddress,
          signatureType: this.biconomyInstance.EIP712_SIGN,
          gasLimit: 1e6,
        });

      tx.on('transactionHash', function(hash: any) {
        console.log(`Transaction hash is ${hash}`);
      }).once('confirmation', async (confirmationNumber: any, receipt: any) => {
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
      });
    } else {
      //performs direct contract call if no config file is set
      try {
        this.ProxyContractInstance = new this.walletWeb3.eth.Contract(
          this.ContractAbi?.pocpProxy,
          contractAddress
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

  // issueBadge = async (
  //   contractAddress: string,
  //   memberTokenId: number,
  //   typeOfToken: number,
  //   data: string,
  //   tokenUri: string,
  //   callbackFunction?: Function
  // ) => {
  //   if (this.config) {
  //   } else {
  //     //performs direct contract call if no config file is set
  //     try {
  //       this.ProxyContractInstance = new ethers.Contract(
  //         contractAddress,
  //         this.ContractAbi?.pocpProxy,
  //         this.signer
  //       );
  //       const res = await (
  //         await this.ProxyContractInstance?.issueBadge(
  //           memberTokenId,
  //           typeOfToken,
  //           data,
  //           tokenUri
  //         )
  //       ).wait();
  //       if (callbackFunction) {
  //         try {
  //           await eventListener(
  //             this.PocpInstance.pocpManager,
  //             EventsEnum.MembershipClaimed,
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

  // soulTransfer = async (
  //   contractAddress: string,
  //   voucher: any
  //   // callbackFunction?: Function
  // ) => {
  //   if (this.config) {
  //   } else {
  //     //performs direct contract call if no config file is set
  //     try {
  //       this.ProxyContractInstance = new ethers.Contract(
  //         contractAddress,
  //         this.ContractAbi?.pocpProxy,
  //         this.signer
  //       );
  //       const res = await (
  //         await this.ProxyContractInstance?.soulTransfer(voucher)
  //       ).wait();
  //       return res;
  //     } catch (error) {
  //       throw error;
  //     }
  //   }
  // };
}

export default Pocp;
