
const BuildSchema = require("graphql").buildSchema;
var schema = BuildSchema(`
    type Country {
        _id: ID
        type: String
        name: String
    }
    type Satellite {
        id: String
        type: String
        name: String
        country_id: String
    }

    input CountryInput {
        type: String
        name: String
    }

    input SatelliteInput {
        id: ID
        type: String!
        name: String!
        country_id: String!
    }

    type Query {
      getAllItems: [Country]
      getCountry(id: ID): Country
    }

    type Mutation {
      createCountry(input: CountryInput): Country
    }
`);



module.exports = schema


