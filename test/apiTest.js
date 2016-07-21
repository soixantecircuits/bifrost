var express = require('express')
var app = express()

app.get('*', (req, res) => res.send(200, 'bonjour'))
app.post('/', function (req, res) {
  console.log('POST on /')
  res.send(200, 'bonjour')
})
app.post('/test', function (req, res) {
  console.log('POST on /test')
  res.send(200, 'bonjour')
})

app.listen(5656)
