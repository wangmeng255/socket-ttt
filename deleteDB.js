var http = require('http');
var express = require('express');
var mongoose = require('mongoose');
var User = require('./user-model');

var app = express();
var server = http.Server(app);

var config = require('./config');
mongoose.Promise = global.Promise;

User.remove(function(err,removed) {

   // where removed is the count of removed documents
   if(err) console.log(err)
   else console.log(removed);
});

mongoose.connect(config.DATABASE_URL).then(function() {
    app.listen(8080);
});