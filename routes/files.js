var express = require('express');
var router = express.Router();
var Person = require('../models/person');
var Activity = require('../models/activity');

router.route('/cv/:userid/:filename')
  .get(function(req, res, next) {

  })

router.route('/photo/:userid/:filename')
  .get(function(req, res, next) {

  })

router.route('/attachment/:activityid/:filename')
  .get(function(req, res, next) {

  })
