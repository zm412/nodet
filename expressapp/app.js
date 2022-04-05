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


app.get("/", function(req, res){

  couch.get(dbName, viewAllData).then(
    function(data, headers, status) {
      //console.log(data.data.rows, 'data')
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


app.post("/api/get_satellites", function(req, res){
  let page_num = req.body.page_num;
  let limit = req.body.limit;

  const queryOptions = {
    reduce:false,
    limit,
    skip:(page_num-1 )*limit
  };

  couch.get(dbName, viewBySatellite, queryOptions).then(({data, headers, status}) => {
      console.log(data, "satellites")
      res.json(data)
    },
    function(err){
      console.log(err, 'err')
      res.send(err)
    }
  )
});


app.post("/api/get_countries", function(req, res){
  let page_num = req.body.page_num;
  let limit = req.body.limit;

  const queryOptions = {
    reduce:false,
    limit,
    skip:(page_num-1 )*limit
  };

  couch.get(dbName, viewByCountry, queryOptions).then(({data, headers, status}) => {
    console.log(data, "countries")
      res.json(data)
    }, err => {
      console.log(err, 'err')
      res.send(err)
    }
  )

});

app.post('/api/search_item', function(req, res){
  const string_key = req.body.string_key;
  
  console.log(req.body, 'req_body')

  const mangoQuery = {
   "selector": {
      "_id": {
         "$gt": null
      },
      "name": {
         "$regex": '^' + string_key  
      }
   }
}
  //console.log(mangoQuery, 'MANGO')
  couch.mango(dbName, mangoQuery, {}).then(({data, headers, status}) => {
      console.log(data, 'SSSSSSSSSSS')
      res.render('objectsList', {
        'satellites': data.docs.length == 0 ? '' : data.docs
      })
    }, err => {
      console.log(err, 'err')
      res.send(err)
    }
  )
 
})

app.post('/api/country', function(req, res){
  const id = req.body.country_id;
  console.log(req.body, 'req_body')
  let name; 
  
  couch.get(dbName, id).then(({data, headers, status}) => {
      console.log(data, 'KKKKKK')
      name = data.name;
      const mangoQuery = {
       "selector": {
          "_id": {
             "$gt": null
          },
          "country_id":data._id 
         }
      }
      //console.log(mangoQuery, 'MANGO')
      couch.mango(dbName, mangoQuery, {}).then(({data, headers, status}) => {
          //console.log(data, 'PPPP')
          res.render('objectsList', {
            'country_name': [name],
            'satellites': data.docs
          })
        }, err => {
          console.log(err, 'err')
          res.send(err)
        }
      )
      }, err => {
        console.log(err, 'err')
      }
    )

})

app.post('/api/satellite', function(req, res){
  const id = req.body.satellite_id;
  console.log(req.body, 'req_body')

  const mangoQuery = {
         "selector": {
            "_id": {
               "$eq": id 
            }
         }
      }
  
  //console.log(mangoQuery, 'MANGO')
  couch.mango(dbName, mangoQuery, {}).then(({data, headers, status}) => {
      console.log(data, 'PPPP')
      let country_id = data.docs[0].country_id;
     
      const mangoQuery2 = {
             "selector": {
                "_id": {
                   "$eq": country_id 
                }
             }
          }
      
      let satellite_data = data;
      couch.get(dbName, country_id).then(({data, headers, status}) => {
        console.log(data, 'doc')
          res.render('objectsList', {
            'country_name': data.name,
            'satellites': satellite_data.docs
          })
        }, err => {
          res.send(err)
        });

    }, err => {
      console.log(err, 'err')
      res.send(err)
    }
  )
      

})

app.post('/api/add_country', function(req, res){
  const name = req.body.name;
  if(name != false){
    couch.uniqid()
      .then(function(ids){
        const id = ids[0];
        couch.insert(dbName, {
          _id: id,
          type: 'country',
          name: name
        })
          .then(({data, headers, status}) => {
            res.redirect('/');
          }, err => {
            res.send(err);
          })
      })
  }else{
    res.redirect('/');
  }
  
})

app.post('/api/add_satellite', function(req, res){
  let sat_name = req.body.sat_name;
  let sat_country_id = req.body.country_id;
 
  couch.get(dbName, sat_country_id).then(({data, headers, status}) => {
      couch.uniqid().then(ids => {
        const id = ids[0];
        couch.insert(dbName, {
          _id: id,
          type: 'satellite',
          name: sat_name,
          country_id: sat_country_id
        })
          .then(({data, headers, status}) => {
              res.redirect('/');
          }, err => {
              res.send(err);
          })
      })
  }, err => {
     res.send(err);
  })

  
})



app.listen(3000);
