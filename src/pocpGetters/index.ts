import { subgraphGetterFunction } from '../utils/subgraphGetters';
import {
  daoWithTxHash,
  membershipNFTs,
  membershipNFTsWithHash,
} from '../subgraphQuery';

class PocpGetters {
  network: number;
  constructor(givenNetwork: number) {
    this.network = givenNetwork;
  }

  /*
   * @param community id
   * @returns Array of tokens
   * @throws "Error"
   */
  getdaoInfoForHash = async (tx_hash: string) => {
    try {
      const communityDetail = await subgraphGetterFunction(
        daoWithTxHash,
        {
          tx_hash,
        },
        this.network
      );
      return communityDetail;
    } catch (error) {
      throw error;
    }
  };

  getMembershipNfts = async (claimer: string, contractAddress: string) => {
    try {
      const communityDetail = await subgraphGetterFunction(
        membershipNFTs,
        {
          claimer,
          contractAddress,
        },
        this.network
      );
      return communityDetail;
    } catch (error) {
      throw error;
    }
  };

  getMembershipNftsForHash = async (tx_hash: string) => {
    try {
      const communityDetail = await subgraphGetterFunction(
        membershipNFTsWithHash,
        {
          tx_hash,
        },
        this.network
      );
      return communityDetail;
    } catch (error) {
      throw error;
    }
  };
}

export default PocpGetters;
