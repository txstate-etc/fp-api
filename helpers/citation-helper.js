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
    return `${activity.NAME}, ${activity.ORG}. (${activity.DTY_END})`;
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
