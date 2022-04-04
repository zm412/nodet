const express = require("express");
const bodyParser = require('body-parser');
const path = require('path');
const NodeCouchDb = require('node-couchdb');
const hbs = require('hbs');
//const ExpressGraphQL = require("express-graphql");
const BuildSchema = require("graphql").buildSchema;

const app = express();
/*
var schema = BuildSchema(`
    type Account {
        id: String,
        firstname: String,
        lastname: String,
    }
    type Blog {
        id: String,
        account: String!,
        title: String,
        content: String
    }
`);

var resolvers = {
    createAccount: (data) => {
        var id = UUID.v4();
        data.type = "account";
        return new Promise((resolve, reject) => {
            bucket.insert(id, data, (error, result) => {
                if(error) {
                    return reject(error);
                }
                resolve({ "id": id });
            });
        });
    }
};

app.use("/graphql", ExpressGraphQL({
    schema: schema,
    rootValue: resolvers,
    graphiql: true
}));


*/
const couch = new NodeCouchDb({
  auth: {
    user: 'admin',
    password: '4455'
  }
})

const dbName = 'satellite_db';
const viewCountryUrl = '_design/satellite_n/_view/country';
const viewAllData = '_design/satellite_n/_view/all_data';
const viewByCountry = '_design/satellite_n/_view/by_country';
const viewBySatellite = '_design/satellite_n/_view/by_satellite';


couch.listDatabases()
  .then((dbs) => {
    console.log(dbs)
  })


app.set('view engine', 'html');
app.engine('html', require('hbs').__express);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));


app.get("/api/get_satellites/:page_num/:limit", function(req, res){
  let page_num = req.params.page_num;
  let limit = req.params.limit;


  const queryOptions = {
    reduce:false,
    limit,
    skip:(page_num-1 )*limit
  };

      console.log(queryOptions, 'query')
  couch.get(dbName, viewBySatellite, queryOptions).then(({data, headers, status}) => {
      console.log(data, 'fullData')
      console.log(data.rows, 'dataPL')
      console.log(data.total_rows, 'dataDK')
      console.log(data.offset, 'dataSO')
      console.log(typeof data, 'type')
      res.json(data)
    },
    function(err){
      console.log(err, 'err')
      res.send(err)
    }
  )

});


app.get("/api/get_countries/:page_num/:limit", function(req, res){
  let page_num = req.params.page_num;
  let limit = req.params.limit;


  const queryOptions = {
    reduce:false,
    limit,
    skip:(page_num-1 )*limit
  };

      console.log(queryOptions, 'query')
  couch.get(dbName, viewByCountry, queryOptions).then(({data, headers, status}) => {
      console.log(data, 'fullData')
      console.log(data.rows, 'dataPL')
      console.log(data.total_rows, 'dataDK')
      console.log(data.offset, 'dataSO')
      console.log(typeof data, 'type')
      res.json(data)
    },
    function(err){
      console.log(err, 'err')
      res.send(err)
    }
  )

});


app.get("/", function(req, res){

  couch.get(dbName, viewAllData).then(
    function(data, headers, status) {
      //console.log(data, 'data')
      res.render('index', {
        'data': data.data.rows,
        'countries': data.data.rows.filter(n => n.value.type == 'country'),
        'satellites': data.data.rows.filter(n => n.value.type == 'satellite'),
      })
    },
    function(err){
      console.log(err, 'err')
      res.send(err)
    }
  )

});

app.get('/api/country/:id', function(req, res){
  let id = req.params.id;
  let name;
 
  couch.get(dbName, id).then(
    function(data, headers, status) {
      name = data.data.country_name
    
    },
    function(err){
      console.log(err, 'err')
    }
  )
 
  couch.get(dbName, viewAllData).then(
    function(data, headers, status) {
      //console.log(data.data.rows, 'data')
      res.render('objectsList', {
        'country_name': name,
        'satellites': data.data.rows.filter(n => n.value.sat_country==name)
      })
    },
    function(err){
      console.log(err, 'err')
      res.send(err)
    }
  )
}
  )

app.post('/api/country', function(req, res){
  const id = req.body.country_id;
  let name; 
  
  couch.get(dbName, id).then(
    function(data, headers, status) {
      //console.log(data, 'ISDLKJLJ')
      name = data.data.country_name
    
    },
    function(err){
      console.log(err, 'err')
    }
  )
 
  couch.get(dbName, viewAllData).then(
    function(data, headers, status) {
      //console.log(data.data.rows, 'data')
      res.render('objectsList', {
        'country_name': name,
        'satellites': data.data.rows.filter(n => n.value.data.sat_country==name)
      })
    },
    function(err){
      console.log(err, 'err')
      res.send(err)
    }
  )
})

app.post('/api/add_country', function(req, res){
  const name = req.body.name;
  if(name != ''){

    couch.uniqid()
      .then(function(ids){
        const id = ids[0];
        couch.insert(dbName, {
          _id: id,
          type: 'country',
          country_name: name
        })
          .then(
            function(data, headers, status){
              res.redirect('/');
            },
            function(err){
              res.send(err);
            },
          )
      })
  }else{
  }
  
})

app.post('/api/add_satellite', function(req, res){
  let sat_name = req.body.sat_name;
  let sat_country = req.body.country;

  couch.uniqid()
    .then(function(ids){
      const id = ids[0];
      couch.insert(dbName ,{
        _id: id,
        type: 'satellite',
        satellite_name: sat_name,
        sat_country: sat_country
      })
        .then(
          function(data, headers, status){
            res.redirect('/');
          },
          function(err){
            res.send(err);
          },
        )
    })
})


app.get('/api/get_list_countries', function(req, res){

})

app.listen(3000);
