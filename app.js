// Require
var 
	pjson = require('./package.json'),
	config = require('./app/config/config.json'),
	
	ip = require('ip'),
	fs = require('fs'),
	request = require('request'),
	bodyParser = require('body-parser'),
	express = require('express');

// Variables
var 
	pathQueue = "./app/queue",
	expressResponse,
	retryTimeout;

// Proxy
var proxyPost = function( postData, fromQueue ) {

	var 
		url = config.proxy.url,
		date = new Date(),
		timestamp = date.getTime();

	if ( !postData.timestamp ) postData.timestamp = timestamp;

	// TEMPORARY // Add Randomness to make the request fail sometimes
	if ( Math.random() > 0.8 ) {
		url = 'http://bifrost-test.localhost:81';
	}
	// TEMPORARY //
	
	request.post( url, {form : postData}, function ( error, response, body ) {

		if (!error && response.statusCode == 200) {

			// console.log( "data posted", postData );

			if ( fromQueue ) {
				fs.unlink( pathQueue + '/' + postData.timestamp + '.txt', function(err) {
					if (err) throw err;
				});
			}
			else expressResponse.send( body );

		} else {
			onProxyError( postData, fromQueue );
		}
	});
};

var onProxyError = function( postData, fromQueue ) {

	if ( fromQueue ) {

		if ( retryTimeout ) clearTimeout( retryTimeout );
		retryTimeout = setTimeout( handleQueue, 5000 );

	} else {

		fs.writeFile( pathQueue + "/" + postData.timestamp + ".txt", JSON.stringify( postData ), function (err) {

			if ( err ) throw err;

			if ( retryTimeout ) clearTimeout( retryTimeout );
			retryTimeout = setTimeout( handleQueue, 5000 );

			expressResponse.send("Server is idle - data saved - automatic retry later");
		});
	}
};

var handleQueue = function() {

	// TODO List files in queue
	fs.readdir( pathQueue, function (err, files) {
		if (err) throw err;

		// console.log("Handle Queue", files, files.length);

		files = files.filter( function(a){ return a.match(/\.txt$/); } );
		if ( files.length == 0 ) clearTimeout( retryTimeout );
		readQueuedFiles(files);
	});
	// JSON.parse
};

var readQueuedFiles = function ( files ) {

	files.forEach( function( file ) {

		fs.readFile( pathQueue + '/' + file, function (err, data) {
			if (err) throw err;
			proxyPost( JSON.parse(data), true );
		});
	});
};

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
	proxyPost( req.body, false );
});


// Start server
var server = app.listen(3000, function () {
	
	var port = server.address().port;
	console.log('%s %s is running on http://%s:%s', pjson.name, pjson.version, ip.address(), port);
});

