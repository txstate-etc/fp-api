//schema for activities (scholarly/creative, service, awards, grants)
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
require('../helpers/citation-helper.js')();
var Citeproc = require('../citeproc-engine.js');

// pre-load citeproc instances because this is expensive
var citeprocs = {
  apa: new Citeproc('apa')
}

//NOTES
// * DM uses 'PUBLISHER' for the venue of a book review. What does CSL use? PUBLISHER might have 2 different meanings, depending on content type
// * Is publication country used in the citation?
// * TODO: Add dates
// * Art exhibit location, okay to change to event-place?
// * arts_collections venue vs location
var ActivitySchema = new Schema({
  id: String,
  username: String,
  doc_type: String,
  user_id: String,
  time_range: String,
  TITLE : {
    type: String,
    alias: 'title'
  },
  TITLE_SECONDARY : String,
  STATUS : String,
  CONTYPE : String,
  CONTYPEOTHER: String,
  REVIEWED_WORK_TITLE : {
    type: String,
    alias: 'reviewed-title'
  },
  CONFERENCE : {
    type: String,
    alias: 'event'
  },
  LOCATION : {
    type: String,
    alias: 'event-place'
  },
  CONF_DATE : String,
  JOURNAL_NAME : {
    type: String,
    alias: 'container-title'
  },
  PUBLISHER : String,
  PUBCTYST : {
    type: String,
    alias: 'publisher-place'
  },
  PUBCNTRY : String,
  VOLUME : {
    type: String,
    alias: 'volume'
  },
  ISSUE : {
    type: String,
    alias: 'issue'
  },
  EDITION : {
    type: String,
    alias: 'edition'
  },
  NUMBER : {
    type: String,
    alias: 'number'
  },
  PAGENUM : {
    type: String,
    alias : 'page'
  },
  NUMBER_OF_PAGES : {
    type: Number,
    alias: 'number-of-pages'
  },
  ISBNISSN : String,
  DOI: String,
  WEB_ADDRESS : {
    type: String,
    alias: 'URL'
  },
  INTELLCONT_AUTH : [{
    FNAME: String,
    MNAME: String,
    LNAME: String,
    ROLE: String
  }],
  DTM_PUB : String,
  DTD_PUB : String,
  DTY_PUB : String,
  DTM_ACC : String,
  DTD_ACC : String,
  DTY_ACC : String,
  DTM_SUB : String,
  DTD_SUB : String,
  DTY_SUB : String,
  DTM_EXPSUB : String,
  DTD_EXPSUB : String,
  DTY_EXPSUB : String,
  DTM_START : String,
  DTD_START : String,
  DTY_START : String,
  DTM_END : String,
  DTD_END : String,
  DTY_END : String,
  DTM_DATE : String,
  DTD_DATE : String,
  DTY_DATE : String,
  //start arts_collections
  TYPE : String,
  COLLECTION_NAME: String,
  MEDIUM : {
    type: String,
    alias: 'medium'
  },
  NUM_ARTISTS : String,
  SCOPE : String,
  DTM_ACQUIRED : String,
  DTD_ACQUIRED : String,
  DTY_ACQUIRED : String,
  COLLECTION_TYPE : String,
  VENUE: [{
    TITLE : String,
    NAME: String,
    LOCATION: String,
    DTM_END : String,
    DTD_END : String,
    DTY_END : String,
    DTM_START : String,
    DTD_START : String,
    DTY_START : String
  }],
  REVIEW: [{
    FNAME : String,
    MNAME : String,
    LNAME: String,
    TITLE : String,
    REVIEW_TYPE : String
  }],
  //start arts_prod
  MEDIA_TYPE : String,
  ROLE : String,
  //start arts_residencies
  NAME : String,
  COMMISSION_TITLE: String,
  COMMISSION_ORG : String,
  COMMISSION_ORG_TYPE: String,
  //start arts_reviews
  PUBLICATION_TITLE : String,
  PUBLISHER_LOCATION : String,
  START_PAGE : String,
  END_PAGE : String,
  NUM_VOLUMES : {
    type: Number,
    alias: 'number-of-volumes'
  },
  REVIEW_AUTH: [{
    FNAME : String,
    MNAME : String,
    LNAME: String,
    TITLE : String,
    REVIEW_TYPE : String
  }],
  //start of awardhonor
  ORG : String,
  NOMREC: String,
  //start of congrant
  AWARDORG : String,
  AWARDORG_OTHER : String,
  SPONORG : String,
  AMOUNT : String,
  AWARDNUM : String,
  CONGRANT_INVEST : [{
    FNAME : String,
    MNAME : String,
    LNAME : String,
    ROLE : String
  }],
  //start of service
  ROLEOTHER : String,
  CITY : String,
  STATE : String,
  COUNTRY : String,
  //profile
  BIO : String,
  RESEARCH_INTERESTS : String,
  TEACHING_INTERESTS : String
});

ActivitySchema.index({username: 1});
ActivitySchema.index({'$**': 'text'});

var type_profile = 'PROFILE';
ActivitySchema.statics.type_profile = type_profile;
var types_scholarly = ['INTELLCONT', 'ARTS_COLLECTIONS', 'ARTS_COMP', 'ARTS_PROD', 'ARTS_RESIDENCIES', 'ARTS_REVIEWS'];
ActivitySchema.statics.types_scholarly = types_scholarly;
var types_award = ['AWARDHONOR'];
ActivitySchema.statics.types_award = types_award;
var types_grant = ['CONGRANT'];
ActivitySchema.statics.types_grant = types_grant;
var types_service = ['SERVICE_PROFESSIONAL', 'SERVICE_UNIVERSITY', 'SERVICE_PUBLIC'];
ActivitySchema.statics.types_service = types_service;

ActivitySchema.methods.translate = function () {
  var activity = this;
  var ret = {};
  if (activity.isProfile()) {
    ret.type = 'profile';
    var interests = [];
    if (activity.RESEARCH_INTERESTS)
      interests.push('<strong class="research">Research:</strong> <span class="research">'+activity.RESEARCH_INTERESTS + '</span>');
    if (activity.TEACHING_INTERESTS)
      interests.push('<strong class="teaching">Teaching:</strong> <span class="teaching">'+activity.TEACHING_INTERESTS + '</span>');
    ret.full_description = interests.join('<br>');
  } else if (activity.isScholarly()) {
    ret.type = 'scholarly';
    ret.full_description = buildScholarlyCreativeCitation(activity, citeprocs.apa)
  } else if (activity.isAward()) {
    ret.type = 'award';
    ret.full_description = formatAwardText(activity);
  } else if (activity.isGrant()) {
    ret.type = 'grant';
    ret.full_description = formatGrantText(activity);
  } else if (activity.isService()) {
    ret.type = 'service';
    ret.role = activity.ROLE || "Role Not Specified";
    if (activity.ROLE == "Other") ret.role = activity.ROLEOTHER || "Role Not Specified";
    ret.organization = activity.ORG;
    ret.city = activity.CITY;
    ret.state = activity.STATE;
    ret.service_period = buildServiceDate(activity);
    ret.full_description = formatServiceText(activity);
  }
  return ret;
}

ActivitySchema.methods.isProfile = function () {
  return type_profile == this.doc_type;
}
ActivitySchema.methods.isScholarly = function () {
  return types_scholarly.indexOf(this.doc_type) > -1;
}
ActivitySchema.methods.isAward = function () {
  return types_award.indexOf(this.doc_type) > -1;
}
ActivitySchema.methods.isGrant = function () {
  return types_grant.indexOf(this.doc_type) > -1;
}
ActivitySchema.methods.isService = function () {
  return types_service.indexOf(this.doc_type) > -1;
}

module.exports = mongoose.model('Activity', ActivitySchema);
