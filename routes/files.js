var express = require('express');
var router = express.Router();
var Person = require('../models/person');
var Activity = require('../models/activity');
var fs = require('fs');
var Path = require('path');

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

var serve_file = function (req, res, path, filename) {
  return new Promise(function(resolve, reject) {
    var filepath = global.dm_files_path+path;
    if (!filename) filename = Path.basename(path);
    res.setHeader('Content-Disposition', 'attachment;filename='+filename);
    var ifsince = new Date(req.headers['if-modified-since'])
    fs.stat(filepath, function (err, stats) {
      if (err) return reject(err)
      var modtime = stats.mtime
      if (ifsince.isValid() && modtime <= ifsince) {
        res.sendStatus(304);
        resolve(true);
      } else {
        res.setHeader('Last-Modified', new Date());
        var stream = fs.createReadStream(filepath);
        stream.on('error', function (err) { reject(err) });
        stream.on('readable', resolve);
        stream.pipe(res);
      }
    });
  })
}

module.exports = router;
