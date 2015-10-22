
'use strict';

var
	config = require('./config/config.json'),

	events = require('events'),
	eventEmitter = new events.EventEmitter(),

	request = require('request'),
	fs = require('fs');

var Proxy = function() {

	var post = function( postData, fromQueue ) {

		var 
			url = config.proxy.url,
			date = new Date(),
			timestamp = date.getTime();

		// TEMPORARY // Add Randomness to make the request fail sometimes
		if ( Math.random() > 0.6 ) {
			url = 'http://bifrost-test.localhost:81';
		}
		// TEMPORARY //

		
		if ( !postData.timestamp ) postData.timestamp = timestamp;

		// TEMPORARY - read image from txt - final will be image from postData
		if ( !postData.image ) {
			
			fs.readFile( './app/data/gif.txt', 'utf-8', function(err, data) {
				if ( err ) throw err;

				postData.image = data;
				launchRequest( url, postData, fromQueue );
			});

		} else {

			launchRequest( url, postData, fromQueue );
		}
	};

	var launchRequest = function( url, postData, fromQueue ) {
	
		request.post( url, {form : postData}, function ( error, response, body ) {

			if (!error && response.statusCode == 200) {

				// retry from queue succeeded - delete file in queue
				if ( fromQueue ) {
					fs.unlink( pathQueue + '/' + postData.timestamp + '.txt', function(err) {
						if (err) throw err;
					});
				}
				else {
					eventEmitter.emit( 'PROXY_POST_SUCCESS', body );
				}

			} else {

				// failed - handle error
				onProxyError( postData, fromQueue );
			}
		});
	};

	var onProxyError = function( postData, fromQueue ) {

		if ( fromQueue ) {

			// Failed again - keep in queue
			if ( retryTimeout ) clearTimeout( retryTimeout );
			retryTimeout = setTimeout( handleQueue, 5000 );

		} else {

			console.log('EVENT EMIT - write queued file');
		}
	};

	return {
		post : post
	};
};

module.exports = new Proxy();
