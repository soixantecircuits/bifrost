var express = require('express')
var bodyParser = require('body-parser')
var _ = require('lodash')
var path = require('path')
var multer = require('multer')
var mdns = require('mdns')

var config = require('../app/config/config.json')

var app = express()

var sequence = [
  mdns.rst.DNSServiceResolve(),
  'DNSServiceGetAddrInfo' in mdns.dns_sd ? mdns.rst.DNSServiceGetAddrInfo() : mdns.rst.getaddrinfo({families:[4]}),
  mdns.rst.makeAddressesUnique()
]
var browser = mdns.createBrowser(mdns.tcp('bifrost'), {resolverSequence: sequence})

var upload = multer({
  dest: path.join(__dirname, './uploads')
})

var failed = false

browser.on('serviceUp', function (service) {
  console.log("server.js: service up: ", service)
})

browser.on('serviceDown', function (service) {
  console.log("server.js: service down: ", service)
})

app.use(bodyParser.urlencoded({
  extended: true
}))

app.get('*', function (req, res) {
  res.send(200, 'hello test server')
})

app.post('/file', upload.any(), function (req, res) {
  console.log('test.js: POST on /file')
  if (req.files) {
    console.log('test.js: with files')
    _.forEach(req.files, function (file) {
      console.log(file.originalname)
    })
  } else {
    console.log('test.js: with empty file field')
  }
  res.status(200).send('ok')
})

app.post('/base', function (req, res) {
  console.log('test.js: POST on /base with ')
  req.data ? console.log('test.js: base64 in data field') : console.log('test.js: empty data field')

  res.status(200).send('ok')
})

app.post('/form', function (req, res) {
  console.log('test.js: POST on /form with ')
  if (req.body) {
    _.forEach(req.body, function (field) {
      console.log('test.js: field value', field)
    })
  } else {
    console.log('test.js: empty body')
  }

  res.status(200).send('ok')
})

app.post('/fail', function (req, res) {
  if (!failed) {
    console.log('test.js: POST on /fail, sending error and waiting for bifrost posting')
    failed = true
    res.status(500).send('fail')
  } else {
    console.log('test.js: request again from bifrost, sending 200')
    res.status(200).send('ok')
  }
})

app.post('/response', function (req, res) {
    console.log('test.js: getting response from bifrost')
})

app.post('/test', function (req, res) {
  console.log('POST on /test')
  res.status(200).send('ok')
})

app.listen(config.server.port, function () {
  try {
    browser.start()
  } catch (err) {
    console.log('test.js: mdns error -', err)
  }
})
