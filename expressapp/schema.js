
const BuildSchema = require("graphql").buildSchema;
var schema = BuildSchema(`
    type Country {
        _id: ID
        type: String
        name: String
        satellites: [Satellite]
    }
    type Satellite {
        id: String
        type: String
        name: String
        country_id: String
    }

    input CountryInput {
        id: ID
        type: String!
        name: String!
        satellites: [SatelliteInput]
    }
    input SatelliteInput {
        id: ID
        type: String!
        name: String!
        country_id: String!
    }

    type Query {
      getAllCountries: [Country]
      getCountry(id: ID): Country
    }
`);



module.exports = schema


