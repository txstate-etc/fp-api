var express = require('express');
var router = express.Router();
var Person = require('../models/person');
var Activity = require('../models/activity');

router.route('/name')
  .get(function(req, res, next) {
    var query = req.query.q || '';
    var activities = [];

    var filters = common_filters(req.query);
    filters['$or'] = [
      { FNAME: { $regex: '^'+RegExp.quote(query) } },
      { LNAME: { $regex: '^'+RegExp.quote(query) } },
      { MNAME: { $regex: '^'+RegExp.quote(query) } }
    ];

    Person.find(filters)
    .then(function (people) {
      var ret = people.map(function (person) { return person.basic_info(); });
      res.header("Access-Control-Allow-Origin", "*");
      res.json(ret);
    })
    .catch(function(err){
      console.log(err)
      next(err)
    });
  })

router.route('/publication')
  .get(function(req, res, next) {
    var query = req.query.q || '';
    var activities = [];

    Person.find(common_filters(req.query), 'username')
    .then(function (people) {
      var userids = people.map(function (person) { return person.username });
      return Activity.find({ $text: { $search: query }, username: { $in: userids } });
    })
    .then(function (acts) {
      activities = acts;
      var userids = acts.distinct(function (act) { return act.username });
      return Person.find({
        username: { $in : userids }
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
  });

var common_filters = function (query) {
  var filters = {};
  if (query.dept) filters['positions.organization.department'] = query.dept;
  if (query.college) filters['positions.organization.college'] = query.college;
  return filters;
}

module.exports = router;
