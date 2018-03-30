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
  }

  this.formatGrantText = function(activity) {
    var context = {};
    var template = "contractsgrants";
    if (activity.CONGRANT_INVEST) {
      context.investigators = [];
      activity.CONGRANT_INVEST.forEach(function(inv) {
        var investigator = {};
        if (inv.FNAME) investigator.fname = inv.FNAME;
        if (inv.MNAME) investigator.mname = inv.MNAME;
        if (inv.LNAME) investigator.lname = inv.LNAME;
        if (inv.ROLE) investigator.role = inv.ROLE;
        if (inv.PCT_CONTRIBUTION) investigator.percent = inv.PCT_CONTRIBUTION;
        context.investigators.push(investigator)
      })
    }
    if (activity.TITLE) context.title = activity.TITLE;
    if (activity.SPONORG) context.sponsor = activity.SPONORG;
    if (activity.AWARDORG) {
      if (activity.AWARDORG == "Other" && activity.AWARDORG_OTHER) {
          context["funding-source"] = activity.AWARDORG_OTHER;
      }
      else {
        context["funding-source"] = activity.AWARDORG;
      }
    }
    if (activity.AMOUNT) context.amount = activity.AMOUNT;
    if (activity.DTY_SUB)
      context.submitDate = {
        year: activity.DTY_SUB,
        month: activity.DTM_SUB,
        day: activity.DTD_SUB
      }
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
    if (activity.TYPE) context.type = activity.TYPE;
    var hbs = require('../fp-handlebars').getInstance();
    var citationTemplate = hbs.getTemplate(template);
    return citationTemplate(context)
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
