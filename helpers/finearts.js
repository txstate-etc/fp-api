const artTemplates = {
  "collection" : "finearts_collection",
  "exhibition" : "finearts_exhibition",
  "galleryrepresentation" : "finearts_galleryrepresentation"
}

module.exports = function() {
  this.getFineArtsCitation = function(activity) {
    var context = {};
    if (activity.TITLE) context.title = activity.TITLE;
    switch (activity.doc_type) {
      case "ARTS_COLLECTIONS":
        return citeArtCollection(activity);
        break;
      case "ARTS_COMP":
          break;
      case "ARTS_PROD":
        break;
      case "ARTS_RESIDENCIES":
        break;
      case "ARTS_REVIEWS":
        break;
      default:
    }
  }
}

function citeArtCollection(activity) {
  var context = {};
  var template;
  if (activity.TITLE) context.title = activity.TITLE;
  if (activity.COLLECTION_NAME) context['collection-name'] = activity.COLLECTION_NAME;
  if (activity.LOCATION) context["collection-location"] = activity.LOCATION;
  if (activity.COLLECTION_TYPE) context['collection-type'] = activity.COLLECTION_TYPE;
  if (activity.MEDIUM) context.medium = activity.MEDIUM;
  context['date-range'] = formatArtDates(activity.DTY_START, activity.DTM_START, activity.DTD_START, activity.DTY_END, activity.DTM_END, activity.DTD_END)
  if (activity.REVIEW.length > 0) {
    var reviews = [];
    activity.REVIEW.forEach(function(rev) {
      var review = {};
      if (rev.REVIEW_TYPE) review.type = rev.REVIEW_TYPE;
      if (rev.LNAME) review.name = buildReviewerName(rev.FNAME, rev.MNAME, rev.LNAME);
      if (rev.TITLE) review.title = rev.TITLE
      reviews.push(review)
    })
    context.reviews = reviews;
  }
  switch (activity.TYPE) {
    case "Collection":
      if (activity.DTY_ACQUIRED) context['acquired-date'] = activity.DTY_ACQUIRED
      template = artTemplates.collection;
      break;
    case "Exhibition":
      if (activity.NUM_ARTISTS) context['num-artists'] = activity.NUM_ARTISTS
      if (activity.SCOPE) context.scope = activity.SCOPE
      if (activity.VENUE.length > 0) {
        context.venues = [];
        activity.VENUE.forEach(function(ven) {
          var venue = {};
          if (ven.TITLE) venue.title = ven.TITLE;
          if (ven.NAME) venue.name = ven.NAME;
          if (ven.LOCATION) venue.location = ven.LOCATION;
          var venueDates = formatArtDates(ven.DTY_START, ven.DTM_START, ven.DTD_START, ven.DTY_END, ven.DTM_END, ven.DTD_END)
          if (venueDates) venue.dates = venueDates;
          context.venues.push(venue)
        })
      }
      template = artTemplates.exhibition;
      break;
    case "Gallery Representation":
      template = artTemplates.galleryrepresentation;
      break;
    default:
      //should not happen
      return ""
  }
  if (template) {
    var hbs = require('../fp-handlebars').getInstance();
    var citationTemplate = hbs.getTemplate(template);
    return citationTemplate(context)
  }
}

function formatArtDates(startYear, startMonth, startDay, endYear, endMonth, endDay) {
  var date = "";
  if (startYear && !endYear) {
    date = buildDate(startYear, startMonth, startDay)
    date += " - Present";
  }
  else if (endYear && !startYear) {
    date = buildDate(endYear, endMonth, endDay)
  }
  else if (startYear && endYear) {
    var start = buildDate(startYear, startMonth, startDay)
    var end = buildDate(endYear, endMonth, endDay)
    return (start == end)? start : `${start} - ${end}`
  }
  return date;
}

function buildDate(year, month, day) {
  var date = "";
  if (month) {
    date += `${month} `;
    if (day) date += `${day}, `
  }
  date += `${year}`
  return date;
}

function buildReviewerName(first, middle, last) {
  var name = "";
  if (first) {
    name = first;
    if (middle) {
      name += ` ${middle}`;
    }
  }
  name += ` ${last}`
  return name;
}
