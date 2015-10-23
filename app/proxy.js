
'use strict';

var
	config = require('./config/config.json'),

	request = require('request'),
	fs = require('fs');

var 
	retryTimeout,
	pathQueue = "./app/queue";

var Proxy = function() {

	var post = function( postData, fromQueue ) {

		var 
			url = config.proxy.url,
			date = new Date(),
			timestamp = date.getTime();
		
		if ( !postData.timestamp ) postData.timestamp = timestamp;

		// TEMPORARY // Add Randomness to make the request fail sometimes
		/*
		if ( Math.random() > 0.6 ) {
			url = 'http://bifrost-test.localhost:81';
		}
		*/
		// TEMPORARY - read image from txt - final will be image from postData
		/*
		if ( !postData.image ) {
			
			fs.readFile( './app/data/gif.txt', 'utf-8', function(err, data) {
				if ( err ) throw err;
				postData.image = data;
				launchRequest( url, postData, fromQueue );
			});

		} else {
			launchRequest( url, postData, fromQueue );
		}
		*/
		// TEMPORARY //

		// FINAL
		launchRequest( url, postData, fromQueue );
		// FINAL
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
					console.log('proxy success');
					eventEmitter.emit( 'PROXY_POST_SUCCESS', body );
				}

			} else {
				console.log('proxy error');
				eventEmitter.emit( 'PROXY_POST_ERROR', postData, fromQueue );
			}
		});
	};

	return {
		post : post
	};
};

module.exports = new Proxy();
