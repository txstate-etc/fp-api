
module.exports = function() {
  this.toCSL = function(activity) {
    var cslObj = {};
    cslObj.id = activity.id;
    if (activity.doc_type == "INTELLCONT") {
      var type = getItemType(activity.CONTYPE, activity);
      var periodical = isPeriodical(type);
      if (type.length > 0) cslObj.type = type;
      if (activity.TITLE) cslObj.title = activity.TITLE;
      if (activity.PUBLISHER) cslObj.publisher = activity.PUBLISHER;
      if (activity.WEB_ADDRESS) cslObj.URL = activity.WEB_ADDRESS;
      if (activity.DOI) cslObj.DOI = activity.DOI;
      if (activity.PMCID) cslObj.PMCID = activity.PMCID;
      if (activity.ABSTRACT) cslObj.abstract = activity.ABSTRACT;
      if (activity.VOLUME) cslObj.volume = activity.VOLUME;
      if (activity.PAGENUM) cslObj.page = activity.PAGENUM;
      if (activity.NUMBER_OF_PAGES) cslObj["number-of-pages"] = activity.NUMBER_OF_PAGES
      if (activity.REVIEWED_WORK_TITLE) cslObj["reviewed-title"] = activity.REVIEWED_WORK_TITLE;
      if (activity.PUBCTYST || activity.PUBCNTRY) cslObj["publisher-place"] = getCSLPubPlace(activity.PUBCTYST, activity.PUBCNTRY )
      cslObj.author = [];
      for (var i=0; i<activity.INTELLCONT_AUTH.length; i++) {
        var author = activity.INTELLCONT_AUTH[i];
        var role = author.ROLE? author.ROLE.toLowerCase() : "author";
        if (role.indexOf('author') > -1 && role.indexOf('reviewed') == -1) {
          cslObj.author.push(buildCSLName(author))
        }
        else if ( role == "author of reviewed work") {
          if (!cslObj["reviewed-author"]) {
            cslObj["reviewed-author"] = [];
          }
          cslObj["reviewed-author"].push(buildCSLName(author))
        }
        else if (role == "editor") {
          if ( !cslObj.editor) {
            cslObj.editor = []
          }
          cslObj.editor.push(buildCSLName(author))
        }
        else if (role == "translator") {
          if ( !cslObj.translator) {
            cslObj.translator = []
          }
          cslObj.translator.push(buildCSLName(author))
        }
        else {
          cslObj.author.push(buildCSLName(author))
        }
      }
      if (activity.STATUS == "Published")
        cslObj.issued = getCSLIssuedDate(activity);
      //Handle ISBN and ISSN
      if (activity.ISBNISSN) {
        if (periodical) {
          cslObj.ISSN = activity.ISBNISSN;
        }
        else {
          cslObj.ISBN = activity.ISBNISSN;
        }
      }

      //container-title
      if (activity.TITLE_SECONDARY || activity.JOURNAL_NAME) {
        if (periodical) {
          cslObj["container-title"] = activity.JOURNAL_NAME || activity.TITLE_SECONDARY;
        }
        else {
          //they are supposed to use the secondary title but some use journal name
          cslObj["container-title"] = activity.TITLE_SECONDARY || activity.JOURNAL_NAME;
        }
      }

      if (activity.ISSUE) {
        if (periodical) {
          cslObj.issue = activity.ISSUE;
        }
        else {
          //use the actual edition if there is one, otherwise use the issue
          cslObj.edition = activity.EDITION? activity.EDITION : activity.ISSUE;
        }
      }
    }
    return cslObj;
  }
}

function getItemType(dmType, activity, secondtry = false) {
  switch (dmType) {
    case "Abstract":
    case "Journal Article":
      return "article-journal";
    case "Book":
    case "Textbook":
      return "book";
    case "Book Chapter":
      return "chapter";
    case "Book Review":
      return "review";
    case "Conference Proceeding":
      return "paper-conference";
    case "Encyclopedia Entry":
      return "entry-encyclopedia";
    case "Magazine / Trade Publication":
      return "article-magazine";
    case "Newsletter":
    case "Software":
      return "article"
    case "Newspaper Article":
      return "article-newspaper";
    case "Essay":
    case "Instructional Material":
    case "Poem":
    case "Report":
    case "Short Story":
      //not absolutely sure about this logic. sometimes they enter the journal name
      //for the title_secondary. is there a fool-proof way to tell if it is a book or journal?
      if (activity.JOURNAL_NAME) {
        return "article";
      } else return defaultItemType(activity)
    case "Other":
      if (activity.CONTYPEOTHER && !secondtry) {
        //TODO: Check "flexible matches" to try to figure out the type
        return getItemType(activity.CONTYPEOTHER, activity, true)
      } else return defaultItemType(activity)
    default:
      return defaultItemType(activity)
  }
}

function defaultItemType(activity) {
  return activity.TITLE_SECONDARY ? "chapter" : "book";
}

function isPeriodical(type) {
  var periodicals = ['article-journal', 'article-magazine', 'article-newspaper', 'article', 'review'];
  return periodicals.includes(type);
}

function buildCSLName(item) {
  var name = {};
  name.given = item.FNAME;
  if (item.MNAME) {
    name.given += ` ${item.MNAME}`;
  }
  name.family = item.LNAME;
  return name;
}

function getCSLIssuedDate(activity) {
  var issued = {};
  var month, day;
  if (activity.DTY_PUB) {
    issued.year = activity.DTY_PUB;
    month = activity.DTM_PUB;
    day = activity.DTD_PUB;
  }
  else if (activity.DTY_ACC) {
    issued.year = activity.DTY_ACC;
    month = activity.DTM_ACC;
    day = activity.DTD_ACC;
  }
  else if (activity.DTY_SUB) {
    issued.year = activity.DTY_SUB;
    month = activity.DTM_SUB;
    day = activity.DTD_SUB;
  }
  else if (activity.DTY_EXPSUB) {
    issued.year = activity.DTY_EXPSUB;
    month = activity.DTM_EXPSUB;
    day = activity.DTD_EXPSUB;
  }
  else {
    return issued;
  }
  if (day) issued.day = day;
  if (month) issued.month = getNumericalMonth(month);
  return issued;
}

function getNumericalMonth(month) {
  switch (month) {
    case "January":
    case "January (1st Quarter/Winter)":
      return 1;
    case "February":
      return 2;
    case "March":
      return 3;
    case "April":
    case "April (2nd Quarter/Spring)":
      return 4;
    case "May":
      return 5;
    case "June":
      return 6;
    case "July":
    case "July (3rd Quarter/Summer)":
      return 7;
    case "August":
      return 8
    case "September":
      return 9;
    case "October":
    case "October (4th Quarter/Autumn)":
      return 10;
    case "November":
      return 11;
    case "December":
      return 12;
    default:
      return 1;
  }
}

function getCSLPubPlace(cityState, country) {
  if (cityState && !country) {
    return cityState;
  }
  else if (!cityState && country) {
    return country;
  }
  else {
    return `${cityState}, ${country}`;
  }
}
