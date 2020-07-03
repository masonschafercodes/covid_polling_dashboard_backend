//Required Libraries
const express = require('express');
const MongoClient = require('mongodb').MongoClient;

var url = "mongodb://localhost:27017/";

//Middleware
const app = express();
const port = process.env.PORT || "5000";

let allowCrossDomain = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', "*");
  res.header('Access-Control-Allow-Headers', "*");
  next();
}
app.use(allowCrossDomain);


//endpoints
app.get('/', (req, res) => {
    res.send("<a href='/api/state_data'>State Data</a> <br /> <a href='/api/state_geometry'>State Geo-Geometry</a>");
})

app.get("/api/state_data", (req, res) => {
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("covid_data_db");
        dbo.collection("state_data").find({}).toArray(function(err, result) {
          if (err) throw err;
          res.send(JSON.stringify(result));
          db.close();
        });
      });
})

app.get("/api/state_geometry", (req, res) => {
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("covid_data_db");
        dbo.collection("geometry_data").find({}).toArray(function(err, result) {
          if (err) throw err;
          res.send(JSON.stringify(result));
          db.close();
        });
      });
})

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
})