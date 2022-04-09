
import { ApolloClient, InMemoryCache, gql } from "./node_modules/@apollo/client";
//import ApolloClient from 'apollo-boost';
console.log(qql, 'APP')
console.log("hello", 'APP')

const client = new ApolloClient({
  uri: 'http://localhost:5000/graphql',
  cache: new InMemoryCache()
})

console.log(client, 'APP')

client
  .query({
    query: gql`
      query getAllItems {
        id, name
     }
    `
  })
  .then(result => console.log(result, 'result'));
