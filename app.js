// Require
var 
	Proxy = require('./app/proxy'),
	Queue = require('./app/queue'),
	EventDispatcher = require('./app/eventDispatcher'),
	pjson = require('./package.json'),
	config = require('./app/config/config.json'),
	
	fs = require('graceful-fs'),
	NanoTimer = require('nanotimer'),
	ip = require('ip'),
	bodyParser = require('body-parser'),
	express = require('express');

// Variables
var 
	expressResponse,
	timer = new NanoTimer();

// INIT App
var app = express();

// Settings - bodyparser
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.use(express.static('public'));
app.set('view engine', 'ejs');

// Routes
app.get('/', function ( req, res ) {
	
	var lengthQueue = 0;
	fs.readdir( config.path.queue, function (err, files) {
		if (err) {
			lengthQueue = 0;
			res.render('index', { lengthQueue : lengthQueue });
			return;			
		}

		// Filter to remove unwanted files
		files = files.filter( function(a){ return a.match(/\.txt$/); } );
		lengthQueue = files.length;

		res.render('index', { lengthQueue : lengthQueue });
	});
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

	if ( fromQueue ) // Failed again - keep in queue
		EventDispatcher.emit( EventDispatcher.START_TIMER );
	else 
		Queue.writeFile( postData );
};

var onStartTimer = function() {
	clearTimer();
	timer.setTimeout( Queue.handle, '', config.timeout );
};

var onClearTimer = function() {
	clearTimer();
};

var clearTimer = function() {
	if ( timer ) timer.clearTimeout();
};

var onFileQueued = function() {
	expressResponse.send("Server is idle - data saved - automated retry upcoming.");
};
var onFileDelete = function ( timestamp ) {
	Queue.deleteFile( timestamp );
};

// Start server
var server = app.listen(config.server.port, function () {
	
	EventDispatcher.on( EventDispatcher.PROXY_POST, onProxyPost );
	EventDispatcher.on( EventDispatcher.PROXY_POST_SUCCESS, onProxySuccess );
	EventDispatcher.on( EventDispatcher.PROXY_POST_ERROR, onProxyError );

	EventDispatcher.on( EventDispatcher.FILE_QUEUED, onFileQueued );
	EventDispatcher.on( EventDispatcher.DELETE_FROM_QUEUE, onFileDelete );

	EventDispatcher.on( EventDispatcher.START_TIMER, onStartTimer );
	EventDispatcher.on( EventDispatcher.CLEAR_TIMER, onClearTimer );

	var port = server.address().port;
	
	console.log("  ____  _  __               _   ");
	console.log(" |  _ \\(_)/ _|             | |  ");
	console.log(" | |_) |_| |_ _ __ ___  ___| |_ ");
	console.log(" |  _ <| |  _| '__/ _ \\/ __| __|");
	console.log(" | |_) | | | | | | (_) \\__ | |_ ");
	console.log(" |____/|_|_| |_|  \\___/|___/\\__|");
	console.log("                                ");
	console.log("                                ");
	console.log('%s %s is running on http://%s:%s', pjson.name, pjson.version, ip.address(), port);

	// On script launch handle queue
	Queue.handle();
});


