const express = require("express");
const bodyParser = require('body-parser');
const path = require('path');
const NodeCouchDb = require('node-couchdb');
const hbs = require('hbs');
//const { graphqlHTTP } = require("express-graphql");
//const schema = require('./schema');

const app = express();

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


//------- 
/*

const root = {
  getAllCountries: async () => {
    let answ;
    await couch.get(dbName, viewByCountry).then((data, headers, status) => {
        answ = data.data.rows.map(n => n.value)
      },err => {
        answ =  err
      }
    )
    return answ;
  },
  getCountry:({id}) => {
    return null;
  }
}


app.use('/graphql', graphqlHTTP({
  graphiql: true,
  schema,
  rootValue: root
}))

*/
//-----

app.get("/", function(req, res){

  couch.get(dbName, viewAllData).then((data, headers, status) => {
      res.render('index', {
        'data': data.data.rows,
        'countries': data.data.rows.filter(n => n.value.type == 'country'),
        'satellites': data.data.rows.filter(n => n.value.type == 'satellite'),
      })
    },err => {
      res.send(err)
    }
  )
});

app.post("/api/get_items", (req, res) => {
  let page_num = req.body.page_num;
  let limit = req.body.limit;
  let type = req.body.items_type;
  if(page_num && limit && type){
      let view = type == 'country' ? viewByCountry : type == 'satellite' ? viewBySatellite : false; 

      const queryOptions = {
        reduce:false,
        limit,
        skip:(page_num-1 )*limit
      };

      couch.get(dbName, view, queryOptions).then(({data, headers, status}) => {
        console.log(data, "countries")
          res.json(data)
        }, err => {
          console.log(err, 'err')
          res.send(err)
        }
      )
  }else{
    res.redirect('/');
  }
  
});

app.post('/api/search_item', function(req, res){
  const string_key = req.body.string_key;
  if (string_key){
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
      couch.mango(dbName, mangoQuery, {}).then(({data, headers, status}) => {
          res.render('objectsList', {
            'satellites': data.docs.length == 0 ? '' : data.docs
          })
        }, err => {
          console.log(err, 'err')
          res.send(err)
        }
      )
  }else{
      res.redirect('/');
  }
})

app.post('/api/country', function(req, res){
  const id = req.body.country_id;
  let name; 
  if(id){
      couch.get(dbName, id).then(({data, headers, status}) => {
          name = data.name;
          const mangoQuery = {
           "selector": {
              "_id": {
                 "$gt": null
              },
              "country_id":data._id 
             }
          }
          couch.mango(dbName, mangoQuery, {}).then(({data, headers, status}) => {
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
  }else{
      res.redirect('/');
  }
})

app.post('/api/satellite', function(req, res){
  const id = req.body.satellite_id;
  if(id){
      const mangoQuery = {
             "selector": {
                "_id": {
                   "$eq": id 
                }
             }
          }
      
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
  }
})


//-----
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
//-----



app.listen(3000);
