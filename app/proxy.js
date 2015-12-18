'use strict'

var config = require('./config/config.json')
var EventDispatcher = require('./eventDispatcher')
var request = require('request')
var querystring = require('querystring')
var fs = require('graceful-fs')
var _ = require('lodash')

var Proxy = function () {
  var post = function (postData, fromQueue, res) {
    if (fromQueue) {
      console.log('post from proxy - queue')
    } else {
      console.log('post from Proxy')
    }

    var url = postData.url || config.proxy.url
    var date = new Date()
    var timestamp = date.getTime()

    if (!postData.timestamp) postData.timestamp = timestamp

    if (config.dev.mode) {
      // DEV MODE
      var devURL = config.dev.url

      fs.readFile('./test/request.txt', 'utf-8', function (err, data) {
        if (err) throw err

        postData = {}
        postData.url = devURL
        postData.type = 'POST'
        postData.data = JSON.parse(data).data

        launchRequest(devURL, postData, fromQueue, res)
      })
    } else {
      // PROD MODE
      postData.url = url
      postData.type = 'POST'

      launchRequest(url, postData, fromQueue, res)
    }
  }

  // Perform proxy request
  var launchRequest = function (url, postData, fromQueue, res) {
    console.log('proxy.js - launchRequest: ', url)

    postData.formData = postData.formData || querystring.parse(postData.data) ||
      _.omit(postData, 'url')
    if (Object.keys(postData.formData).length < 1) {
      postData.formData = _.omit(postData, 'url')
    }

    console.log('proxy.js - postData.formData:', postData.formData)

    request.post(url, {
      form: postData.formData
    }, function (error, response, body) {
      if (!error && response && response.statusCode === 200) {
        // retry from queue succeeded - delete file in queue
        if (fromQueue) {
          console.log('success + deleted')
          EventDispatcher.emit(EventDispatcher.DELETE_FROM_QUEUE, postData.timestamp)
        } else {
          console.log('success')
          console.log('request respond with body: ', body)
          EventDispatcher.emit(EventDispatcher.PROXY_POST_SUCCESS, body, res)
        }
      } else {
        console.log('fail - but saved')
        console.log(body)
        EventDispatcher.emit(EventDispatcher.PROXY_POST_ERROR, postData, fromQueue, res)
      }
    })
  }

  return {
    post: post
  }
}

module.exports = new Proxy()
