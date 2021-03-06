var resolve = require("path").resolve
var createReadStream = require("graceful-fs").createReadStream
var readFileSync = require("graceful-fs").readFileSync

var tap = require("tap")
var cat = require("concat-stream")

var server = require("./lib/server.js")
var common = require("./lib/common.js")

var tgz = resolve(__dirname, "./fixtures/underscore/1.3.3/package.tgz")

tap.test("basic fetch with scoped always-auth disabled", function (t) {
  server.expect("/underscore/-/underscore-1.3.3.tgz", function (req, res) {
    t.equal(req.method, "GET", "got expected method")
    t.notOk(req.headers.authorization, "received no auth header")

    res.writeHead(200, {
      "content-type"     : "application/x-tar",
      "content-encoding" : "gzip"
    })

    createReadStream(tgz).pipe(res)
  })

  var nerfed = "//localhost:" + server.port + "/:"
  var configuration = {}
  configuration[nerfed + "username"]    = "username"
  configuration[nerfed + "_password"]   = new Buffer("%1234@asdf%").toString("base64")
  configuration[nerfed + "email"]       = "i@izs.me"
  configuration[nerfed + "always-auth"] = false

  var client = common.freshClient(configuration)
  client.fetch(
    "http://localhost:1337/underscore/-/underscore-1.3.3.tgz",
    null,
    function (er, res) {
      t.ifError(er, "loaded successfully")

      var sink = cat(function (data) {
        t.deepEqual(data, readFileSync(tgz))
        t.end()
      })

      res.on("error", function (error) {
        t.ifError(error, "no errors on stream")
      })

      res.pipe(sink)
    }
  )
})
