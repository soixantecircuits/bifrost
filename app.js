// Require
var 
	Proxy = require('./app/proxy'),
	Queue = require('./app/queue'),
	pjson = require('./package.json'),
	
	ip = require('ip'),
	bodyParser = require('body-parser'),

	events = require('events'),
	eventEmitter = new events.EventEmitter(),

	express = require('express');

// Variables
var expressResponse;

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
});


var onProxySuccess = function( body ) {

	console.log('onProxySuccess');
	expressResponse.send( "PROXY Success" );
};

var onProxyError = function( postData, fromQueue ) {

	console.log('onProxyError');

	if ( fromQueue ) {

		// Failed again - keep in queue
		if ( retryTimeout ) clearTimeout( retryTimeout );
		retryTimeout = setTimeout( Queue.handle, 5000 );

	} else {

		Queue.writeFile( postData );
	}
};

// Start server
var server = app.listen(3000, function () {
	
	eventEmitter.on( 'PROXY_POST_SUCCESS', onProxySuccess );
	eventEmitter.on( 'PROXY_POST_ERROR', onProxyError );

	var port = server.address().port;
	console.log('%s %s is running on http://%s:%s', pjson.name, pjson.version, ip.address(), port);
});


