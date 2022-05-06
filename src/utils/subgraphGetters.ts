import { ApolloClient, InMemoryCache, gql } from '@apollo/client';
import { BASE_URL } from '../constants';

const client = new ApolloClient({
  uri: BASE_URL.subgraph,
  cache: new InMemoryCache(),
});

export const subgraphGetterFunction = async (
  tokensQuery: string,
  variables: any
): Promise<any> => {
  try {
    const data = client.query({
      query: gql(tokensQuery),
      variables,
    });
    return data;
  } catch (error) {
    console.log('Error fetching data: ', error);
    throw error;
  }
};
