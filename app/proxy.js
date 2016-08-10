'use strict'

var config = require('./config/config.json')
var EventDispatcher = require('./eventDispatcher')
var request = require('request')
var querystring = require('querystring')
var _ = require('lodash')
var fs = require('fs')

var Proxy = function () {
  var post = function (postData, fromQueue, res) {
    if (fromQueue) {
      console.log('proxy.js - post from proxy - queue')
    } else {
      console.log('proxy.js - post from proxy')
    }

    var url = postData.url || config.server.url + ':' + config.server.port
    postData.timeStamp = postData.timeStamp || new Date().getTime()

    if (config.dev.mode) {
      // DEV MODE

      postData = {}
      postData.type = 'POST'
      postData.url = config.dev.url
      postData.reason = 'dev'

      launchRequest(devURL, postData, fromQueue, res)
    } else {
      // PROD MODE
      postData.url = url

      launchRequest(url, postData, fromQueue, res)
    }
  }

  // Perform proxy request
  var launchRequest = function (url, postData, fromQueue, res) {
    console.log('proxy.js - launchRequest: ', url)
    
    postData.formData = postData.formData || querystring.parse(postData.data)

    if (Object.keys(postData.formData).length < 1) {
      postData.formData = _.omit(postData, 'url')
    }

    var options = {}

    if (!postData.files || postData.files && !postData.files.length) {
      options = { form: postData.formData }
    }
    
    var postReq = request.post(url, options, function (error, response, body) {
      if (!error && response && response.statusCode === 200) {
        if (fromQueue) {
          console.log('proxy.js - success + deleted')
          EventDispatcher.emit(EventDispatcher.DELETE_FROM_QUEUE, postData.timeStamp)
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
    
    if (postData.files && postData.files.length) {
      var form = postReq.form()
      _.forEach(postData.files, function (file) {
          form.append(file.fieldname, fs.createReadStream(file.path), {filename: file.originalname})
      })
    }
  }

  return {
    post: post
  }
}

module.exports = new Proxy()
