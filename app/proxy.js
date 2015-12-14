'use strict';

var
config = require('./config/config.json'),
  EventDispatcher = require('./eventDispatcher'),
  request = require('request'),
  querystring = require('querystring'),
  fs = require('graceful-fs'),
  _ = require('lodash');

var Proxy = function() {

  var post = function(postData, fromQueue, res) {
    if (fromQueue) {
      console.log('post from proxy - queue');
    } else {
      console.log('post from Proxy');
    }

    var
    url = postData.url || config.proxy.url,
      data = postData.data || postData,
      date = new Date(),
      timestamp = date.getTime();

    if (!postData.timestamp) postData.timestamp = timestamp;

    // DEV MODE
    if (config.dev.mode) {

      var url = "http://coca-bercy.bonhommestudio.com/api/gif/";

      fs.readFile('./test/request.txt', 'utf-8', function(err, data) {
        if (err) throw err;

        postData = {};
        postData.url = url;
        postData.type = 'POST';
        postData.data = JSON.parse(data).data;

        launchRequest(url, postData, fromQueue, res);
      });

    }
    // PRODUCTION MODE
    else {

      postData.url = url;
      postData.type = 'POST';

      launchRequest(url, postData, fromQueue, res);
    }
  };

  // Perform proxy request
  var launchRequest = function(url, postData, fromQueue, res) {

    console.log('proxy.js - launchRequest: ', url);

    postData.formData = postData.formData || querystring.parse(postData.data) ||
      _.omit(postData, 'url');
    if (Object.keys(postData.formData).length < 1) {
      postData.formData = _.omit(postData, 'url');
    }

    console.log('proxy.js - postData.formData:', postData.formData);

    request.post(url, {
      form: postData.formData
    }, function(error, response, body) {

      if (!error && response && response.statusCode == 200) {

        // retry from queue succeeded - delete file in queue
        if (fromQueue) {
          console.log("success + deleted");
          EventDispatcher.emit(EventDispatcher.DELETE_FROM_QUEUE, postData.timestamp);
        } else {
          console.log("success");
          console.log("request respond with body: ", body);
          EventDispatcher.emit(EventDispatcher.PROXY_POST_SUCCESS, body, res);
        }

      } else {
        console.log("fail - but saved");
        console.log(body);
        EventDispatcher.emit(EventDispatcher.PROXY_POST_ERROR, postData, fromQueue, res);
      }
    });
  };

  return {
    post: post
  };
};

module.exports = new Proxy();