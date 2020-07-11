//IMPORTS
const MongoClient = require('mongodb').MongoClient
const csv = require('csv-parser')
const fs = require('fs')
const fetch = require('node-fetch')

//VARIABLES
var pres_url = 'presidential_polling.csv'
var url = 'mongodb://127.0.0.1:27017/'

//Sleep Function
function sleep(milliseconds) {
  const date = Date.now()
  let currentDate = null
  do {
    currentDate = Date.now()
  } while (currentDate - date < milliseconds)
}

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

//drop Collection function
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

//Poll data Function to read in csv and parse out to a collection
function readPollData() {
  dropCollection(url, 'covid_data_db', 'poll_data')
  fs.createReadStream(pres_url)
    .pipe(csv())
    .on('data', (row) => {
      MongoClient.connect(url, function (err, db) {
        if (err) throw err
        var dbo = db.db('covid_data_db')
        var myobj = {
          state: row.state,
          date: row.modeldate,
          candidate: row.candidate_name,
          pct: row.pct_trend_adjusted,
        }
        dbo.collection('poll_data').insertOne(myobj, function (err, res) {
          if (err) throw err
          console.log('polling')
        })
        db.close()
      })
    })
    .on('end', () => {
      console.log('CSV file successfully processed')
    })
}

//Geo data Function to read in csv and parse out to a collection
function readGeoData() {
  dropCollection(url, 'covid_data_db', 'geometry_data')
  fs.createReadStream('statelatlong.csv')
    .pipe(csv())
    .on('data', (row) => {
      MongoClient.connect(url, function (err, db) {
        if (err) throw err
        var dbo = db.db('covid_data_db')
        if (row.State === 'WA') {
          console.log('skipped')
        } else {
          var myobj = {
            state: row.State,
            lat: row.Latitude,
            long: row.Longitude,
          }
          dbo.collection('geometry_data').insertOne(myobj, function (err, res) {
            if (err) throw err
            console.log('geo')
          })
        }
        db.close()
      })
    })
    .on('end', () => {
      console.log('CSV file successfully processed')
    })
}

//Fetch api data, parse out and add to collection
function getStateData() {
  // dropCollection(url, 'covid_data_db', 'state_data')
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
              console.log('state')
            })
          }
          db.close()
        })
      })
    })
}

//Calling all update Database functions
getStateData()
sleep(1000)
readGeoData()
sleep(5000)
readPollData()

//Runs script once every day
// setInterval(updateDatabase, 86400000)
