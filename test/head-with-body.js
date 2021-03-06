'use strict'

const t = require('tap')
const Fastify = require('fastify')
const From = require('..')
const http = require('http')
const get = require('simple-get').concat

const instance = Fastify()

t.plan(12)
t.tearDown(instance.close.bind(instance))

const target = http.createServer((req, res) => {
  t.pass('request proxied')
  t.equal(req.method, 'HEAD')
  t.equal(req.url, '/')
  t.equal(req.headers['content-length'], '0')
  t.equal(req.body, undefined)
  res.statusCode = 205
  res.setHeader('Content-Type', 'text/plain')
  res.setHeader('x-my-header', 'hello!')
  res.end('hello world')
})

instance.head('/', (request, reply) => {
  reply.from()
})

t.tearDown(target.close.bind(target))

target.listen(0, (err) => {
  t.error(err)

  instance.register(From, {
    base: `http://localhost:${target.address().port}`
  })

  instance.listen(0, (err) => {
    t.error(err)

    get({
      url: `http://localhost:${instance.server.address().port}`,
      method: 'HEAD',
      body: 'this is get body'
    }, (err, res, data) => {
      t.error(err)
      t.equal(res.headers['content-type'], 'text/plain')
      t.equal(res.headers['x-my-header'], 'hello!')
      t.equal(res.statusCode, 205)
      t.equal(data.toString(), '')
    })
  })
})
