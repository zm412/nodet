
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  useQuery,
  gql
} from "@apollo/client";

const client = new ApolloClient({
  uri: 'http://localhost:5000/graphql',
  cache: new InMemoryCache()
})


client
  .query({
    query: gql`
      query getAllItems {
        id, name

     }
    `
  })
  .then(result => console.log(result));
