// Require
var 
	Proxy = require('./app/proxy'),
	Queue = require('./app/queue'),
	EventDispatcher = require('./app/eventDispatcher'),
	pjson = require('./package.json'),
	
	ip = require('ip'),
	bodyParser = require('body-parser'),
	express = require('express');

// Variables
var 
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
	EventDispatcher.emit( EventDispatcher.PROXY_POST, req.body, false );
});


// Handle events
var onProxyPost = function( body, fromQueue ) {
	Proxy.post( body, fromQueue );
};

var onProxySuccess = function( body ) {

	expressResponse.send( "PROXY Success" );
};

var onProxyError = function( postData, fromQueue ) {

	if ( fromQueue ) {

		// Failed again - keep in queue
		EventDispatcher.emit( EventDispatcher.START_TIMER );

	} else {

		Queue.writeFile( postData );
		// expressResponse.send( "PROXY Error" );
	}
};

var onStartTimer = function() {

	clearTimer();
	retryTimeout = setTimeout( Queue.handle, 5000 );
};

var onClearTimer = function() {

	clearTimer();
};

var clearTimer = function() {

	if ( retryTimeout ) clearTimeout( retryTimeout );
};

var onFileQueued = function() {

	expressResponse.send("Server is idle - data saved - automated retry upcoming.");
};
var onFileDelete = function ( timestamp ) {

	Queue.deleteFile( timestamp );
};

// Start server
var server = app.listen(3000, function () {
	
	EventDispatcher.on( EventDispatcher.PROXY_POST, onProxyPost );
	EventDispatcher.on( EventDispatcher.PROXY_POST_SUCCESS, onProxySuccess );
	EventDispatcher.on( EventDispatcher.PROXY_POST_ERROR, onProxyError );

	EventDispatcher.on( EventDispatcher.FILE_QUEUED, onFileQueued );
	EventDispatcher.on( EventDispatcher.DELETE_FROM_QUEUE, onFileDelete );

	EventDispatcher.on( EventDispatcher.START_TIMER, onStartTimer );
	EventDispatcher.on( EventDispatcher.CLEAR_TIMER, onClearTimer );

	var port = server.address().port;
	console.log('%s %s is running on http://%s:%s', pjson.name, pjson.version, ip.address(), port);
});


