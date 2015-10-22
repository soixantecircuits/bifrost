
'use strict';

var Queue = function() {


	/*
	fsExtra.ensureDir( pathQueue, function(err) {
		if ( err ) throw err;
		writeQueuedFile( postData );
	} );
	*/
};

module.exports = new Queue();

/*
var writeQueuedFile = function ( postData ) {
	
	// Write file in queue
	fs.writeFile( pathQueue + "/" + postData.timestamp + ".txt", JSON.stringify( postData ), function (err) {

		if ( err ) throw err;

		if ( retryTimeout ) clearTimeout( retryTimeout );
		retryTimeout = setTimeout( handleQueue, 5000 );

		expressResponse.send("Server is idle - data saved - automated retry upcoming.");
	});
};

var handleQueue = function() {

	// List files in /app/queue
	fs.readdir( pathQueue, function (err, files) {
		if (err) throw err;

		// Filter to remove unwanted files
		files = files.filter( function(a){ return a.match(/\.txt$/); } );
		if ( files.length == 0 ) clearTimeout( retryTimeout );

		// Retry post
		readQueuedFiles(files);
	});
};

var readQueuedFiles = function ( files ) {

	files.forEach( function( file ) {

		// Read file content and send post
		fs.readFile( pathQueue + '/' + file, function (err, data) {
			if (err) throw err;
			proxyPost( JSON.parse(data), true );
		});
	});
};
*/