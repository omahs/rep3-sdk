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
    }

    //polygon network config
    else if (this.chainId === networks_ENUM.POLYGON) {
      this.PocpInstance = {
        pocp: undefined,
        forwarder: undefined,
      };
    } else {
      this.PocpInstance = {
        pocp: undefined,
        forwarder: undefined,
      };
    }
    return Pocp;
  };

  registerDaoToPocp = async (): Promise<RegisterDaoResponse | string> => {
    if (this.config.relayer_token) {
      // relayer approach
    } else {
      //contract call
    }
    return 'yo';
  };
}

export default Pocp;
