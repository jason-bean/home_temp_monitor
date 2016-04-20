var fs = require('fs');
var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var mongoClient = require('mongodb').MongoClient;
var request = require('request');

var mongoUrl;

fs.readFile('mongoServer.json', 'utf8', function (err, data) {
    if (err) {
        return console.error(err);
    }
    
    var mongoServer = JSON.parse(data);
    mongoUrl = 'mongodb://' + mongoServer.host + ':' + mongoServer.port + '/' + mongoServer.db;
    console.log('Mongo URL: \'' + mongoUrl + '\'');
});

var port =  '8080';
 
var app = express();
app.use('/', express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
 
app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
});
 
var TEMPS_PATH = '/Temps'
 
app.get(TEMPS_PATH + '/DateRange', function(req, res, next) {
    res.setHeader('Cache-Control', 'no-cache');
    
    var startDate = Number(req.query.startDate);
    console.log(new Date(startDate));
    var endDate = Number(req.query.endDate);
    console.log(new Date(endDate));
    
    mongoClient.connect(mongoUrl)
        .then(function(db) {
            return db.collection('temps');
        }).then(function(collection) {
            return collection.find({ x: { $gte: startDate, $lte: endDate } }).sort({ x: 1 });
        }).then(function(cursor) {
            return cursor.toArray();
        }).then(function(documents) {
            res.status(200).send(documents);
            return next();
        }).catch(function(err) {
            return next(err);
        });
});

app.get(TEMPS_PATH + '/Current', function(req, res, next) {
    res.setHeader('Cache-Control', 'no-cache');
    
    request.get('http://airpi.bean.local/temps/current', function (err, resp, body) {
        if (!err && res.statusCode === 200) {
            res.status(200).send(JSON.parse(body));
            return next();
        } else {
            return next(err);
        }
    });
});

app.listen(port, function() {
    console.log('Server started: http://localhost:' + port + '/');
});