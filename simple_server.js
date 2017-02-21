
var express = require('express');
var browserify = require('browserify');
var React = require('react');
var jsx = require('node-jsx');
var app = express();

jsx.install();


app.use('/', function(req, res) {
  res.setHeader('content-type', 'application/javascript');
  browserify('./app/app.js', {
    debug: true
  })
  .transform('babelify')
  .bundle()
  .pipe(res);
});


var server = app.listen(3333, function() {
  var addr = server.address();
  console.log('Listening @ http://localhost:%d', addr.port);
});
