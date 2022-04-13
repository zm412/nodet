
const BuildSchema = require("graphql").buildSchema;
var schema = BuildSchema(`
    type Country {
        _id: ID
        type: String
        name: String
        satellites: [ Satellite ]
    }
    type Satellite {
        _id: String
        type: String
        name: String
        country_id: String
        countries: [ Country ]
    }

    union SearchResult = Satellite | Country

    input CountryInput {
        _id: ID
        type: String!
        name: String!
        satellites: [ SatelliteInput ]
    }

    input SatelliteInput {
        _id: ID
        type: String!
        name: String!
        country_id: ID 
        countries: [ CountryInput ]
    }

    type Query {
      getAllItems: [Country]
      getCountry(id: ID): Country 
      getSatellite(id: ID): Satellite
      getSatellitesByPages(page_num: Int!, limit_num: Int!): [ Satellite ]
      getCountriesByPages(page_num: Int!, limit_num: Int!): [ Satellite ]
      searchItemByName(str: String!): SearchResult!
      search(str: String!): SearchResult!
    }

    type Mutation {
      createCountry(input: CountryInput): Country
    }
`);



module.exports = schema


