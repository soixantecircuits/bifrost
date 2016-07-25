'use strict'

var config = require('./config/config.json')
var EventDispatcher = require('./eventDispatcher')

var queue = require('async').queue
var path = require('path')
var Datastore = require('nedb')
var db = new Datastore({filename: path.join(__dirname, config.queue.path, config.queue.name)})

db.loadDatabase()

var Queue = function () {
  var saveRequest = function (postData, res) {
    postData.timeStamp = postData.timeStamp || Date.now()
    db.insert({timestamp: postData.timeStamp, postData: postData}, function (err, newDoc) {
      if (err) {
        EventDispatcher.emit(EventDispatcher.SAVING_ERROR, res)
      }
      if (config.proxy.autostart) {
        EventDispatcher.emit(EventDispatcher.START_TIMER)
      }
      EventDispatcher.emit(EventDispatcher.REQUEST_QUEUED, res)
    })
  }

  var handle = function () {
    // List files in /app/queue
    db.find({}, function (err, requests) {
      if (err) {
        console.log('queue.js - queue is currently empty')
        return
      }
      if (requests.length) {
        if (config.proxy.autostart) {
          EventDispatcher.emit(EventDispatcher.START_TIMER)
        }
      } else {
        console.log('queue.js - clear timer')
        EventDispatcher.emit(EventDispatcher.CLEAR_TIMER)
      }

      var requestQueue = queue(function (task, callback) {
        callback()
      }, 1)

      requestQueue.drain = function () {
        console.log('all requests have been processed')
      }

      requests.forEach(function (request) {
        requestQueue.push(request, function (err) {
          if (err) {
            throw err
          }
        })
        EventDispatcher.emit(EventDispatcher.PROXY_POST, request.postData, true)
      })
    })
  }

  var removeRequest = function (timestamp) {
    db.remove({timestamp: timestamp}, {}, function (err, numRemoved) {
      if (err) {
        throw err
      }
    })
  }
  
  var totalCount = function () {
    return new Promise(function (resolve, reject) {
      db.count({}, function (err, count) {
        if (err) {
          reject(err)
        } else {
          resolve(count)
        }
      })
    })
  }

  return {
    saveRequest: saveRequest,
    removeRequest: removeRequest,
    totalCount: totalCount,
    handle: handle
  }
}

module.exports = new Queue()
