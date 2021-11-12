const express = require('express');
const router = express.Router();
const Person = require('../models/person');
const Activity = require('../models/activity');
const auth = require('../helpers/auth.js');

async function getProfile(netid) {
  let profile = {}
  let [person, bio] = await Promise.all([
    Person.findOne({"username" : netid}).collation({ locale: 'en_US', strength: 2 }),
    Activity.findOne({"username" : netid, "doc_type" : "PROFILE"}).collation({ locale: 'en_US', strength: 2 }),
  ])
  if (!person) {
    return null
  }

  profile = person.advanced_info();
  profile.username = netid;
  // bio
  if (bio) {
    profile.biography = bio.html_bio();
    profile.teaching_interests = bio.html_teaching_interests();
    profile.research_interests = bio.html_research_interests();
  }
  return profile;
}

router.route('/')
  .get(auth.authorize, function(req, res, next) {
    if (!req.query.netid) {
      res.json([]);
    }
    let netids = req.query.netid;
    if (typeof netids === "string")
      netids = [netids];
    Promise.all(netids.map(function(id) {
      return getProfile(id)
    })).then(function(results) {
      let profiles = results.filter(function(p) {
        return p != null;
      })
      res.json(profiles)
    }).catch(function(err) {
      next(err)
    })
  })
module.exports = router;