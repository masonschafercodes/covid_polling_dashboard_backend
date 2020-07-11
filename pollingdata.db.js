const MongoClient = require('mongodb').MongoClient
const csv = require('csv-parser')
const fs = require('fs')

const pres_url = 'presidential_polling.csv'
const url = 'mongodb://127.0.0.1:27017/'

function dropCollection(url, db_name, collection_name) {
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

function readPollData() {
  dropCollection(url, 'covid_data_db', 'poll_data')
  fs.createReadStream(pres_url)
    .pipe(csv())
    .on('data', (row) => {
      MongoClient.connect(url, function (err, db) {
        if (err) throw err
        let dbo = db.db('covid_data_db')
        let myobj = {
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

readPollData()
