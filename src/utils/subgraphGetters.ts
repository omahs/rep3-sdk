import { ApolloClient, InMemoryCache, gql } from '@apollo/client';
import { BASE_URL } from '../constants';

const client = new ApolloClient({
  uri: BASE_URL.subgraph,
  cache: new InMemoryCache(),
});

export const subgraphGetterFunction = async (
  tokensQuery: string,
  variables: any
) => {
  client
    .query({
      query: gql(tokensQuery),
      variables,
    })
    .then(data => {
      console.log('Subgraph data: ', data);
      return data;
    })
    .catch(err => {
      console.log('Error fetching data: ', err);
      return err;
    });
};
