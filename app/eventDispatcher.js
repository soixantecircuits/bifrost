
'use strict';

var
	util = require('util'),
	EventEmitter = require('events').EventEmitter;

var EventDispatcher = function () {
	EventEmitter.call(this);

	this.PROXY_POST = 'PROXY_POST';
	this.PROXY_POST_SUCCESS = 'PROXY_POST_SUCCESS';
	this.PROXY_POST_ERROR = 'PROXY_POST_ERROR';

	this.FILE_QUEUED = 'FILE_QUEUED';
	this.FILE_ERROR = 'FILE_ERROR';
	this.DELETE_FROM_QUEUE = 'DELETE_FROM_QUEUE';

	this.START_TIMER = 'START_TIMER';
	this.CLEAR_TIMER = 'CLEAR_TIMER';
};

util.inherits( EventDispatcher, EventEmitter );
module.exports = new EventDispatcher();
