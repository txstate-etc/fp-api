module.exports = function() {

  this.buildScolarlyCreativeCitation = function(activity) {
    //just a temporary too-minimal citation
    var year = activity.DTY_PUB || activity.DTY_ACC || activity.DTY_SUB || activity.DTY_EXPSUB
    var title = activity.TITLE;
    return `(${year}) ${title}`;
  };

  this.buildAwardCitation = function(activity) {
    //just a temporary too-minimal citation
    return `${activity.NAME}, ${activity.ORG}. (${activity.DTY_END})`;
  }

  this.buildGrantCitation = function(activity) {
    //just a temporary too-minimal citation
    return `${activity.TITLE}`;
  }

  this.buildServiceCitation = function(activity) {
    //just a temporary too-minimal citation
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
