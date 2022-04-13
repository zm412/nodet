const express = require("express");
const bodyParser = require('body-parser');
const path = require('path');
var cors = require('cors');
const hbs = require('hbs');
var nano = require('nano')('http://admin:4455@db:5984');
var satellite_db = nano.use('satellite_db');
const { graphqlHTTP } = require("express-graphql");
const schema = require('./schema');
const fs=require("fs")


const app = express();
app.use(express.static(__dirname + '/public'));

const temp = async () => {
  const dblist = await nano.db.list()
  const doclist = await satellite_db.list({include_docs: true})
}

temp()


const root = {

  getAllItems: async () => {
    const q = {
      selector: {
        type: { $gt: null }
      },
    };
    const doclist = await satellite_db.list({include_docs: true});
    return doclist.rows.map(n=>n.doc);
  },

  getCountry: async({id}) => {
    const doc = await satellite_db.get(id, {include_docs: true});
    if(doc.type == 'country'){
      name = doc.name;
      const q = {
        selector: {
          "country_id": doc._id
        },
      };
      const doclist = await satellite_db.find(q);
      doc.satellites = doclist.docs;
      //console.log(doc, 'doc')
      return doc;
      //return { 'country_name': [name], 'satellites': doclist.docs };
    }
  },

  getSatellite: async({ id }) => {
    const doc = await satellite_db.get(id, {include_docs: true});
      if(doc.type == 'satellite'){
          const q = {
            selector: {
              _id : doc.country_id 
            },
          };

         const country = await satellite_db.get(doc.country_id, {include_docs: true});
        doc.countries = [ country ]
        console.log(doc, 'doc')
         //return { 'country_name': [country.name], 'satellites': [doc] };
        return doc
      }
  },
  getCountriesByPages: async({ page_num, limit_num}) => {
    const queryOptions = {
      reduce:false,
      limit: limit_num,
      skip:(page_num-1 )*limit_num,
      include_docs: true
    };

    const doclist = await satellite_db.view( 'satellite_n', 'by_country', queryOptions);
    //console.log(doclist.rows.map(n=>n.doc), 'doclist')
    return doclist.rows.map(n=> n.doc);
  },


  getSatellitesByPages: async({ page_num, limit_num}) => {
    const queryOptions = {
      reduce:false,
      limit: limit_num,
      skip:(page_num-1 )*limit_num,
      include_docs: true
    };

    const doclist = await satellite_db.view( 'satellite_n', 'by_satellite', queryOptions);
    //console.log(doclist.rows.map(n=>n.doc), 'doclist')
    return doclist.rows.map(n=> n.doc);
  },


  getItemsByPages: async({ page_num, limit_num, viewFamilyName, viewName }) => {
    const queryOptions = {
      reduce:false,
      limit: limit_num,
      skip:(page_num-1 )*limit_num,
      include_docs: true
    };

    const doclist = await satellite_db.view( viewFamilyName, viewName, queryOptions);
    console.log(doclist, 'doclist')
    return doclist;
  },

  searchItemByName: async({ str }) => {
    const q = {
       "selector": {
          "_id": { "$gt": null },
          "name": { "$regex": '^' + str  }
         }
      }
    let doc = await satellite_db.find(q);
    console.log(doc.docs, 'doc')
    return doc.docs 
  },

  createCountry: async(name) => {
    let data = { type: 'country', name };
    const doc = await satellite_db.insert(data);
    return doc;
 },

  createSatellite: async(name, country_id) => {
    let data = { type: 'satellite', name: name, country_id: country_id };
    return await satellite_db.insert(data);
  },

  deleteItem: async(id, rev) => {
    return await satellite_db.destroy(id, rev, (res)=> console.log(res));
  }

}


app.use('/graphql', graphqlHTTP({
  graphiql: true,
  schema,
  rootValue: root
}))

app.use(cors())

app.set('view engine', 'html');
app.engine('html', require('hbs').__express);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.get("/", async function(req, res){
  
  root.getAllItems().then(doclist => {
    res.render('index', {
      'data': doclist,
      'countries': doclist.filter(n => n.type == 'country'),
      'satellites': doclist.filter(n => n.type == 'satellite'),
    })
  }).catch(err => res.send(err))
    
});

app.post("/api/get_items", async(req, res) => {
  let page_num = req.body.page_num;
  let limit = req.body.limit;
  let type = req.body.items_type;
  let view = 'by_'+type;

  if(page_num && limit && type){
    root.getItemsByPages(page_num, limit, 'satellite_n', 'by_'+type).then(doc => {
      res.json(doc);
    }).catch(err =>{
      res.send(err);
    })
  }else{
    res.redirect('/');
  }
});

app.post('/api/search_item', async function(req, res){
  const string_key = req.body.string_key;
  if (string_key){

    root.searchItemByName(string_key).then(doc => {
      let obj = doc.docs.length > 0 ? {items: doc.docs} : { message: 'No results found' }
      res.render('objectsList', obj);
    }).catch(err => {
      res.send(err)
    })

  }else{
    res.render('objectsList', {message: 'No result found'})
  }
})

app.post('/api/get_by_id', async function(req, res){
  const id = req.body.id;
  const type = req.body.type;
  let func = type == 'country' ? 'getCountry' : 'getSatellite';
  
  if(id){
    root[func](id).then(doc => {
        res.render('objectsList', doc ? doc : { message: `There are no items in this category (${type}) with this id` });
      }).catch(err => {
        res.render('objectsList', {err})
    })
  }else{
    res.render('objectsList', {message: 'No result found'})
  }
})

//-----

app.post('/api/add_country', async function(req, res){

  let regexOne = /^([a-zA-Zа-яёА-ЯЁ])+|([a-zA-Zа-яёА-ЯЁ\-]){3,}| ([a-zA-Zа-яёА-ЯЁ\-]){3,}$/;
  const name = req.body.name.trim();
  if(regexOne.test(name)){
    root.createCountry(name).then(doc => {
        res.redirect('/');
    }).catch(err => {
        res.send(err)
      })
  }else{
    res.redirect('/');
  }
  
})

app.post('/api/add_satellite', async function(req, res){
  let sat_name = req.body.sat_name;
  let sat_country_id = req.body.country_id;
   if(sat_name != false){
     root.createSatellite(sat_name, sat_country_id).then(doc => {
        res.redirect('/');
     }).catch(err => {
        res.send(err)
      })
  }else{
    res.redirect('/');
  }

})

app.post('/api/delete_item/', async (req, res) => {
  const id = req.body.id;
  const rev = req.body.rev;
  root.deleteItem(id, rev);
  res.redirect('/');
})


//-----



app.listen(5000);
