var express = require('express');
var router = express.Router();

router.route('/')
  .get(function(req, res, next) {
    var Person = require('../models/person');
    return Person.aggregate(
      [
        {"$unwind" : "$positions"},
        {"$match" : {"positions.organization.is_academic": true}},
        {"$group" : {"_id" : {"college": "$positions.organization.college", "department": "$positions.organization.department"}}},
        {"$sort" : {"_id.college" : 1, "_id.department" : 1}}
      ]
    )
    .then(function(results) {
      if (results) {
        var colleges = {};
        var organizations = [];
        results.forEach(function(result) {
          var college = result["_id"].college;
          if (!colleges[college]) {
            colleges[college] = [];
            organizations.push({"college": college, "departments" : []})
          }
          colleges[college].push(result["_id"].department)
        })
        organizations.forEach(function(org) {
          var college = org.college;
          org.departments = colleges[college];
        })
        res.json(organizations)
      }
      else {
        res.json([])
      }
    })
    .catch(function(err) {
      next(err)
    })
  })

module.exports = router;
