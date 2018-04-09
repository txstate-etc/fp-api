var express = require('express');
var router = express.Router();
var Person = require('../models/person');
var Activity = require('../models/activity');

router.route('/')
  .get(function(req, res, next) {
    var query = req.query.q || '';
    Activity.find({ $text: { $search: query } })
    .then(function (activities) {
      var ret = activities.map(function (act) { return act.translate(); });
      res.header("Access-Control-Allow-Origin", "*");
      res.json(ret)
    })
    .catch(function(err){
      console.log(err)
      next(err)
    });
  })

module.exports = router;
