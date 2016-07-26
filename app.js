var Proxy = require('./app/proxy')
var Queue = require('./app/queue')
var EventDispatcher = require('./app/eventDispatcher')
var pjson = require('./package.json')
var config = require('./app/config/config.json')

var express = require('express')
var bodyParser = require('body-parser')
var ip = require('ip')
var _ = require('lodash')
var path = require('path')
var mdns = require('mdns')
var moment = require('moment')
var NanoTimer = require('nanotimer')
var multer = require('multer')
var upload = multer({
  dest: path.join(__dirname, config.uploads.path)
})

var visualResponse
var pendingRequests = []
var timer = new NanoTimer()

var app = express()
app.locals.moment = moment

app.use(bodyParser.json({
  limit: config.proxy.bodyparserlimit
}))

app.use(bodyParser.urlencoded({
  limit: config.proxy.bodyparserlimit,
  extended: true
}))

app.use(express.static('public'))
app.set('views', path.join(__dirname, '/public/views'))
app.set('view engine', 'ejs')

// Allow cross domain requests
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept')
  next()
})

app.get('/', function (req, res) {
  visualResponse = res
  displayPageInfo()
})

app.get('/alive', function (req, res) {
  res.status(200).json({
    'alive': 2007
  })
})

app.post('/', upload.any(), function (req, res) {
  var requestData = req.body

  if (req.files) {
    requestData.files = []
    _.forEach(req.files, function (file) {
      requestData.files.push({
          path: file.path,
          fieldname: file.fieldname,
          originalname: file.originalname
      })
    })
  }

  if (!requestData.type || requestData.type === 'POST') {
    requestData.origin = req.headers.origin
    EventDispatcher.emit(EventDispatcher.PROXY_POST, requestData, false, res)
  } else {
    res.status(500).json({
      'error': 'Type not supported - Bifrost only handle POST Requests'
    })
  }
})

var displayPageInfo = function () {
  Queue.totalCount().then(function result (count) {
    visualResponse.render('index', {
      lengthQueue: count,
      pendingQueue: pendingRequests
    })
  }, function error (err) {
    console.error(err.message)
  })
}

// Event handlers
var onProxyPost = function (body, fromQueue, res) {
  Proxy.post(body, fromQueue, res)
}

var onProxySuccess = function (body, res) {
  res.status(200).json(body)
}

var onProxyError = function (postData, fromQueue, response, res) {

  pendingRequests.push({
    origin: postData.origin,
    timestamp: postData.timeStamp,
    reason: postData.reason,
    status: response ? response.statusCode : 'server not found'
  })

  if (fromQueue) {// Failed again - keep in queue
    if (config.proxy.autostart) {
      EventDispatcher.emit(EventDispatcher.START_TIMER)
    }
  } else {
    Queue.saveRequest(postData, res)
  }
}

var onStartTimer = function () {
  clearTimer()
  timer.setTimeout(Queue.handle, [timer], config.proxy.timeout)
}

var onClearTimer = function () {
  clearTimer()
}

var clearTimer = function () {
  if (timer) {
    timer.clearTimeout()
  }
}

var onRequestQueued = function (res) {
  res.status(200).json({
    'proxy': 'saved'
  })
}

var onSavingError = function (res) {
  res.status(500).json({
    'error': 'not able to save the request'
  })
}

var onRequestRemove = function (timestamp) {
  Queue.removeRequest(timestamp)
}

function handleError (error) {
  switch (error.errorCode) {
    case mdns.kDNSServiceErr_Unknown:
      console.warn(error)
      break
    default:
      throw error
  }
}

var server = app.listen(config.server.port, function () {
  EventDispatcher.on(EventDispatcher.PROXY_POST, onProxyPost)
  EventDispatcher.on(EventDispatcher.PROXY_POST_SUCCESS, onProxySuccess)
  EventDispatcher.on(EventDispatcher.PROXY_POST_ERROR, onProxyError)

  EventDispatcher.on(EventDispatcher.REQUEST_QUEUED, onRequestQueued)
  EventDispatcher.on(EventDispatcher.SAVING_ERROR, onSavingError)
  EventDispatcher.on(EventDispatcher.DELETE_FROM_QUEUE, onRequestRemove)

  EventDispatcher.on(EventDispatcher.START_TIMER, onStartTimer)
  EventDispatcher.on(EventDispatcher.CLEAR_TIMER, onClearTimer)

  var port = server.address().port

  console.log('  ____  _  __               _   ')
  console.log(' |  _ \\(_)/ _|             | |  ')
  console.log(' | |_) |_| |_ _ __ ___  ___| |_ ')
  console.log(" |  _ <| |  _| '__/ _ \\/ __| __|")
  console.log(' | |_) | | | | | | (_) \\__ | |_ ')
  console.log(' |____/|_|_| |_|  \\___/|___/\\__|')
  console.log('                                ')
  console.log('                                ')
  console.log('%s %s is running on http://%s:%s', pjson.name, pjson.version,
      ip.address(), port)

  try {
    var ad = mdns.createAdvertisement(mdns.tcp('bifrost'), port)
    ad.on('error', handleError)
    ad.start()
  } catch (ex) {
    handleError(ex)
  }

  Queue.handle()
})
