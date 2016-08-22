var _ = require('lodash')
var fs = require('fs-extra')
var request = require('supertest')
var newman = require('newman')
var mdns = require('mdns')

var config = require('../app/config/config.json')
var collectionJson = require('./bifrost.json', 'utf8')
request = request(config.proxy.url + ':' + config.proxy.port)
var remoteUrl = config.server.url + ':' + config.server.port + '/'

newmanOptions = {
  iterationCount: 2000,
  asLibrary: true,
  stopOnError: true,
  noSummary: true
}

describe('bifrost', function () {
  it('is alive', function (done) {
    request
      .get('/alive')
      .expect(200, {
        alive: 2007
      }, done)
  })

  it('is saving bad request', function (done) {
    request
      .post('/')
      .field('url', remoteUrl + 'noroute')
      .expect(200, {
        proxy: 'saved'
      }, done)
  })

  it('is sending request fine', function (done) {
    request
      .post('/')
      .field('url', remoteUrl + 'form')
      .field('test', 'value')
      .expect(200, '"ok"', done)
  })

  it('can handle 2000 requests', function (done) {
    this.timeout(0)
    newman.execute(collectionJson, newmanOptions, done)
  })
})

