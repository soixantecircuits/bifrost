var express = require('express')
var bodyParser = require('body-parser')
var _ = require('lodash')
var path = require('path')
var multer = require('multer')

var app = express()
var upload = multer({
  dest: path.join(__dirname, './uploads')
})

var failed = false

app.use(bodyParser.urlencoded({
  extended: true
}))

app.get('*', function (req, res) {
  res.send(200, 'hello test server')
})

app.post('/file', upload.any(), function (req, res) {
  console.log('POST on /file')
  if (req.files) {
    console.log('with files')
    _.forEach(req.files, function (file) {
      console.log(file.originalname)
    })
  } else {
    console.log('with empty file field')
  }
  res.status(200).send('ok')
})

app.post('/base', function (req, res) {
  console.log('POST on /base with ')
  req.data ? console.log('base64 in data field') : console.log('empty data field')

  res.status(200).send('ok')
})

app.post('/form', function (req, res) {
  console.log('POST on /form with ')
  if (req.body) {
    _.forEach(req.body, function (field) {
      console.log('field value', field)
    })
  } else {
    console.log('empty body')
  }

  res.status(200).send('ok')
})

app.post('/fail', function (req, res) {
  if (!failed) {
    console.log('POST on /fail, sending error and waiting for bifrost posting')
    failed = true
    res.status(500).send('fail')
  } else {
    console.log('request again from bifrost, sending 200')
    res.status(200).send('ok')
  }
})

app.post('/response', function (req, res) {
    console.log('getting response from bifrost')
})

app.post('/test', function (req, res) {
  console.log('POST on /test')
  res.status(200).send('ok')
})

app.listen(5656)
