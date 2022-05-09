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
    const data = client.query(tokensQuery, { variables });
    return data;
  } catch (error) {
    console.log('Error fetching data: ', error);
    throw error;
  }
};
