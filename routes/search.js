var express = require('express');
var router = express.Router();
var Person = require('../models/person');
var Activity = require('../models/activity');

router.route('/all')
  .get(function(req, res, next) {
    lookup_all(req.query)
    .then(function (ret) {
      res.header("Access-Control-Allow-Origin", "*");
      res.json(ret);
    })
    .catch(function (err) {
      console.log(err);
      next(err);
    });
  });

router.route('/name')
  .get(function(req, res, next) {
    search_person(req, res, next, name_filters(req.query.q));
  });

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

router.route('/award')
  .get(function(req, res, next) {
    search_activity(req, res, next, {"doc_type" : { $in: Activity.types_award }})
  });

router.route('/service')
  .get(function(req, res, next) {
    search_activity(req, res, next, {"doc_type" : { $in: Activity.types_service }})
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

var search_person = function (req, res, next, person_filters) {
  person_filters.mergeHash(common_filters(req.query));
  console.log(person_filters['$or']);
  Person.find(person_filters)
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

var lookup_activity = async function(activity_filters, person_filters) {
  var filtered_userids = [];
  if (!person_filters.emptyHash()) {
    var people = await Person.find(person_filters, 'username');
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

var lookup_all = async function (query) {
  var person_filters = common_filters(query).mergeHash(name_filters(query.q));
  var [people, activities] = await Promise.all([
    Person.find(person_filters),
    lookup_activity({ $text: { $search: query.q || '' } }, common_filters(query))
  ]);

  var [publication, interest, grant, award] = [[],[],[],[]];
  activities.forEach(function (act) {
    if (act.type == 'profile') {
      interest.push(act);
    } else if (act.type == 'scholarly') {
      publication.push(act);
    } else if (act.type == 'award') {
      award.push(act);
    } else if (act.type == 'grant') {
      grant.push(act);
    }
  });

  return {
    name: people,
    publication: publication,
    interest: interest,
    grant: grant,
    award: award
  };
}

var common_filters = function (query) {
  var filters = {};
  if (query.dept) filters['positions.organization.department'] = query.dept;
  if (query.college) filters['positions.organization.college'] = query.college;
  return filters;
}

var name_filters = function (querystr) {
  if (!querystr) return {};
  return {
    '$or': [
      { FNAME: { $regex: '^'+RegExp.quote(querystr), $options: '-i' } },
      { LNAME: { $regex: '^'+RegExp.quote(querystr), $options: '-i' } },
      { MNAME: { $regex: '^'+RegExp.quote(querystr), $options: '-i' } }
    ]
  };
}

module.exports = router;
