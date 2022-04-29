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
} from '../types';

class Pocp {
  signer!: ethers.Signer;
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
   * @param data name in string
   * @param array of approvers wallet address
   * @returns The transaction receipt is contract call success
   * @throws "Contract call fails"
   * @throws "Metamask errors"
   */

  registerDaoToPocp = async (
    daoName: string,
    approverAddresses: [string]
  ): Promise<RegisterDaoResponse | string | unknown> => {
    try {
      const res = await (
        await this.PocpInstance.pocp?.register(daoName, approverAddresses)
      ).wait();
      return res;
    } catch (error) {
      throw error;
    }
  };
}

export default Pocp;
