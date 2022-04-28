import { networks_ENUM } from '../constants';
import ContractFactory from '../contracts';
import { ethers } from 'ethers';
import { IContractAbi, IContractAddress, IContractFactory } from '../types';

class Pocp {
  signer!: ethers.Signer;
  config: any;
  ContractAbi!: IContractAbi;
  ContractAddress!: IContractAddress;
  chainId: any;
  contractInfo!: IContractFactory;
  constructor(getSigner: any) {
    this.signer = getSigner;
  }

  createInstance = async () => {
    this.chainId = await this.signer.getChainId();
    this.contractInfo = new ContractFactory(this.chainId);
    this.ContractAbi = this.contractInfo.getAbi();
    this.ContractAddress = this.contractInfo.getAddress();

    //mumbai network config
    if (this.chainId === networks_ENUM.MUMBAI) {
      return {
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
      return false;
    } else {
      return false;
    }
  };
}

export default Pocp;
