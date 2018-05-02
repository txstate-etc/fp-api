var express = require('express');
var router = express.Router();
require('../helpers/citation-helper.js')();
var Citeproc = require('../citeproc-engine.js');
var Person = require('../models/person');
var Activity = require('../models/activity');

router.route('/:userid')
  .get(function(req, res, next) {
    var userid = req.params.userid
    var profile = {};

    Promise.all([
      Person.findOne({"user_id" : userid}),

      Activity.findOne({"user_id" : userid, "doc_type" : "PROFILE"}),

      Activity.find({
        "user_id" : userid,
        "doc_type" : { $in: Activity.types_scholarly },
        "STATUS" : {$in : ['Published', 'Accepted / In Press', 'Completed']}
      }).sort({PROFILE_FEATURE: -1, "time_range" : -1}).limit(5),

      Activity.find({
        "user_id" : userid,
        "doc_type" : { $in: Activity.types_award }
      }).sort({PROFILE_FEATURE: -1, "time_range" : -1, NAME : 1}).limit(5),

      Activity.find({
        "user_id" : userid,
        "doc_type" : { $in: Activity.types_grant }
      }).sort({PROFILE_FEATURE: -1, "time_range" : -1}).limit(5),

      Activity.find({
        "user_id": userid,
        "doc_type" : { $in: Activity.types_service }
      }).sort({PROFILE_FEATURE: -1, "time_range" : -1}).limit(5)
    ]).then(function (results) {
      var [person, bio, publications, awards, grants, service] = results;

      if (!person) {
        res.sendStatus(404);
        return;
      }

      profile = person.advanced_info();

      // bio
      if (bio) {
        profile.biography = bio.BIO;
        profile.teaching_interests = bio.TEACHING_INTERESTS;
        profile.research_interests = bio.RESEARCH_INTERESTS;
      }

      // publications
      profile.scholarly_creative = publications.map(function (activity) { return activity.translate() });

      // awards
      profile.awards = awards.map(function (activity) { return activity.translate() });

      // grants
      profile.grants = grants.map(function (activity) { return activity.translate() });

      // service
      profile.service_activities = service.map(function (activity) { return activity.translate() });

      // return
      res.json(profile)
    })
    .catch(function(err){
      console.log(err)
      next(err)
    })
  })

//Route used to get all of a particular activity for a given faculty member
router.route('/:userid/activity/:type')
  .get(function(req, res, next) {
    var userid = req.params.userid;
    var type = req.params.type;
    var conditions = {};
    var activityTitle = "";
    var citationBuilder;
    var ret = {};
    conditions.user_id = userid;
    switch(type) {
        case 'scholarly-creative':
          conditions.doc_type = { $in: Activity.types_scholarly }
          ret.activity_title = "Scholarly/Creative Works";
          break;
        case 'awards':
          conditions.doc_type = { $in: Activity.types_award }
          ret.activity_title = "Awards";
          break;
        case 'grants':
          conditions.doc_type = { $in: Activity.types_grant }
          ret.activity_title = "Grants";
          break;
        case 'service':
          conditions.doc_type = { $in: Activity.types_service }
          ret.activity_title = "Service Activities";
          break;
        default:
        //what would the default be?
    }
    Promise.all([
      Person.findOne({"user_id" : userid}),
      Activity.find(conditions).sort({"time_range" : -1})
    ])
    .then(function(results) {
      var [person, activities] = results;
      if (!person) {
        res.sendStatus(404);
        return;
      }

      ret.person = person.advanced_info();
      var activityYearMap = new Map();
      activities.forEach(function(activity) {
        var activityYear;
        var time_range = activity.time_range;
        var first_sort_year = time_range.substring(0,4);
        var second_sort_year = time_range.substring(8,12);

        activityYear = (first_sort_year == "YYYY")? second_sort_year : first_sort_year;
        if (type != "grants") {
          if (first_sort_year == "YYYY" && second_sort_year != "YYYY") {
            activityYear = "current"
          }
        }
        if (activityYear == "YYYY") {
          activityYear = "Date Not Specified";
        }
        if (!activityYearMap.has(activityYear)) {
          activityYearMap.set(activityYear, []);
        }
        activityYearMap.get(activityYear).push(activity.translate());
      })
      //put the items with no date specified at the bottom
      if (activityYearMap.has("Date Not Specified")) {
        var notSpecified = activityYearMap.get("Date Not Specified");
        activityYearMap.delete("Date Not Specified");
        activityYearMap.set("Date Not Specified", notSpecified)
      }
      ret.activities = [];
      activityYearMap.forEach(function(value, key, map) {
        ret.activities.push({year: key, items: value})
      })
      res.json(ret)
    })
    .catch(function(err) {
      console.log("Error: " + err)
      next(err)
    })
  })

//TODO: Does there need to be a route for retrieving profile pictures? Is that a different endpoint?

module.exports = router;
