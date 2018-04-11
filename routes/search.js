var express = require('express');
var router = express.Router();
var Person = require('../models/person');
var Activity = require('../models/activity');

router.route('/name')
  .get(function(req, res, next) {
    var person_filters = {
      '$or': [
        { FNAME: { $regex: '^'+RegExp.quote(query) } },
        { LNAME: { $regex: '^'+RegExp.quote(query) } },
        { MNAME: { $regex: '^'+RegExp.quote(query) } }
      ]
    };

    search_person(req, res, next, person_filters);
  })

router.route('/interest')
  .get(function(req, res, next) {
    search_activity(req, res, next, {'doc_type': Activity.type_profile})
  });

router.route('/publication')
  .get(function(req, res, next) {
    search_activity(req, res, next, {"doc_type" : { $in: Activity.types_scholarly }})
  });

router.route('/grant')
  .get(function(req, res, next) {
    search_activity(req, res, next, {"doc_type" : { $in: Activity.types_grant }})
  });

var search_activity = function (req, res, next, activity_filters) {
  var query = req.query.q || '';
  activity_filters['$text'] = { $search: query };
  lookup_activity(activity_filters, common_filters(req.query))
  .then(function (ret) {
    res.header("Access-Control-Allow-Origin", "*");
    res.json(ret);
  })
  .catch(function(err){
    console.log(err)
    next(err)
  });
}

var lookup_activity = async function(activity_filters, person_filters) {
  var filtered_userids = [];
  if (!person_filters.emptyHash()) {
    var people = await Person.find(common_filters(req.query), 'username');
    filtered_userids = people.map(function (person) { return person.username });
  }
  if (filtered_userids.length > 0) activity_filters['username'] = { $in: filtered_userids };

  var acts = await Activity.find(activity_filters);
  var userids = acts.distinct(function (act) { return act.username });
  var people = await Person.find({ username: { $in : userids } });

  var peoplehash = people.reduce(function (map, person) {
    map[person.username] = person.basic_info();
    return map;
  }, {});

  return acts.map(function (act) {
    var activity = act.translate();
    activity.person = peoplehash[act.username];
    return activity;
  });
}

var search_person = function (req, res, next, person_filters) {
  var query = req.query.q || '';
  var activities = [];

  var filters = Object.assign({}, common_filters(req.query), person_filters);

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
}

var common_filters = function (query) {
  var filters = {};
  if (query.dept) filters['positions.organization.department'] = query.dept;
  if (query.college) filters['positions.organization.college'] = query.college;
  return filters;
}

module.exports = router;
