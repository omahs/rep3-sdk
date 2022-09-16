import { getApproversOfDao } from '../subgraphQuery';
import { subgraphGetterFunction } from './subgraphGetters';

export const getApproversForDao = async (
  contractAddress: string,
  subgraphUrl: string
): Promise<[string]> => {
  try {
    const approvers = await subgraphGetterFunction(
      getApproversOfDao,
      {
        contractAddress,
      },
      subgraphUrl
    );
    console.log('approvers are', approvers);
    return approvers?.data?.daos?.[0]?.approver;
  } catch (err) {
    throw err;
  }
};
