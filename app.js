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
	express = require('express'),
	multer  = require('multer'),
	upload = multer({ dest: 'uploads/' });

// Variables
var
	expressResponse,
	visualResponse,
	responseSent = false,
	timer = new NanoTimer();

// INIT App
var app = express();

// Settings - bodyparser
var bodyparserLimit = '100mb';
app.use(bodyParser.json({limit: bodyparserLimit }));
app.use(bodyParser.urlencoded({limit: bodyparserLimit, extended: true}));

// Settings - Front view
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Allow cross domain requests
app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});


// Routes
app.get('/', function ( req, res ) {
	visualResponse = res;
	displayQueueLength();
});

app.get('/alive', function(req, res) {
	res.status(200).json({ "alive" : 2007 })
});

//app.post('/', upload.array(), function ( req, res ) {
app.post('/', upload.array(), function ( req, res ) {

	var requestData = req.body;

	//console.log(req.body);

	if ( !requestData.type || requestData.type == 'POST' ) {
		expressResponse = res;
		EventDispatcher.emit( EventDispatcher.PROXY_POST, requestData, false );
	} else {
		res.status(500).json({ "error" : "Type not supported - Bifrost only handle POST Requests" });
	}
});

// display Queue Length
var displayQueueLength = function() {

	var lengthQueue = 0;
	fs.readdir( config.path.queue, function (err, files) {
		if (err) {
			lengthQueue = 0;
			visualResponse.render('index', { lengthQueue : lengthQueue });
			return;
		}

		// Filter to remove unwanted files
		files = files.filter( function(a){ return a.match(/\.txt$/); } );
		lengthQueue = files.length;

		visualResponse.render('index', { lengthQueue : lengthQueue });
	});
};


// Handle events
var onProxyPost = function( body, fromQueue ) {
	Proxy.post( body, fromQueue );
};

var onProxySuccess = function( body ) {
	if ( !responseSent ) {
		expressResponse.status(200).json( body );
		responseSent = true;
	}
};

var onProxyError = function( postData, fromQueue ) {

	if ( fromQueue ) { // Failed again - keep in queue
		if ( config.proxy.autostart ) EventDispatcher.emit( EventDispatcher.START_TIMER );
	} else
		Queue.writeFile( postData );
};

var onStartTimer = function() {
	clearTimer();
	timer.setTimeout( Queue.handle, [timer], config.proxy.timeout );
};

var onClearTimer = function() {
	clearTimer();
};

var clearTimer = function() {
	timer.clearTimeout();
};

var onFileQueued = function() {
	if ( !responseSent ) {
		expressResponse.status(200).json({ "proxy" : "saved" });
		responseSent = true;
	}
};
var onFileError = function() {
	if ( !responseSent ) {
		expressResponse.status(500).json({ "error" : "not able to save the request" });
		responseSent = true;
	}
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
	EventDispatcher.on( EventDispatcher.FILE_ERROR, onFileError );
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

