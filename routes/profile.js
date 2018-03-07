var express = require('express');
var router = express.Router();

//If the route is /person/netID, build and return the profile for the faculty member
router.route('/:netId')
  .get(function(req, res, next) {
    var netId = req.params.netId
    var Person = require('../models/person');
    var Activity = require('../models/activity');
    var profile = {};
    return Person.findOne({"username" : netId})
    .then(function(person) {
      console.log(person)
      profile.display_name = "";
      profile.display_name += (person.PREFIX) ? `${person.PREFIX} ` : "";
      profile.display_name += (person.FNAME) ? `${person.FNAME} ` : "";
      profile.display_name += (person.MNAME) ? `${person.MNAME} ` : "";
      profile.display_name += (person.LNAME) ? `${person.LNAME}` : "";
      profile.email = person.EMAIL;
      profile.biography = person.BIO;
      profile.teaching_interests = person.TEACHING_INTERESTS;
      profile.research_interests = person.RESEARCH_INTERESTS;
      //Added contact info and bio, now search for scholarly-creative
      return Activity.find({"username" : netId,
                            "doc_type" : { $in: ['INTELLCONT', 'ARTS_COLLECTIONS', 'ARTS_COMP', 'ARTS_PROD', 'ARTS_RESIDENCIES', 'ARTS_REVIEWS']}})
    })
    .then(function(publications){
      profile.scholarly_creative = [];
      res.json(publications)
    })
    .catch(function(err){
      next(err)
    })
  })

//Route used to get all of a particular activity
router.route('/:netId/activity/:type')
  .get(function(req, res, next) {
    var netId = req.params.netId;
    var type = req.params.type;
    var conditions = {};
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
    .then(function(activities) {
      res.json(activities)
    })
    .catch(function(err) {
      next(err);
    })
  })



//TODO: Does there need to be a route for retrieving profile pictures? Is that a different endpoint?

module.exports = router;
