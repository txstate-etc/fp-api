var express = require('express');
var router = express.Router();
var Person = require('../models/person');
var Activity = require('../models/activity');
var fs = require('fs');
var Path = require('path');
var fileTypePromise = import('file-type');
var readChunkPromise = import('read-chunk');

router.route('/cv/:userid/:filename')
  .get(function(req, res, next) {
    Person.findOne({user_id: req.params.userid})
    .then(function (person) {
      if (!person || !person.UPLOAD_VITA) res.sendStatus(404)
      else return serve_file(req, res, person.UPLOAD_VITA, req.params.filename)
    })
    .catch(function (err) {
      console.log(err)
      next(err)
    })
  })

router.route('/photo/:userid/:filename')
  .get(function(req, res, next) {
    Person.findOne({user_id: req.params.userid})
    .then(function (person) {
      if (!person || !person.UPLOAD_PHOTO) res.sendStatus(404)
      else return serve_file(req, res, person.UPLOAD_PHOTO, req.params.filename)
    })
    .catch(function (err) {
      console.log(err)
      next(err)
    })
  })

router.route('/attachment/:activityid/:filename')
  .get(function(req, res, next) {

  })

var serve_file = async function (req, res, path, filename) {
  var filepath = global.dm_files_path+path
  if (!filename) filename = Path.basename(path)

  var ifsince = new Date(req.headers['if-modified-since'])
  var stats = await file_stat(filepath)
  var modtime = stats.mtime

  if (ifsince.isValid() && modtime <= ifsince) {
    res.sendStatus(304)
  } else {
    res.setHeader('Last-Modified', new Date())

    var readChunk = await readChunkPromise
    var fileType = await fileTypePromise
    var buffer = await readChunk.readChunk(filepath, { start: 0, length: 4100 })
    var data = await fileType.fileTypeFromBuffer(buffer)
    res.setHeader('Content-Type', data.mime)
    var disposition = data.mime.startsWith('image/') ? 'inline' : 'attachment'
    res.setHeader('Content-Disposition', disposition+';filename='+filename)
    res.setHeader('Content-Length', stats.size)

    var stream = fs.createReadStream(filepath)
    stream.on('error', e => { console.error(e); res.end() })
    stream.pipe(res)
  }
}

var file_stat = function (filepath) {
  return new Promise(function (resolve, reject) {
    fs.stat(filepath, function (err, stats) {
      if (err) return reject(err)
      return resolve(stats)
    })
  })
}

module.exports = router;
