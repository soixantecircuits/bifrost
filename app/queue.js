
'use strict';

var 
	config = require('./config/config.json'),
	EventDispatcher = require('./eventDispatcher'),
	fs = require('fs'),
	fsExtra = require('fs-extra');

var Queue = function() {

	var writeFile = function( postData ) {
		
		fsExtra.ensureDir( config.path.queue, function(err) {
			if ( err ) throw err;
			writeQueuedFile( postData );
		} );
	};

	var writeQueuedFile = function ( postData ) {

		// Write file in queue
		fs.writeFile( config.path.queue + "/" + postData.timestamp + ".txt", JSON.stringify( postData ), function (err) {

			if ( err ) throw err;

			EventDispatcher.emit( EventDispatcher.START_TIMER );
			EventDispatcher.emit( EventDispatcher.FILE_QUEUED );
		});
	};

	var handle = function() {

		// List files in /app/queue
		fs.readdir( config.path.queue, function (err, files) {
			if (err) throw err;

			// Filter to remove unwanted files
			files = files.filter( function(a){ return a.match(/\.txt$/); } );
			if ( files.length == 0 ) EventDispatcher.emit( EventDispatcher.CLEAR_TIMER );

			// Retry post
			readQueuedFiles(files);
		});
	};

	var readQueuedFiles = function ( files ) {

		files.forEach( function( file ) {

			// Read file content and send post
			fs.readFile( config.path.queue + '/' + file, function (err, data) {
				if (err) throw err;
				EventDispatcher.emit( EventDispatcher.PROXY_POST, JSON.parse(data), true );
			});
		});
	};

	var deleteFile = function ( timestamp ) {
		fs.unlink( config.path.queue + '/' + timestamp + '.txt', function(err) {
			if (err) throw err;
		});
	};

	return {
		writeFile : writeFile,
		deleteFile : deleteFile,
		handle : handle
	}
};

module.exports = new Queue();

