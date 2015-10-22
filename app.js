// Require
var pjson = require('./package.json');
var bodyParser = require('body-parser');

var express = require('express');
var app = express();

// Settings - bodyparser
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// Routes
app.get('/', function ( req, res ) {
	res.send('Bifrost has started!');
});

app.post('/', function ( req, res ) {

	res.end( JSON.stringify(req.body, null, 2) );

});


// Start server
var server = app.listen(3000, function () {
	var host = server.address().address;
	var port = server.address().port;

	console.log('%s %s is running on http://%s:%s', pjson.name, pjson.version, host, port);
});

