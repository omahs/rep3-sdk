import { BASE_URL } from '../constants';
import { createClient } from 'urql';

export const getSubgraphUrl = (network: number) => {
  switch (network) {
    case 80001:
      return BASE_URL.subgraph;
    case 137:
      return BASE_URL.subgraph_mainnet;
    default:
      return BASE_URL.subgraph;
  }
};

export const subgraphGetterFunction = async (
  tokensQuery: string,
  variables: any,
  network: number
): Promise<any> => {
  try {
    const client = createClient({
      url: getSubgraphUrl(network),
      requestPolicy: 'network-only',
    });
    const data = await client.query(tokensQuery, variables).toPromise();
    return data;
  } catch (error) {
    console.log('Error fetching data: ', error);
    throw error;
  }
};
