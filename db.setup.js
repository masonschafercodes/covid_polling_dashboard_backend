const MongoClient = require('mongodb').MongoClient
const csv = require('csv-parser')
const fs = require('fs')
const fetch = require('node-fetch')
var pres_url = 'presidential_polling.csv'
var url = 'mongodb://localhost:27017/'

//Create a Collection
const createCollection = (url, colletion_name, db_name) => {
  MongoClient.connect(url, function (err, db) {
    if (err) throw err
    var dbo = db.db(db_name)
    dbo.createCollection(colletion_name, function (err, res) {
      if (err) throw err
      console.log('Collection created!')
      db.close()
    })
  })
}

const dropCollection = (url, db_name, collection_name) => {
  //Drop Collection
  MongoClient.connect(url, function (err, db) {
    if (err) throw err
    var dbo = db.db(db_name)
    dbo.collection(collection_name).drop(function (err, delOK) {
      if (err) throw err
      if (delOK) console.log('Collection deleted')
      db.close()
    })
  })
}

//(If Collection exists you need to drop the collection first, then run this code after) This will create a new poll_data collection
// dropCollection(url, 'covid_data_db', 'poll_data')

// createCollection(url, 'covid_data_db', 'geometry_data')
dropCollection(url, 'covid_data_db', 'state_data')
// createCollection(url, 'covid_data_db', 'poll_data')

// fs.createReadStream(pres_url)
//   .pipe(csv())
//   .on('data', (row) => {
//     MongoClient.connect(url, function (err, db) {
//       if (err) throw err
//       var dbo = db.db('covid_data_db')
//       var myobj = {
//         state: row.state,
//         date: row.modeldate,
//         candidate: row.candidate_name,
//         pct: row.pct_trend_adjusted,
//       }
//       dbo.collection('poll_data').insertOne(myobj, function (err, res) {
//         if (err) throw err
//         console.log('1 document inserted')
//         db.close()
//       })
//     })
//   })
//   .on('end', () => {
//     console.log('CSV file successfully processed')
//   })

// //(If Collection exists you need to drop the collection first, then run this code after) This will create a new geometry_data collection

// fs.createReadStream('statelatlong.csv')
//   .pipe(csv())
//   .on('data', (row) => {
//     MongoClient.connect(url, function (err, db) {
//       if (err) throw err
//       var dbo = db.db('covid_data_db')
//       if (row.State === 'WA') {
//         console.log('skipped')
//       } else {
//         var myobj = { state: row.State, lat: row.Latitude, long: row.Longitude }
//         dbo.collection('geometry_data').insertOne(myobj, function (err, res) {
//           if (err) throw err
//           console.log('1 document inserted')
//           db.close()
//         })
//       }
//     })
//   })
//   .on('end', () => {
//     console.log('CSV file successfully processed')
//   })

// //(Drop existing Collection and Run the bellow code)Get all COVID data per state
var usCovidDataPerState = 'https://covidtracking.com/api/v1/states/daily.json'

fetch(usCovidDataPerState)
  .then((res) => res.json())
  .then((data) => {
    data.forEach((element) => {
      MongoClient.connect(url, function (err, db) {
        if (err) throw err
        var dbo = db.db('covid_data_db')
        //AS, GU, MP, PR, VI
        if (
          element.state == 'AS' ||
          element.state == 'GU' ||
          element.state == 'MP' ||
          element.state == 'PR' ||
          element.state == 'VI'
        ) {
          console.log('skipped')
        } else {
          var myobj = {
            state: element.state,
            deaths: element.death,
            confirmed_cases: element.positive,
            date: element.date,
          }
          dbo.collection('state_data').insertOne(myobj, function (err, res) {
            if (err) throw err
            console.log('1 document inserted')
            db.close()
          })
        }
      })
    })
  })
