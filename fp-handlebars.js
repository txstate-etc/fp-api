var fs = require('fs');
var path = require('path');

const templateDir = path.join(__dirname, 'templates')
const helperDir = path.join(__dirname, 'helpers')

//TODO: This needs better (some!) error handling

var Handlebars = (function(){
  var handlebarsInstance;
  var createHandlebarsInstance = function() {

    var hbs = require('handlebars')
    var templates = {};

    //register helpers
    var helpers = require('./helpers/handlebars-helpers')
    Object.getOwnPropertyNames(helpers).forEach(function(key){
      if (typeof helpers[key] == "function") {
        hbs.registerHelper(key, helpers[key])
      }
    })

    //register partials
    var partials = [];
    fs.readdirSync(path.join(templateDir, 'partials')).forEach(filename => {
      var result = readFileAsync(path.join(templateDir, 'partials', filename))
      .then(function(data){
        var name = filename.replace('.handlebars', '');
        hbs.registerPartial(name, data);
      })
      .catch(function(err) {
        console.log(err)
      })
      partials.push(result)
    })
    Promise.all(partials)
    .then(function(){
      console.log("All partials registered")

      //compile the templates
      fs.readdirSync(templateDir).forEach(templateFile => {
        fs.lstat(path.join(templateDir, templateFile), function(err, stats) {
          if (stats.isFile()) {
            readFileAsync(path.join(templateDir, templateFile))
            .then(function(data){
              var key = templateFile.replace('.handlebars', '');
              templates[key] = hbs.compile(data);
            })
            .catch(function(err) {
              console.log(err)
            })
          }
        })
      })
    })

    function getTemplate(name) {
      return templates[name]
    }

    return {
      getTemplate: getTemplate
    }
  }
  return {
    getInstance : function() {
      if (!handlebarsInstance) {
        handlebarsInstance = createHandlebarsInstance();
      }
      return handlebarsInstance
    }
  }
})();

module.exports = Handlebars;

function readFileAsync(file) {
  return new Promise(function(resolve,reject) {
    fs.readFile(file, 'utf8', function(err, data) {
      if (err) {
        reject(err)
      }
      else {
        resolve(data)
      }
    })
  })
}
