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

import { ethers } from 'ethers';
import { createVoucher, generateData } from '../utils/voucherCreater';
import { getApproversForDao } from '../utils/internalFunctions';
import { getSignatureParameters } from '../utils/signHelper';

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
  networkWeb3: any;
  walletWeb3: any;
  packageInitialised: boolean;

  constructor(
    getSigner: any,
    walletProvider: any,
    chainId: number,
    contractAddressConfig: IContractAddress | any,
    config: IConfig | undefined
  ) {
    this.signer = getSigner;
    this.walletWeb3 = new ethers.providers.Web3Provider(walletProvider);
    this.chainId = chainId;
    this.ContractAddress = contractAddressConfig;
    this.packageInitialised = false;
    if (config) {
      this.config = config;

      this.biconomyInstance = new this.config.biconomyInstance(
        new ethers.providers.JsonRpcProvider(this.config.relayURL),
        {
          walletProvider,
          apiKey: this.config.apiKey,
          debug: true,
          contractAddresses: [this.ContractAddress.router],
        }
      );
      this.networkWeb3 = new ethers.providers.Web3Provider(
        this.biconomyInstance
      );
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
            manager: new ethers.Contract(
              this.ContractAddress.manager,
              this.ContractAbi.manager,
              this.biconomyInstance.getSignerByAddress(this.signerAddress)
            ),
            beacon: undefined,
          };
          this.packageInitialised = true;
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

  deploy = async (
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

      console.log('manager', this.Instance.manager, this.ContractAbi.manager);
      let contractInterface = new ethers.utils.Interface(
        this.ContractAbi.manager
      );
      let functionSignature = contractInterface.encodeFunctionData(
        'deployREP3TokenProxy',
        [
          daoName,
          daoSymbol,
          approverAddresses,
          this.ContractAddress.beacon,
          this.ContractAddress.router,
        ]
      );
      let nonce = await this.Instance.manager.getNonce(this.signerAddress);

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

      console.log('data to sign', dataToSign);

      let signature = await this.walletWeb3.send('eth_signTypedData_v3', [
        this.signerAddress,
        dataToSign,
      ]);
      let { r, s, v } = getSignatureParameters(signature);
      let tx = await this.Instance.manager.executeMetaTransaction(
        this.signerAddress,
        functionSignature,
        r,
        s,
        v
      );

      console.log('Transaction hash : ', tx);
      if (transactionHashCallback) {
        try {
          await transactionHashCallback(tx);
        } catch (error) {
          throw error;
        }
      }

      const confirmation = await tx.wait();
      console.log('Confirmed hash : ', confirmation);
      if (callbackFunction) {
        try {
          await callbackFunction(confirmation);
        } catch (error) {
          throw error;
        }
      }
    } else {
      //performs direct contract call if no config file is set
      const tx = await this.Instance.manager.deployREP3TokenProxy(
        daoName,
        daoSymbol,
        approverAddresses,
        this.ContractAddress.beacon,
        this.ContractAddress.router
      );
      const res = await tx.wait();
      return res;
    }
  };

  _generateEnd = (to: [string]): number[] => {
    let endArray: number[] = [];
    to.forEach((_, i) => {
      if (i + 1 < to.length) {
        endArray.push(i + 1);
      }
    });
    return endArray;
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
    to: [string],
    tokenUris: string,
    signType: string = 'signTypedDatav2.0'
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
    let end: number[] = this._generateEnd(to);

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
  claimMembership = async (
    contractAddress: string,
    voucher: IMembershipVoucherV1 | IMembershipVoucherV2,
    approvedAddressIndex: number,
    signType: string = 'signTypedDatav2.0',
    gas: number,
    gasLimit: number,
    transactionHashCallback: Function,
    callbackFunction?: Function
  ) => {
    if (this.config) {
      let contract = new ethers.Contract(
        this.ContractAddress.router,
        this.ContractAbi.router,
        this.biconomyInstance.getSignerByAddress(this.signerAddress)
      );

      let proxyInterface = new ethers.utils.Interface(
        signType === 'signTypedDatav2.0' ? this.ContractAbi.proxy : ProxyV1
      );
      let functionSignature = proxyInterface.encodeFunctionData(
        'claimMembership',
        [voucher, approvedAddressIndex]
      );
      let userAddress = this.signerAddress;

      let { data } = await contract.populateTransaction.routeRequest({
        to: contractAddress,
        gas,
        value: 0,
        data: functionSignature,
      });
      let provider = this.biconomyInstance.getEthersProvider();

      let gasLimits = await provider.estimateGas({
        to: this.ContractAddress.router,
        from: userAddress,
        data: data,
      });
      console.log('Gas limit : ', gasLimit);

      let txParams = {
        data: data,
        to: this.ContractAddress.router,
        from: userAddress,
        gasLimit: gasLimits, // optional
        signatureType: 'EIP712_SIGN',
      };

      let tx = await provider.send('eth_sendTransaction', [txParams]);
      console.log('Transaction hash : ', gasLimit, tx);
      if (transactionHashCallback) {
        try {
          await transactionHashCallback(tx);
        } catch (error) {
          throw error;
        }
      }

      provider.once(tx, async (transaction: any) => {
        console.log('TX HASH', transaction);
        if (callbackFunction) {
          try {
            await callbackFunction(transaction);
          } catch (error) {
            throw error;
          }
        }
      });
    } else {
      //performs direct contract call if no config file is set
      let contract = new ethers.Contract(
        this.ContractAddress.router,
        this.ContractAbi.router,
        this.signer
      );

      let proxyInterface = new ethers.utils.Interface(
        signType === 'signTypedDatav2.0' ? this.ContractAbi.proxy : ProxyV1
      );
      let functionSignature = proxyInterface.encodeFunctionData(
        'claimMembership',
        [voucher, approvedAddressIndex]
      );
      const res = await contract.routeRequest({
        to: contractAddress,
        gas,
        value: 0,
        data: functionSignature,
      });
      const tx = res.wait();
      return tx;
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
  upgradeMembership = async (
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
      let contract = new ethers.Contract(
        this.ContractAddress.router,
        this.ContractAbi.router,
        this.biconomyInstance.getSignerByAddress(this.signerAddress)
      );
      const datas = generateData([level], [category])[0];
      let proxyInterface = new ethers.utils.Interface(this.ContractAbi.proxy);
      let functionSignature = proxyInterface.encodeFunctionData(
        'updateMembership',
        [tokenId, datas, metaDataHash]
      );
      let userAddress = this.signerAddress;

      let { data } = await contract.populateTransaction.routeRequest({
        to: contractAddress,
        gas,
        value: 0,
        data: functionSignature,
      });
      let provider = this.biconomyInstance.getEthersProvider();

      let gasLimits = await provider.estimateGas({
        to: this.ContractAddress.router,
        from: userAddress,
        data: data,
      });
      console.log('Gas limit : ', gasLimit);

      let txParams = {
        data: data,
        to: this.ContractAddress.router,
        from: userAddress,
        gasLimit: gasLimits, // optional
        signatureType: 'EIP712_SIGN',
      };

      let tx = await provider.send('eth_sendTransaction', [txParams]);
      console.log('Transaction hash : ', gasLimit, tx);
      if (transactionHashCallback) {
        try {
          await transactionHashCallback(tx);
        } catch (error) {
          throw error;
        }
      }

      provider.once(tx, async (transaction: any) => {
        console.log('TX HASH', transaction);
        if (callbackFunction) {
          try {
            await callbackFunction(transaction);
          } catch (error) {
            throw error;
          }
        }
      });
    } else {
      //performs direct contract call if no config file is set
      let contract = new ethers.Contract(
        this.ContractAddress.router,
        this.ContractAbi.router,
        this.signer
      );
      const datas = generateData([level], [category])[0];
      let proxyInterface = new ethers.utils.Interface(this.ContractAbi.proxy);
      let functionSignature = proxyInterface.encodeFunctionData(
        'updateMembership',
        [tokenId, datas, metaDataHash]
      );
      const res = await contract.routeRequest({
        to: contractAddress,
        gas,
        value: 0,
        data: functionSignature,
      });
      const tx = res.wait();
      return tx;
    }
  };

  createAssociationBadgeVoucher = async (
    proxyAddress: string,
    memberTokenIds: [string],
    badgeTypes: [number],
    tokenUri: [string],
    nonces: [string],
    data: [number]
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
        memberTokenIds: memberTokenIds,
        type_: badgeTypes,
        tokenUri: `${tokenUri.toString()},`,
        data: data,
        nonces: nonces,
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

  claimAssociationBadges = async (
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
      let contract = new ethers.Contract(
        this.ContractAddress.router,
        this.ContractAbi.router,
        this.biconomyInstance.getSignerByAddress(this.signerAddress)
      );

      let proxyInterface = new ethers.utils.Interface(this.ContractAbi.proxy);
      let functionSignature = proxyInterface.encodeFunctionData('claimBadge', [
        voucher,
        memberTokenId,
        approveIndex,
      ]);
      let userAddress = this.signerAddress;

      let { data } = await contract.populateTransaction.routeRequest({
        to: contractAddress,
        gas,
        value: 0,
        data: functionSignature,
      });
      let provider = this.biconomyInstance.getEthersProvider();

      let gasLimits = await provider.estimateGas({
        to: this.ContractAddress.router,
        from: userAddress,
        data: data,
      });
      console.log('Gas limit : ', gasLimit);

      let txParams = {
        data: data,
        to: this.ContractAddress.router,
        from: userAddress,
        gasLimit: gasLimits, // optional
        signatureType: 'EIP712_SIGN',
      };

      let tx = await provider.send('eth_sendTransaction', [txParams]);
      console.log('Transaction hash : ', gasLimit, tx);
      if (transactionHashCallback) {
        try {
          await transactionHashCallback(tx);
        } catch (error) {
          throw error;
        }
      }

      provider.once(tx, async (transaction: any) => {
        console.log('TX HASH', transaction);
        if (callbackFunction) {
          try {
            await callbackFunction(transaction);
          } catch (error) {
            throw error;
          }
        }
      });
    } else {
      let contract = new ethers.Contract(
        this.ContractAddress.router,
        this.ContractAbi.router,
        this.signer
      );

      let proxyInterface = new ethers.utils.Interface(this.ContractAbi.proxy);
      let functionSignature = proxyInterface.encodeFunctionData('claimBadge', [
        voucher,
        memberTokenId,
        approveIndex,
      ]);
      const res = await contract.routeRequest({
        to: contractAddress,
        gas,
        value: 0,
        data: functionSignature,
      });
      const tx = res.wait();
      return tx;
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
      let contract = new ethers.Contract(
        this.ContractAddress.router,
        this.ContractAbi.router,
        this.biconomyInstance.getSignerByAddress(this.signerAddress)
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
        let proxyInterface = new ethers.utils.Interface(this.ContractAbi.proxy);
        let functionSignature = proxyInterface.encodeFunctionData(
          'changeApprover',
          [newlyAddedApprovers, removedApprovers]
        );
        let userAddress = this.signerAddress;

        let { data } = await contract.populateTransaction.routeRequest({
          to: contractAddress,
          gas,
          value: 0,
          data: functionSignature,
        });
        let provider = this.biconomyInstance.getEthersProvider();

        let gasLimits = await provider.estimateGas({
          to: this.ContractAddress.router,
          from: userAddress,
          data: data,
        });
        console.log('Gas limit : ', gasLimit);

        let txParams = {
          data: data,
          to: this.ContractAddress.router,
          from: userAddress,
          gasLimit: gasLimits, // optional
          signatureType: 'EIP712_SIGN',
        };

        let tx = await provider.send('eth_sendTransaction', [txParams]);
        console.log('Transaction hash : ', gasLimit, tx);
        if (transactionHashCallback) {
          try {
            await transactionHashCallback(tx);
          } catch (error) {
            throw error;
          }
        }

        provider.once(tx, async (transaction: any) => {
          console.log('TX HASH', transaction);
          if (callbackFunction) {
            try {
              await callbackFunction(transaction);
            } catch (error) {
              throw error;
            }
          }
        });
      } catch (error) {
        throw error;
      }
    } else {
      let contract = new ethers.Contract(
        this.ContractAddress.router,
        this.ContractAbi.router,
        this.signer
      );

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
      let proxyInterface = new ethers.utils.Interface(this.ContractAbi.proxy);
      let functionSignature = proxyInterface.encodeFunctionData(
        'changeApprover',
        [newlyAddedApprovers, removedApprovers]
      );
      const res = await contract.routeRequest({
        to: contractAddress,
        gas,
        value: 0,
        data: functionSignature,
      });
      const tx = res.wait();
      return tx;
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
    datas: [number],
    arrayOfTokenUri: [string],
    // signType: string,
    gas: number,
    gasLimit: number,
    transactionHashCallback: Function,
    callbackFunction?: Function
  ) => {
    if (this.config) {
      let contract = new ethers.Contract(
        this.ContractAddress.router,
        this.ContractAbi.router,
        this.biconomyInstance.getSignerByAddress(this.signerAddress)
      );
      try {
        let proxyInterface = new ethers.utils.Interface(this.ContractAbi.proxy);
        let functionSignature = proxyInterface.encodeFunctionData(
          '.batchIssueBadge',
          [memberTokenIds, type_, datas, `${arrayOfTokenUri.toString()},`]
        );
        let userAddress = this.signerAddress;

        let { data } = await contract.populateTransaction.routeRequest({
          to: contractAddress,
          gas,
          value: 0,
          data: functionSignature,
        });
        let provider = this.biconomyInstance.getEthersProvider();

        let gasLimits = await provider.estimateGas({
          to: this.ContractAddress.router,
          from: userAddress,
          data: data,
        });
        console.log('Gas limit : ', gasLimit);

        let txParams = {
          data: data,
          to: this.ContractAddress.router,
          from: userAddress,
          gasLimit: gasLimits, // optional
          signatureType: 'EIP712_SIGN',
        };

        let tx = await provider.send('eth_sendTransaction', [txParams]);
        console.log('Transaction hash : ', gasLimit, tx);
        if (transactionHashCallback) {
          try {
            await transactionHashCallback(tx);
          } catch (error) {
            throw error;
          }
        }

        provider.once(tx, async (transaction: any) => {
          console.log('TX HASH', transaction);
          if (callbackFunction) {
            try {
              await callbackFunction(transaction);
            } catch (error) {
              throw error;
            }
          }
        });
      } catch (error) {
        throw error;
      }
    }
  };
}

export default Rep3;
