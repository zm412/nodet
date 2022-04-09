const express = require("express");
const bodyParser = require('body-parser');
const path = require('path');
//const NodeCouchDb = require('node-couchdb');
var cors = require('cors');
const hbs = require('hbs');
var nano = require('nano')('http://admin:4455@db:5984');
//var nano = require('nano')('http://admin:4455@localhost:9100');
var satellite_db = nano.use('satellite_db');
const { graphqlHTTP } = require("express-graphql");
const schema = require('./schema');

const app = express();
app.use(express.static(__dirname + '/public'));

//-------

const temp = async () => {
  //const response = await satellite_db.destroy('_design/satellite_n', '1-e37ce87801e5b92e6784094dadee0835')
  /*
 satellite_db.insert(
  { "views": 
    {  "by_country": 
      { "map": "function (doc) {\n  if(doc.type == 'country')  emit(doc._id, doc);\n}" },
    }   
  }, '_design/satellite_n', function (error, response) {
    console.log("yay");
  });

*/
  /*
   satellite_db.insert(
  { "views": 
    { "satellite": 
      {  "map": "function (doc) {\n  if(doc.type == 'satellite')  emit(doc._id, 1);\n}" } 
    }
  }, '_design/satellite_n', function (error, response) {
    console.log("yay");
  });
  */
  const dblist = await nano.db.list()
  //const doclist = await satellite_db.view("", '_all_docs')
  const doclist = await satellite_db.list({include_docs: true})
  console.log(doclist.rows, 'ALLLLL')
/*
  satellite_db.insert({
  "views": {
    "by_country": {
      "map": "function (doc) {\n  if(doc.type == 'country')  emit(doc._id, doc);\n}"
    },
    "by_satellite": {
      "map": "function (doc) {\n  if(doc.type == 'satellite')  emit(doc._id, doc);\n}"
    }
  }},"_design/satellite_n", function (error, response) {
    console.log("yay");
  }

  )
  */
  //const doclist = await satellite_db.list().then((body) => console.log(body.rows[0].value, 'body'))
  
  //await nano.db.destroy('_users')
  //await nano.db.create('_users')

  //const info = await nano.db.get('satellite_db')
  //console.log(info, 'info')
}


temp()

const createCountry = (input) => {
  let type = "country";
  return {type, ...input}
}

async function getAllItems(){
    const q = {
      selector: {
        type: { $gt: null }
      },
    };

    const doclist = await satellite_db.find(q)
    return doclist.docs
}

const root = {

  getAllItems: async () => {
    const q = {
      selector: {
        type: { $gt: null }
      },
    };

    const doclist = await satellite_db.find(q)
    
    return doclist.docs
  },

  getCountry:({id}) => {
    return null;
  },

  createCountry: async({input}) => {
    let obj = createCountry(input) 
    const response = await satellite_db.insert(obj)
    return response;
    console.log(input, 'input')
    console.log(response.id, 'response')
  }

}


app.use('/graphql', graphqlHTTP({
  graphiql: true,
  schema,
  rootValue: root
}))

//-----

/*
const couch = new NodeCouchDb({
  host: 'db',
  host: 'admin:4455@db:',
  protocol: 'https',
  port: 9100 
})
const couch = new NodeCouchDb({
  auth: {
    user: 'admin',
    password: '4455'
  }
})
*/
let couch;

const dbName = 'satellite_db';
const viewAllData = '_design/satellite_n/_view/all_data';
const viewByCountry = '_design/satellite_n/_view/by_country';
const viewBySatellite = '_design/satellite_n/_view/by_satellite';
app.use(cors())
/*
couch.listDatabases()
  .then((dbs) => {
    console.log(dbs)
  })

*/
app.set('view engine', 'html');
app.engine('html', require('hbs').__express);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.get("/", async function(req, res){
  try{
    const q = {
      selector: {
        type: { $gt: null }
      },
    };

    const doclist = await satellite_db.find(q)

    res.render('index', {
      'data': doclist.docs,
      'countries': doclist.docs.filter(n => n.type == 'country'),
      'satellites': doclist.docs.filter(n => n.type == 'satellite'),
    })

  }catch(err) {
    res.send(err)
  }

});

app.post("/api/get_items", async(req, res) => {
  let page_num = req.body.page_num;
  let limit = req.body.limit;
  let type = req.body.items_type;
  let view = 'by_'+type;
  console.log(view, 'view')
  console.log(req.body, 'relkjlkljkjk')
  if(page_num && limit && type){

      try{
        const queryOptions = {
          reduce:false,
          limit,
          skip:(page_num-1 )*limit,
          include_docs: true
        };
      
//        const body = await alice.view('characters', 'happy_ones', { key: 'Tea Party', include_docs: true })

          const doclist = await satellite_db.view('satellite_n', 'by_'+type, queryOptions)
          console.log(doclist, 'dockist')
          res.json(doclist);

        }catch(err) {
          res.send(err)
        }

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



app.listen(5000);
