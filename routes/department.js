var express = require('express');
var router = express.Router();

router.route('/')
  .get(function(req, res, next) {
    res.json({message: "Returning sorted list of colleges and departments for search dropdown"})
  })

module.exports = router;
