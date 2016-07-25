var express = require('express')
var app = express()

app.get('*', function (req, res) {
  res.send(200, 'hello test server')
})

app.post('/', function (req, res) {
  console.log('POST on /')
  res.send(200, 'ok')
})

app.post('/test', function (req, res) {
  console.log('POST on /test')
  res.send(200, 'ok')
})

app.listen(5656)
