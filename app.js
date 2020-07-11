//Required Libraries
const express = require('express')
const MongoClient = require('mongodb').MongoClient
const ObjectId = require('mongodb').ObjectId
const csv = require('csv-parser')
const fs = require('fs')
const fetch = require('node-fetch')

//Middleware
const app = express()

let allowCrossDomain = function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', '*')
  next()
}
app.use(allowCrossDomain)

const port = 3000

const mongo_uri = 'mongodb://localhost:27017/'
const pres_url = 'presidential_polling.csv'
const usCovidDataPerState = 'https://covidtracking.com/api/v1/states/daily.json'

// create an initial variable
let dbClient
// assign the client from MongoClient
MongoClient.connect(mongo_uri, { useNewUrlParser: true, poolSize: 10 })
  .then((client) => {
    db = client.db('covid_data_db')
    dbClient = client
    geo_data = db.collection('geometry_data')
    poll_data = db.collection('poll_data')
    state_data = db.collection('state_data')
    app.locals.geo_data = geo_data
    app.locals.state_data = state_data
    app.locals.poll_data = poll_data
    app.listen(port, () => console.info(`REST API running on port ${port}`))
  })
  .catch((error) => console.error(error))
// listen for the signal interruption (ctrl-c)
process.on('SIGINT', () => {
  dbClient.close()
  process.exit()
})

//endpoints
app.get('/', (req, res) => {
  res
    .status(200)
    .json(
      'Available Routes: /api/state_data, /api/poll_data, /api/state_geometry',
    )
})

app.get('/api/state_data', (req, res) => {
  const state_data_col = req.app.locals.state_data
  state_data_col
    .find({})
    .toArray()
    .then((response) => res.status(200).json(response))
    .catch((error) => console.error(error))
})

app.get('/api/poll_data', (req, res) => {
  const poll_data_col = req.app.locals.poll_data
  poll_data_col
    .find({})
    .toArray()
    .then((response) => res.status(200).json(response))
    .catch((error) => console.error(error))
})

app.get('/api/state_geometry', (req, res) => {
  const geo_data_col = req.app.locals.geo_data
  geo_data_col
    .find({})
    .toArray()
    .then((response) => res.status(200).json(response))
    .catch((error) => console.error(error))
})

app.get('/api/updatealldata', (req, res) => {
  const state_data_col = req.app.locals.state_data
  state_data_col.drop(function (err, delOK) {
    if (err) throw err
    if (delOK) console.log('Collection deleted')
  })
  fetch(usCovidDataPerState)
    .then((res) => res.json())
    .then((data) => {
      data.forEach((element) => {
        if (
          element.state == 'AS' ||
          element.state == 'GU' ||
          element.state == 'MP' ||
          element.state == 'PR' ||
          element.state == 'VI'
        ) {
          console.log(`skipped: ${element.state}`)
        } else {
          var myobj = {
            state: element.state,
            deaths: element.death,
            confirmed_cases: element.positive,
            date: element.date,
          }
          state_data_col.insertOne(myobj, function (err, res) {
            if (err) throw err
          })
        }
      })
    })

  res.status(200).json('All Updated')
})
