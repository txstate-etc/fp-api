var express = require('express');
var router = express.Router();
var Person = require('../models/person');
var Activity = require('../models/activity');

router.route('/all')
  .get(function(req, res, next) {
    lookup_all(req.query)
    .then(function (ret) {
      res.json(ret);
    })
    .catch(function (err) {
      console.log(err);
      next(err);
    });
  });

router.route('/list')
  .get(function(req, res, next) {
    var person_filters = common_filters(req.query)
    var [skip, limit] = skip_limit(req.query);
    Promise.all([
      Person.find(person_filters).count(),
      lookup_person(person_filters, 0, limit)
    ])
    .then(function (results) {
      var [people_count, people] = results
      res.json({
        total: people_count,
        results: people
      })
    })
    .catch(function (err) {
      console.log(err)
      next(err)
    })
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
  var [skip, limit] = skip_limit(req.query);
  activity_filters['$text'] = { $search: query };
  lookup_activity(activity_filters, common_filters(req.query), skip, limit)
  .then(function (ret) {
    res.json(ret);
  })
  .catch(function(err){
    console.log(err)
    next(err)
  });
}

var search_person = function (req, res, next, person_filters) {
  var [skip, limit] = skip_limit(req.query);
  person_filters.mergeHash(common_filters(req.query));
  lookup_person(person_filters, skip, limit)
  .then(function (people) {
    res.json(people);
  })
  .catch(function(err){
    console.log(err)
    next(err)
  });
}

var lookup_person = async function(person_filters, skip = 0, limit = 100) {
  var people = await Person.find(person_filters).skip(skip).limit(limit)
  return people.map(function (person) { return person.basic_info() })
}

var lookup_activity = async function(activity_filters, person_filters, skip = 0, limit = 100) {
  var filtered_userids = [];
  if (!person_filters.emptyHash()) {
    var people = await Person.find(person_filters, 'user_id');
    filtered_userids = people.map(function (person) { return person.user_id });
  }
  if (filtered_userids.length > 0) activity_filters['user_id'] = { $in: filtered_userids };

  var acts = await Activity.find(activity_filters, {score: {$meta: 'textScore'}}).sort({score: { $meta: 'textScore' }}).skip(skip).limit(limit);
  var userids = acts.distinct(function (act) { return act.user_id });
  var people = await Person.find({ user_id: { $in : userids } });

  var peoplehash = people.reduce(function (map, person) {
    map[person.user_id] = person.basic_info();
    return map;
  }, {});

  return acts.map(function (act) {
    var activity = act.translate();
    activity.person = peoplehash[act.user_id];
    return activity;
  });
}

var lookup_all = async function (query) {
  var person_filters = common_filters(query).mergeHash(name_filters(query.q));
  var [skip, limit] = skip_limit(query);
  var text_search = { $search: query.q || '' }
  var [people_count, people, interest_count, interest, publication_count, publication, grant_count, grant, award_count, award] = await Promise.all([
    Person.find(person_filters).count(),
    lookup_person(person_filters, 0, limit),
    Activity.find({ $text: text_search, 'doc_type': Activity.type_profile }).count(),
    lookup_activity({ $text: text_search, 'doc_type': Activity.type_profile }, common_filters(query), 0, limit),
    Activity.find({ $text: text_search, 'doc_type': { $in: Activity.types_scholarly } }).count(),
    lookup_activity({ $text: text_search, 'doc_type': { $in: Activity.types_scholarly } }, common_filters(query), 0, limit),
    Activity.find({ $text: text_search, 'doc_type': { $in: Activity.types_grant } }).count(),
    lookup_activity({ $text: text_search, 'doc_type': { $in: Activity.types_grant } }, common_filters(query), 0, limit),
    Activity.find({ $text: text_search, 'doc_type': { $in: Activity.types_award } }).count(),
    lookup_activity({ $text: text_search, 'doc_type': { $in: Activity.types_award } }, common_filters(query), 0, limit),
  ]);

  return {
    name: {
      total: people_count,
      results: people
    },
    publication: {
      total: publication_count,
      results: publication
    },
    interest: {
      total: interest_count,
      results: interest
    },
    grant: {
      total: grant_count,
      results: grant
    },
    award: {
      total: award_count,
      results: award
    }
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

var skip_limit = function (query) {
  var page = parseInt(query.page, 10) || 1;
  var perpage = parseInt(query.perpage, 10) || 100;
  return [(page - 1)*perpage, perpage];
}

module.exports = router;
