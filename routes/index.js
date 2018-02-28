var express = require('express');
var router = express.Router();
var fs = require('fs');
var citeproc = require('citeproc-js-node');

//TODO: Add routes for profile, search(es), profile picture?

router.get('/', function(req, res, next) {
  //made up data for citeproc example
  //without a 'type' the date won't be formatted correctly, but there is no software type in CSL yet
  var data = {
    "12345" : {
      "id" : "12345",
      "title" : "A Really Nice Computer Program",
      "URL" : "http://www.github.com",
      "issued" : {
        "month" : 5,
        "day" : 20,
        "year" : '2017'
      },
      "author" : [
        {"given" : "Elizabeth", "family" : "Smith"},
        {"given" : "Jason", "family" : "Hernandez"}
      ],
      "medium" : 'Software'
    }
  }

  var sys = new citeproc.simpleSys();
  var enUSLocale = fs.readFileSync(__dirname + '/../locales/locales-enUS.xml', 'utf8');
  sys.addLocale('en-US', enUSLocale);
  var styleString = fs.readFileSync(__dirname + '/../csl-styles/apa.csl', 'utf8');

  var engine = sys.newEngine(styleString, 'en-US', null);

  sys.items = data;
  engine.updateItems(Object.keys(data));
  var bib = engine.makeBibliography();
  res.send(bib[1].join(""))
});

module.exports = router;
