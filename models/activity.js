//schema for activities (scholarly/creative, service, awards, grants)
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

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
  DTD_PUB : Number,
  DTY_PUB : Number,
  DTM_ACC : String,
  DTD_ACC : Number,
  DTY_ACC : Number,
  DTM_SUB : String,
  DTD_SUB : Number,
  DTY_SUB : Number,
  DTM_EXPSUB : String,
  DTD_EXPSUB : Number,
  DTY_EXPSUB : Number,
  DTM_START : String,
  DTD_START : Number,
  DTY_START : Number,
  DTM_END : String,
  DTD_END : Number,
  DTY_END : Number,
  DTM_DATE : String,
  DTD_DATE : Number,
  DTY_DATE : Number,
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
  DTD_ACQUIRED : Number,
  DTY_ACQUIRED : Number,
  COLLECTION_TYPE : String,
  VENUE: [{
    TITLE : String,
    NAME: String,
    LOCATION: String,
    DTM_END : String,
    DTD_END : Number,
    DTY_END : Number
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
  //start arts_reviews
  PUBLICATION_TITLE : String,
  PUBLISHER_LOCATION : String,
  NUM_VOLUMES : {
    type: Number,
    alias: 'number-of-volumes'
  },
  //start of awardhonor
  ORG : String,
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
});

module.exports = mongoose.model('Activity', ActivitySchema);
