var fs = require('fs');
var citeproc = require('citeproc-js-node');

var Citeproc = function(citationFormat) {
  this.citationFormat = citationFormat || 'apa';
  this.sys = new citeproc.simpleSys();

  var enUSLocale = fs.readFileSync(__dirname + '/locales/locales-enUS.xml', 'utf8');
  this.sys.addLocale('en-US', enUSLocale);

  var styleString = fs.readFileSync(__dirname + `/csl-styles/${this.citationFormat}.csl`, 'utf8');

  this.citeprocEngine = this.sys.newEngine(styleString, 'en-US', null);

}

Citeproc.prototype.setItems = function(items) {
  this.sys.items = items;
  this.citeprocEngine.updateItems(Object.keys(items))
}

Citeproc.prototype.createCitation = function() {
  var bib = this.citeprocEngine.makeBibliography();
  return bib[1][0]
}

module.exports = Citeproc;
