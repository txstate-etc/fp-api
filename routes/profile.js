var express = require('express');
var router = express.Router();
require('../helpers/citation-helper.js')();
var Citeproc = require('../citeproc-engine.js');

//If the route is /person/netID, build and return the profile for the faculty member
router.route('/:netId')
  .get(function(req, res, next) {
    var netId = req.params.netId
    var Person = require('../models/person');
    var Activity = require('../models/activity');
    var profile = {};
    return Person.findOne({"username" : netId})
    .then(function(person) {
      profile.faculty_id = person.username;
      //TODO: Move name, phone number, and office construction out of here
      profile.display_name = "";
      profile.display_name += (person.PREFIX) ? `${person.PREFIX} ` : "";
      profile.display_name += (person.FNAME) ? `${person.FNAME} ` : "";
      profile.display_name += (person.MNAME) ? `${person.MNAME} ` : "";
      profile.display_name += (person.LNAME) ? `${person.LNAME}` : "";
      profile.email = person.EMAIL;
      profile.biography = person.BIO;
      profile.teaching_interests = person.TEACHING_INTERESTS;
      profile.research_interests = person.RESEARCH_INTERESTS;
      profile.office_location = "";
      profile.office_location += (person.BUILDING) ? `${person.BUILDING} ` : "";
      profile.office_location += (person.ROOMNUM) ? `${person.ROOMNUM}` : "";
      profile.phone_number = `(${person.OPHONE1}) ${person.OPHONE2}-${person.OPHONE3}`
      //Added contact info and bio, now search for scholarly-creative
      return Activity.find({"username" : netId,
                            "doc_type" : { $in: ['INTELLCONT', 'ARTS_COLLECTIONS', 'ARTS_COMP', 'ARTS_PROD', 'ARTS_RESIDENCIES', 'ARTS_REVIEWS']},
                            "STATUS" : {$in : ['Published', 'Accepted / In Press', 'Completed']}})
                     .sort({"time_range" : -1})
                     .limit(5)
    })
    .then(function(publications){
      console.log(publications)
      var citationFormat = 'apa';
      var citeproc = new Citeproc(citationFormat);
      profile.scholarly_creative = [];
      for (var pub of publications) {
        var citation = buildScholarlyCreativeCitation(pub, citeproc);
        profile.scholarly_creative.push({"citation" : citation})
      }
      //now get awards
      return Activity.find({"username" : netId,
                            "doc_type" : 'AWARDHONOR'})
                     .sort({"time_range" : -1})
                     .limit(5)
    })
    .then(function(awards) {
      profile.awards = [];
      for (var award of awards) {
        var awardCitation = formatAwardText(award);
        profile.awards.push({award: awardCitation})
      }
      //get grants
      return Activity.find({"username" : netId,
                            "doc_type" : 'CONGRANT'})
                     .sort({"time_range" : -1})
                     .limit(5)

    })
    .then(function(grants) {
      profile.grants = [];
      for (var grant of grants) {
        var grantCitation = formatGrantText(grant);
        profile.grants.push({"grant" : grantCitation})
      }
      return Activity.find({"username": netId,
                            "doc_type" : {$in : ['SERVICE_PUBLIC', 'SERVICE_UNIVERSITY', 'SERVICE_PROFESSIONAL']}})
                     .sort({"time_range" : -1})
                     .limit(5)
    })
    .then(function(service_activities) {
      profile.service_activities = [];
      for (var activity of service_activities) {
        var role = activity.ROLE;
        if (!role) {
          role = "Role Not Specified";
        }
        else if (role == "Other") {
          role = activity.ROLEOTHER || "Role Not Specified"
        }
        profile.service_activities.push({
          role: role,
          organization: activity.ORG,
          city: activity.CITY,
          state: activity.STATE,
          service_period: buildServiceDate(activity)
        })
      }
      //don't leave this here
      res.header("Access-Control-Allow-Origin", "*");
      res.json(profile)
    })
    .catch(function(err){
      console.log(err)
      next(err)
    })
  })

//Route used to get all of a particular activity
router.route('/:netId/activity/:type')
  .get(function(req, res, next) {
    var netId = req.params.netId;
    var type = req.params.type;
    var conditions = {};
    var activityTitle = "";
    var citationBuilder;
    console.log(`getting ${type} for ${netId}`)
    conditions.username = netId;
    switch(type) {
        case 'scholarly-creative':
          conditions.doc_type = { $in: ['INTELLCONT', 'ARTS_COLLECTIONS', 'ARTS_COMP', 'ARTS_PROD', 'ARTS_RESIDENCIES', 'ARTS_REVIEWS']}
          break;
        case 'awards':
          conditions.doc_type = 'AWARDHONOR'
          break;
        case 'grants':
          conditions.doc_type = 'CONGRANT'
          break;
        case 'service':
          conditions.doc_type = { $in: ['SERVICE_PROFESSIONAL', 'SERVICE_UNIVERSITY', 'SERVICE_PUBLIC']}
          break;
        default:
        //what would the default be?
    }
    var Activity = require('../models/activity');
    Activity.find(conditions)
      .sort({"time_range" : -1})
      .then(function(activities) {
        switch(type) {
            case 'scholarly-creative':
              res.json(handleScholarlyCreative(activities));
              break;
            case 'awards':
            res.json(handleAwards(activities));
              break;
            case 'grants':
              res.json(handleGrants(activities));
              break;
            case 'service':
              res.json(handleService(activities));
              break;
            default:
            //??
        }
      })
      .catch(function(err) {
        console.log("Error: " + err)
        next(err)
      })
  })

//TODO: This could be DRYer.

function handleScholarlyCreative(activities) {
  var result = {"activity-title": "Scholarly Creative Works"};
  result.activities = [];
  var currentGroup = {};

  //TODO: Here, we would need to get their preferred citation format
  var citationFormat = 'apa';
  var citeproc = new Citeproc(citationFormat);

  for (var activity of activities) {
    //TODO: We will probably only show things that have been published.
    var activityYear = activity.DTY_PUB || activity.DTY_ACC || activity.DTY_SUB || activity.DTY_EXPSUB || activity.DTY_END || activity.DTY_START || activity.DTY_DATE || "Date Not Specified";
    if (activityYear == currentGroup.year) {
      currentGroup.items.push({activity: buildScholarlyCreativeCitation(activity, citeproc)})
    }
    else {
      if (currentGroup.year)
        result.activities.push(currentGroup);
      currentGroup = {};
      currentGroup.year = activityYear;
      currentGroup.items = [{activity: buildScholarlyCreativeCitation(activity, citeproc)}]
    }
  }
  if (currentGroup.year)
    result.activities.push(currentGroup);
  return result;
}

function handleAwards(activities) {
  var result = {"activity-title": "Awards"};
  result.activities = [];
  var currentGroup = {};
  for (var activity of activities) {
    var activityYear = activity.DTY_END || activity.DTY_START || "Date Not Specified";
    if (activityYear == currentGroup.year) {
      currentGroup.items.push({activity: formatAwardText(activity)})
    }
    else {
      if (currentGroup.year)
        result.activities.push(currentGroup);
      currentGroup = {};
      currentGroup.year = activityYear;
      currentGroup.items = [{activity: formatAwardText(activity)}]
    }
  }
  if (currentGroup.year)
    result.activities.push(currentGroup);
  return result;
}

function handleGrants(activities) {
  var result = {"activity-title": "Grants"};
  result.activities = [];
  var currentGroup = {};
  for (var activity of activities) {
    var activityYear = activity.DTY_END || activity.DTY_START || "Date Not Specified";
    if (activityYear == currentGroup.year) {
      currentGroup.items.push({activity: formatGrantText(activity)})
    }
    else {
      if (currentGroup.year)
        result.activities.push(currentGroup);
      currentGroup = {};
      currentGroup.year = activityYear;
      currentGroup.items = [{activity: formatGrantText(activity)}]
    }
  }
  if (currentGroup.year)
    result.activities.push(currentGroup);
  return result;
}

function handleService(activities) {
  var result = {"activity-title": "Service Activities"};
  result.activities = [];
  var currentGroup = {};
  for (var activity of activities) {
    var activityYear = activity.DTY_END || "Current";
    if (activityYear == currentGroup.year) {
      currentGroup.items.push({activity: formatServiceText(activity)})
    }
    else {
      if (currentGroup.year)
        result.activities.push(currentGroup);
      currentGroup = {};
      currentGroup.year = activityYear;
      currentGroup.items = [{activity: formatServiceText(activity)}]
    }
  }
  if (currentGroup.year)
    result.activities.push(currentGroup);
  return result;
}

//TODO: Does there need to be a route for retrieving profile pictures? Is that a different endpoint?

module.exports = router;
