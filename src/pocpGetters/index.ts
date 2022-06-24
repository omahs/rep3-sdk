import { subgraphGetterFunction } from '../utils/subgraphGetters';
import {
  daoWithTxHash,
  membershipNFTsForClaimerOfDao,
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

  membershipNftWithClaimerOfDao = async (
    claimer: string,
    contractAddress: string
  ) => {
    try {
      const communityDetail = await subgraphGetterFunction(
        membershipNFTsForClaimerOfDao,
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

  getMembershipNftsForHash = async (id: string) => {
    try {
      const communityDetail = await subgraphGetterFunction(
        membershipNFTsWithHash,
        {
          id,
        },
        this.network
      );
      return communityDetail;
    } catch (error) {
      throw error;
    }
  };

  getForCustomQuery = async (
    customQuery: string,
    variableObject?: any | undefined
  ) => {
    try {
      const approveToken = await subgraphGetterFunction(
        customQuery,
        variableObject && variableObject,
        this.network
      );

      return approveToken;
    } catch (error) {
      throw error;
    }
  };
}

export default PocpGetters;
