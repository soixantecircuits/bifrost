var fs = require('fs')
var FormData = require('form-data')
var request = require('request')

var config = require('../app/config/config.json')



console.log('posting application/x-www-form-urlencoded (URL-Encoded Forms) request: ')

request.post({
  url: config.proxy.url + ':' + config.proxy.port,
  method: 'POST',
  form: {
    url: config.server.url + ':' + config.server.port + '/form', //optional
    hello: 'test1',
    test: 'test2'
  }
}, function (err, response, body) {
  if (err) {
    console.log(err)
  } else {
    console.log(response.statusCode, response.statusMessage)
  }
})



console.log('posting multipart/form-data (Multipart Form Uploads) request: ')

var formData = {
  url: config.server.url + ':' + config.server.port + '/form', //optional
  id: "imageTest",
  img: "data:image/png;base64,iVBOR......."
}

request.post({
  url: config.proxy.url + ':' + config.proxy.port,
  formData: formData
}, function (err, response, body) {
  if (err) {
    console.log(err)
  } else {
    console.log(response.statusCode, response.statusMessage)
  }
})
//
// var form = new FormData()
// form.append('url', config.server.url + ':' + config.server.port + '/file')
// form.append('bifrost', fs.createReadStream(path.join(__dirname, '/Bifrost.jpg')))
//
// form.getLength(function (err, length) {
//   if (err) {
//     return requestCallback(err);
//   }
//
//   var r = request.post(config.proxy.url + ':' + config.proxy.port, requestCallback)
//   r._form = form
//   r.setHeader('content-length', length)
//   r.setHeader('content-type', 'form-data')
// })
//
// function requestCallback(err, res, body) {
//   console.log(body);
// }