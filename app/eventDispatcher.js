'use strict'

var util = require('util')
var EventEmitter = require('events').EventEmitter

var EventDispatcher = function () {
  EventEmitter.call(this)

  this.PROXY_POST = 'PROXY_POST'
  this.PROXY_POST_SUCCESS = 'PROXY_POST_SUCCESS'
  this.PROXY_POST_ERROR = 'PROXY_POST_ERROR'

  this.REQUEST_QUEUED = 'REQUEST_QUEUED'
  this.SAVING_ERROR = 'SAVING_ERROR'
  this.DELETE_FROM_QUEUE = 'DELETE_FROM_QUEUE'

  this.START_TIMER = 'START_TIMER'
  this.CLEAR_TIMER = 'CLEAR_TIMER'
}

util.inherits(EventDispatcher, EventEmitter)
module.exports = new EventDispatcher()
