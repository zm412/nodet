{
  "_id": "_design/satellite_n",
  "_rev": "58-b6b69aa464e9e6ad759035f9e99ad6d2",
  "views": {
    "country": {
      "map": "function (doc) {\n  if(doc.type == 'country')  emit(doc._id, 1);\n}"
    },
    "satellite": {
      "map": "function (doc) {\n  if(doc.type == 'satellite')  emit(doc._id, 1);\n}"
    },
    "all_data": {
      "map": "function (doc) {\n  let data = {type: doc.type};\n  if(doc.type == 'country') data.country_name = doc.country_name;\nif(doc.type == 'satellite'){\n  data.satellite_name = doc.satellite_name;\n  data.sat_country = doc.sat_country;\n  } \n  emit(doc._id, data);\n}"
    },
    "by_country": {
      "map": "function (doc) {\n  if(doc.type == 'country')  emit(doc._id, doc);\n}"
    }
  },
  "language": "javascript"
}
