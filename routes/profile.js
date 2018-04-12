var express = require('express');
var router = express.Router();
require('../helpers/citation-helper.js')();
var Citeproc = require('../citeproc-engine.js');
var Person = require('../models/person');
var Activity = require('../models/activity');

//If the route is /person/netID, build and return the profile for the faculty member
router.route('/:netId')
  .get(function(req, res, next) {
    var netId = req.params.netId
    var profile = {};

    Promise.all([
      Person.findOne({"username" : netId}),

      Activity.findOne({"username" : netId, "doc_type" : "PROFILE"}),

      Activity.find({
        "username" : netId,
        "doc_type" : { $in: Activity.types_scholarly },
        "STATUS" : {$in : ['Published', 'Accepted / In Press', 'Completed']}
      }).sort({"time_range" : -1}).limit(5),

      Activity.find({
        "username" : netId,
        "doc_type" : { $in: Activity.types_award }
      }).sort({"time_range" : -1}).limit(5),

      Activity.find({
        "username" : netId,
        "doc_type" : { $in: Activity.types_grant }
      }).sort({"time_range" : -1}).limit(5),

      Activity.find({
        "username": netId,
        "doc_type" : { $in: Activity.types_service }
      }).sort({"time_range" : -1}).limit(5)
    ]).then(function (results) {
      var person, bio, publications, awards, grants, service;
      [person, bio, publications, awards, grants, service] = results;

      // person
      profile.faculty_id = person.username;
      //TODO: phone number, and office construction out of here
      profile.display_name = person.display_name;

      if (person.positions && person.positions.length > 0) {
        profile.positions = [];
        person.positions.forEach(function(position) {
          console.log(position)
          profile.positions.push({"title" : position.title, "department": position.organization.department})
        })
      }
      profile.email = person.EMAIL;
      profile.office_location = "";
      profile.office_location += (person.BUILDING) ? `${person.BUILDING} ` : "";
      profile.office_location += (person.ROOMNUM) ? `${person.ROOMNUM}` : "";
      profile.phone_number = `(${person.OPHONE1}) ${person.OPHONE2}-${person.OPHONE3}`
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
      res.header("Access-Control-Allow-Origin", "*");
      res.json(profile)
    })
    .catch(function(err){
      console.log(err)
      next(err)
    })
  })

//Route used to get all of a particular activity for a given faculty member
router.route('/:netId/activity/:type')
  .get(function(req, res, next) {
    var netId = req.params.netId;
    var type = req.params.type;
    var conditions = {};
    var activityTitle = "";
    var citationBuilder;
    var ret = {};
    conditions.username = netId;
    switch(type) {
        case 'scholarly-creative':
          conditions.doc_type = { $in: Activity.types_scholarly }
          ret.activity_title = "Scholarly Creative Works";
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
      Person.findOne({"username" : netId}),
      Activity.find(conditions).sort({"time_range" : -1})
    ])
    .then(function(results) {
      var person, activities;
      [person, activities] = results;
      ret.person_info = person.basic_info();
      var activityYearMap = new Map();
      activities.forEach(function(activity) {
        var activityYear;
        if (activity.DTY_PUB || activity.DTY_ACC) {
          activityYear = activity.DTY_PUB || activity.DTY_ACC;
        }
        else if (activity.DTY_END) {
          activityYear = activity.DTY_END;
        }
        else if (activity.DTY_START) {
          activityYear = "current";
        }
        else {
          activityYear = "Date Not Specified";
        }
        if (!activityYearMap.has(activityYear)) {
          activityYearMap.set(activityYear, []);
        }
        activityYearMap.get(activityYear).push(activity.translate());
      })
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
