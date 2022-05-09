import { BASE_URL } from '../constants';
import { createClient } from 'urql';

const client = createClient({
  url: BASE_URL.subgraph,
});

export const subgraphGetterFunction = async (
  tokensQuery: string,
  variables: any
): Promise<any> => {
  try {
    const data = await client.query(tokensQuery, variables).toPromise();
    return data;
  } catch (error) {
    console.log('Error fetching data: ', error);
    throw error;
  }
};
