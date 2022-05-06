import { subgraphGetterFunction } from '../utils/subgraphGetters';
import {
  claimedTokenQuery_claimer,
  claimedTokenQuery,
  approveTokenQuery,
} from '../subgraphQuery';

class PocpBadge {
  /*
   * @param community id
   * @param claimer address
   * @returns Array of tokens
   * @throws "Error"
   */
  getClaimedBadgesOfClaimers = async (
    communityId: string,
    claimerAddress: string
  ) => {
    try {
      const claimToken = await subgraphGetterFunction(
        claimedTokenQuery_claimer,
        {
          communityId,
          claimerAddress,
        }
      );
      return claimToken;
    } catch (error) {
      throw error;
    }
  };

  /*
   * @param community id
   * @returns Array of tokens
   * @throws "Error"
   */
  getClaimedBadges = async (communityId: string) => {
    try {
      const claimToken = await subgraphGetterFunction(claimedTokenQuery, {
        communityId,
      });
      return claimToken;
    } catch (error) {
      throw error;
    }
  };

  /*
   * @param community id
   * @returns Array of tokens
   * @throws "Error"
   */

  getApproveBadges = async (communityId: string) => {
    try {
      const approveToken = await subgraphGetterFunction(approveTokenQuery, {
        communityId,
      });
      return approveToken;
    } catch (error) {
      throw error;
    }
  };

  /*
   * @param community id
   * @param claimer address
   * @returns Array of tokens
   * @throws "Error"
   */

  getUnclaimedBadges = async (communityId: string, claimer: string) => {
    try {
      const approveToken = await this.getApproveBadges(communityId);
      const claimToken = await this.getClaimedBadges(communityId);
      const unclaimedToken: any[] = [];

      approveToken?.data?.approvedTokens.forEach((approve: any) => {
        const filteredToken = claimToken?.data?.pocpTokens.filter(
          (x: any) => x.id === approve.id
        );
        if (
          filteredToken.length === 1 &&
          filteredToken[0].claimer === claimer
        ) {
          unclaimedToken.push(approve);
        }
      });
      return unclaimedToken;
    } catch (error) {
      throw error;
    }
  };
}

export default PocpBadge;
