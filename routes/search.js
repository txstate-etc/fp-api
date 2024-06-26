var express = require('express');
var router = express.Router();
var Person = require('../models/person');
var Activity = require('../models/activity');

router.route('/all')
  .get(function(req, res, next) {
    lookup_all(req.query)
    .then(function (ret) {
      var [skip, limit, ret] = ret
      //console.log("page boundaries: %s, response: %s", JSON.stringify([skip, limit]), JSON.stringify(ret));
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
      lookup_person(person_filters, skip, limit)
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

router.route('/photo')
  .get(async function(req, res, next) {
    search_person(req, res, next, {UPLOAD_PHOTO:{$exists:true}});
  })

var search_activity = function (req, res, next, activity_filters) {
  var query = req.query.q || '';
  var [skip, limit] = skip_limit(req.query);
  activity_filters['$text'] = { $search: query };
  fetch_eligible_person_filter(req.query)
  .then(function (eligibility_filter) {
    return lookup_activity(activity_filters.mergeHash(eligibility_filter), skip, limit)
  })
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

var fetch_eligible_person_filter = async function(query) {
  var filters = common_filters(query);
  if (filters.emptyHash()) return {}
  var people = await Person.find(filters, 'user_id');
  var filtered_userids = people.map(function (person) { return person.user_id });
  return { user_id: { $in: filtered_userids } }
}

var lookup_activity = async function(activity_filters, skip = 0, limit = 100) {
  var acts = []
  if (activity_filters['$text']) {
  //  var words = activity_filters['$text']['$search'].match(/[\w\-]+|"(?:\\"|[^"])+"/g)
  //  var promises = []
  //  var filters = JSON.parse(JSON.stringify(activity_filters)) // deep copy so we don't mutate activity_filters
  //  words.forEach((word) => {
  //    filters['$text']['$search'] = word
  //    promises.push(Activity.find(filters, {score: {$meta: 'textScore'}}).sort({score: { $meta: 'textScore' }}).skip(skip).limit(limit))
  //  })
  //  var results = await Promise.all(promises)
  //  var acthash = new Map()
  //  results.forEach((activities) => {
  //    activities.forEach((act) => {
  //      if (acthash.has(act.id)) {
  //        var entry = acthash.get(act.id)
  //        entry.matchingwords++
  //        entry.score += act.score
  //      }
  //      else {
  //        acthash.set(act.id, { matchingwords: 1, score: act.score, act: act })
  //      }
  //    })
  //  })
  //  var entries = Array.from(acthash.values()).sort((a,b) => {
  //    if (a.matchingwords > b.matchingwords) return -1
  //    if (a.matchingwords < b.matchingwords) return 1
  //    if (a.score > b.score) return -1
  //    if (a.score < b.score) return 1
  //    return 0
  //  })
  //  acts = entries.map((entry) => { return entry.act })
    acts = await Activity.find(activity_filters, {score: {$meta: 'textScore'}}).sort({score: { $meta: 'textScore' }}).skip(skip).limit(limit)
  } else {
    acts = await Activity.find(activity_filters).skip(skip).limit(limit);
  }
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
  console.log('QUERY: %s', query)
  var eligibility_filter = await fetch_eligible_person_filter(query)
  var person_filters = name_filters(query.q).mergeHash(common_filters(query));
  var activity_filters = { $text: { $search: query.q || '' } }.mergeHash(eligibility_filter)
  var [skip, limit] = skip_limit(query);

  var [people_count, people, interest_count, interest, publication_count, publication, grant_count, grant, award_count, award, service_count, service] = await Promise.all([
    Person.find(person_filters).count(),
    lookup_person(person_filters, skip, limit),
    Activity.find({'doc_type': Activity.type_profile}.mergeHash(activity_filters)).count(),
    lookup_activity({'doc_type': Activity.type_profile}.mergeHash(activity_filters), skip, limit),
    Activity.find({'doc_type': { $in: Activity.types_scholarly } }.mergeHash(activity_filters)).count(),
    lookup_activity({'doc_type': { $in: Activity.types_scholarly } }.mergeHash(activity_filters), skip, limit),
    Activity.find({'doc_type': { $in: Activity.types_grant } }.mergeHash(activity_filters)).count(),
    lookup_activity({'doc_type': { $in: Activity.types_grant } }.mergeHash(activity_filters), skip, limit),
    Activity.find({'doc_type': { $in: Activity.types_award } }.mergeHash(activity_filters)).count(),
    lookup_activity({'doc_type': { $in: Activity.types_award } }.mergeHash(activity_filters), skip, limit),
    Activity.find({'doc_type': { $in: Activity.types_service } }.mergeHash(activity_filters)).count(),
    lookup_activity({'doc_type': { $in: Activity.types_service } }.mergeHash(activity_filters), skip, limit),
  ]);

  return [skip, limit, {
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
    },
    service: {
      total: service_count,
      results: service
    }
  }];
}

var common_filters = function (query) {
  var filters = {};
  if (query.dept) filters['positions.organization.department'] = query.dept;
  if (query.college) filters['positions.organization.college'] = query.college;
  return filters;
}

var name_break = function (str) {
  return str.replace(/[^\w\s\.\-]/g, '') // get rid of apostrophes and such
    .replace(/[\s\.\-]+/g, ' ').trim() // control whitespace
    .replace(/\b(\w) (\w)(?: (\w))?\b/g, '$1$2$3') // compress initials if they were spaced out or had periods
    .split(/ /)
    //.filter(word => { return word.length > 1 }) // toss out single letters <-- This was causing single letter searches to throw error pages and is unintuitive for users.
    .map(word => { return word.toLowerCase() })
}

var name_filters = function (querystr) {
  if (!querystr) return {}
  var word_matches = name_break(querystr).map(word => {
    return { lname_words: { $regex: '^'+RegExp.quote(word), $options: 'i' } }
  })
  if (word_matches.length == 0) return {} // Avoid error pages when searches are requested for things entirely filtered out by name_break(str).
  return { $or: word_matches }
}

var skip_limit = function (query) {
  var page = parseInt(query.page, 10) || 1;
  var perpage = parseInt(query.perpage, 10) || 100;
  return [(page - 1)*perpage, perpage];
}

module.exports = router;
