
'use strict';

var
	config = require('./config/config.json'),
	EventDispatcher = require('./eventDispatcher'),
	request = require('request'),
	fs = require('graceful-fs');

var Proxy = function () {

	var post = function( postData, fromQueue ) {

		var 
			date = new Date(),
			timestamp = date.getTime();
		
		if ( !postData.timestamp ) postData.timestamp = timestamp;

		// DEV MODE
		if ( config.dev.mode ) {

			// Add Randomness to make the request fail sometimes
			if ( Math.random() > config.dev.success ) {
				url = 'http://bifrost-test.localhost:81';
			}
			
			// Read image from txt - final will be image from postData
			if ( config.dev.image ) {
				if ( !postData.image ) {
					
					fs.readFile( './app/data/gif.txt', 'utf-8', function(err, data) {
						if ( err ) throw err;
						postData.image = data;
						launchRequest( url, postData, fromQueue );
					});

				} else {
					launchRequest( url, postData, fromQueue );
				}
			} else {
				launchRequest( url, postData, fromQueue );
			}

		} 
		// PRODUCTION MODE
		else {
			launchRequest( postData.url, postData.data, fromQueue );
		}
	};

	// Perform proxy request
	var launchRequest = function( url, postData, fromQueue ) {

		request.post( url, {form : postData}, function ( error, response, body ) {

			if (!error && response.statusCode == 200) {

				// retry from queue succeeded - delete file in queue
				if ( fromQueue ) EventDispatcher.emit( EventDispatcher.DELETE_FROM_QUEUE, postData.timestamp );
				else EventDispatcher.emit( EventDispatcher.PROXY_POST_SUCCESS, body );

			} else EventDispatcher.emit( EventDispatcher.PROXY_POST_ERROR, postData, fromQueue );
		});
	};

	return {
		post : post
	};
};

module.exports = new Proxy();
