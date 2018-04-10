var express = require('express');
var router = express.Router();
var Person = require('../models/person');
var Activity = require('../models/activity');

router.route('/')
  .get(function(req, res, next) {
    var query = req.query.q || '';
    var activities = [];
    Activity.find({ $text: { $search: query } })
    .then(function (acts) {
      activities = acts;
      var userids = acts.distinct(function (act) { return act.username });
      return Person.find({
        "username": { $in : userids }
      });
    })
    .then(function (people) {
      var peoplehash = people.reduce(function (map, person) {
        map[person.username] = person.basic_info();
        return map;
      }, {});
      var ret = activities.map(function (act) {
        var activity = act.translate();
        activity.person = peoplehash[act.username];
        return activity;
      });
      res.header("Access-Control-Allow-Origin", "*");
      res.json(ret)
    })
    .catch(function(err){
      console.log(err)
      next(err)
    });
  })

module.exports = router;
