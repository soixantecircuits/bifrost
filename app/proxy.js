'use strict'

var config = require('./config/config.json')
var EventDispatcher = require('./eventDispatcher')
var request = require('request')
var querystring = require('querystring')
var _ = require('lodash')

var Proxy = function () {
  var post = function (postData, fromQueue, res) {
    if (fromQueue) {
      console.log('proxy.js - post from proxy - queue')
    } else {
      console.log('proxy.js - post from proxy')
    }

    var url = postData.url || config.proxy.url
    postData.timeStamp = postData.timeStamp || new Date().getTime()

    if (config.dev.mode) {
      // DEV MODE
      // var devURL = config.dev.url
      var devURL = url

      // fs.readFile('./test/request.txt', 'utf-8', function (err, data) {
      //   if (err) throw err

      // postData = {}
      // postData.url = devURL
      // postData.type = 'POST'

      postData.url = url
      postData.type = 'POST'
      postData.reason = 'dev'
      
      // try {
      //   postData.data = JSON.parse(data).data
      // } catch (error) {
      //   console.error("proxy.js - parse error", error)
      // }
        
      launchRequest(devURL, postData, fromQueue, res)
    // })
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

    request.post(url, {
      form: postData.formData
    }, function (error, response, body) {
      if (!error && response && response.statusCode === 200) {
        if (fromQueue) {
          console.log('proxy.js - success + deleted')
          EventDispatcher.emit(EventDispatcher.DELETE_FROM_QUEUE, postData.timestamp)
        } else {
          console.log('proxy.js - success')
          console.log('proxy.js - request respond ')
          EventDispatcher.emit(EventDispatcher.PROXY_POST_SUCCESS, body, res)
        }
      } else {
        console.log('proxy.js - fail - but saved')
        EventDispatcher.emit(EventDispatcher.PROXY_POST_ERROR, postData, fromQueue, response, res)
      }
    })
  }

  return {
    post: post
  }
}

module.exports = new Proxy()
