require('./csl-helper.js')();
var fs = require('fs')
require ('./finearts.js')();

module.exports = function() {

  this.buildScholarlyCreativeCitation = function(activity, citeprocInstance) {
    if (activity.doc_type == "INTELLCONT") {
      var data = {};
      data[activity.id] = toCSL(activity);
      citeprocInstance.setItems(data);
      var citation = citeprocInstance.createCitation();
      return citation;
    }
    else {
      //fine arts
      var citation = getFineArtsCitation(activity);
      return citation
    }
  };

  this.formatAwardText = function(activity) {
    var context = {};
    var template = "awardshonors";
    if (activity.TYPE) context.type = activity.TYPE;
    if (activity.NOMREC) context.nomrec = activity.NOMREC;
    if (activity.NAME) context.name = activity.NAME;
    if (activity.ORG) context.org = activity.ORG;
    context.startDate = {
      year: activity.DTY_START,
      month: activity.DTM_START,
      day: activity.DTD_START
    }
    context.endDate = {
      year: activity.DTY_END,
      month: activity.DTM_END,
      day: activity.DTD_END
    }
    var hbs = require('../fp-handlebars').getInstance();
    var citationTemplate = hbs.getTemplate(template);
    return citationTemplate(context)
    //return `${activity.NAME}, ${activity.ORG}. (${activity.DTY_END})`;
  }

  this.formatGrantText = function(activity) {
    return `${activity.TITLE}`;
  }

  this.formatServiceText = function(activity) {
    return `${activity.ORG}`;
  }

  this.buildServiceDate = function(activity) {
    var date = "";
    if (activity.DTY_START) {
      if (activity.DTM_START) {
        date += `${activity.DTM_START} `;
        if (activity.DTD_START) {
          date += `${activity.DTD_START}, `;
        }
      }
      date += `${activity.DTY_START}-`;
    }
    if (activity.DTY_END) {
      if (activity.DTM_END) {
        date += `${activity.DTM_END} `;
        if (activity.DTD_END) {
          date += `${activity.DTD_END}, `;
        }
      }
      date += `${activity.DTY_END}`;
    }
    else {
      date += "Present";
    }
    return date;
  }
}
