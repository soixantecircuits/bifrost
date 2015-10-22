// Require
var 
	pjson = require('./package.json'),

	Proxy = require('./app/proxy'),
	Queue = require('./app/queue'),
	
	ip = require('ip'),
	fsExtra = require('fs-extra'),
	bodyParser = require('body-parser'),

	events = require('events'),
	eventEmitter = new events.EventEmitter(),
	
	express = require('express');

// Variables
var 
	pathQueue = "./app/queue",
	expressResponse,
	retryTimeout;


// INIT App
var app = express();

// Settings - bodyparser
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());


// Routes
app.get('/', function ( req, res ) {
	res.send('Bifrost has started!');
});

app.post('/', function ( req, res ) {
	expressResponse = res;

	Proxy.post( req.body, false );
	// proxyPost( req.body, false );
});


// Start server
var server = app.listen(3000, function () {

	eventEmitter.on( 'PROXY_POST_SUCCESS', onProxySuccess );
	
	var port = server.address().port;
	console.log('%s %s is running on http://%s:%s', pjson.name, pjson.version, ip.address(), port);
});

var onProxySuccess = function( body ) {
	console.log("proxy success", body);
};