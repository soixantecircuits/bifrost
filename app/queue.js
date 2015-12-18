'use strict'

var config = require('./config/config.json')
var EventDispatcher = require('./eventDispatcher')
var fs = require('graceful-fs')
var fsExtra = require('fs-extra')

var Queue = function () {
  var writeFile = function (postData, res) {
    fsExtra.ensureDir(config.path.queue, function (err) {
      if (err) throw err
      writeQueuedFile(postData, res)
    })
  }

  var writeQueuedFile = function (postData, res) {
    // Write file in queue
    fs.writeFile(config.path.queue + '/' + postData.timestamp + '.txt', JSON.stringify(postData), function (err) {
      if (err) {
        EventDispatcher.emit(EventDispatcher.FILE_ERROR, res)
      // throw err
      }

      if (config.proxy.autostart) EventDispatcher.emit(EventDispatcher.START_TIMER)
      EventDispatcher.emit(EventDispatcher.FILE_QUEUED, res)
    })
  }

  var handle = function () {
    // List files in /app/queue
    fs.readdir(config.path.queue, function (err, files) {
      if (err) {
        console.log('Queue is currently empty')
        return
      }

      // Filter to remove unwanted files
      files = files.filter(function (a) { return a.match(/\.txt$/) })
      console.log('Handle Queue - ', files.length)

      if (files.length === 0) {
        console.log('Clear timer and delete folder')
        deleteFolder()
        EventDispatcher.emit(EventDispatcher.CLEAR_TIMER)
      } else {
        if (config.proxy.autostart) EventDispatcher.emit(EventDispatcher.START_TIMER)
      }
      // Retry post
      readQueuedFiles(files)
    })
  }

  var readQueuedFiles = function (files) {
    files.forEach(function (file) {
      // Read file content and send post
      fs.readFile(config.path.queue + '/' + file, function (err, data) {
        if (err) throw err
        try {
          var dataParsed = JSON.parse(data)
          EventDispatcher.emit(EventDispatcher.PROXY_POST, dataParsed, true)
        } catch (err) {
          console.log(err)
        }
      })
    })
  }

  var deleteFile = function (timestamp) {
    fs.unlink(config.path.queue + '/' + timestamp + '.txt', function (err) {
      if (err) throw err
    })
  }

  var deleteFolder = function () {
    fsExtra.remove(config.path.queue, function (err) {
      if (err) throw err
    })
  }

  return {
    writeFile: writeFile,
    deleteFile: deleteFile,
    handle: handle
  }
}

module.exports = new Queue()
