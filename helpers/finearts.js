const artTemplates = {
  "collection" : "finearts_collection",
  "exhibition" : "finearts_exhibition",
  "galleryrepresentation" : "finearts_galleryrepresentation",
  "musiccomposition" : "finearts_musiccompositionrecordingauthoredplay",
  "production" : "finearts_productions",
  "residency" : "finearts_residencies",
  "commission" : "finearts_commissions",
  "review" : "finearts_catalogphotoreview"
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
        return citeArtComposition(activity);
        break;
      case "ARTS_PROD":
        return citeArtProduction(activity);
        break;
      case "ARTS_RESIDENCIES":
        return citeArtResidency(activity);
        break;
      case "ARTS_REVIEWS":
        return citeArtReview(activity);
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
    context.reviews = buildReviews(activity.REVIEW);
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
        context.venues = buildVenues(activity.VENUE);
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

function citeArtComposition(activity) {
  var context = {};
  var template;
  if (activity.TITLE) context.title = activity.TITLE;
  if (activity.PUBLISHER) context.publisher = activity.PUBLISHER;
  var year = activity.DTY_END || activity.DTY_START;
  if (year) context.year = `${year}`;
  if (activity.REVIEW.length > 0) {
    context.reviews = buildReviews(activity.REVIEW);
  }
  if (activity.VENUE.length > 0) {
    context.venues = buildVenues(activity.VENUE);
  }
  template = artTemplates.musiccomposition;
  var hbs = require('../fp-handlebars').getInstance();
  var citationTemplate = hbs.getTemplate(template);
  return citationTemplate(context)
}

function citeArtProduction(activity) {
  var context = {};
  var template = artTemplates.production;
  if (activity.TITLE) context.title = activity.TITLE;
  if (activity.ROLE) context.role = activity.ROLE;
  var dates = formatArtDates(activity.DTY_START, activity.DTM_START, activity.DTD_START, activity.DTY_END, activity.DTM_END, activity.DTD_END)
  if (dates) {
    context.dates = dates;
  }

  if (activity.REVIEW.length > 0) {
    context.reviews = buildReviews(activity.REVIEW);
  }
  if (['Dance Performance', 'Musical Performance', 'Theatrical Production'].indexOf(activity.TYPE) > -1) {
    context.performancesphrase = "Performances"
  }
  else {
    context.performancesphrase = "Showings"
  }
  if (activity.VENUE.length > 0) {
    context.venues = buildVenues(activity.VENUE);
  }

  var hbs = require('../fp-handlebars').getInstance();
  var citationTemplate = hbs.getTemplate(template);
  return citationTemplate(context)
}

function citeArtResidency(activity) {
  var context = {};
  var template;
  if (activity.LOCATION) context.location = activity.LOCATION;
  var dates = formatArtDates(activity.DTY_START, activity.DTM_START, activity.DTD_START, activity.DTY_END, activity.DTM_END, activity.DTD_END)
  if (dates) {
    context.dates = dates;
  }
  if (activity.TYPE == "Residency") {
    template = artTemplates.residency;
    if (activity.NAME) context.name = activity.NAME
    if (activity.ROLE) context.role = activity.ROLE
  }
  else {
    template = artTemplates.commission;
    if (activity.COMMISSION_TITLE) context["commission-title"] = activity.COMMISSION_TITLE;
    if (activity.TITLE) context.title = activity.TITLE;
    if (activity.COMMISSION_ORG_TYPE) context["commission-type"] = activity.COMMISSION_ORG_TYPE;
    if (activity.MEDIUM) context.medium = activity.MEDIUM;
  }
  var hbs = require('../fp-handlebars').getInstance();
  var citationTemplate = hbs.getTemplate(template);
  return citationTemplate(context)
}

function citeArtReview(activity) {
  var context = {};
  var template = artTemplates.review;

  if (activity.TITLE) context.title = activity.title;
  if (activity.PUBLICATION_TITLE) context["publication-title"] = activity.PUBLICATION_TITLE;
  if (activity.EDITION) context.edition = activity.EDITION;
  if (activity.VOLUME) context.volume = activity.VOLUME;
  if (activity.START_PAGE) context["start-page"] = activity.START_PAGE;
  if (activity.END_PAGE) context["end-page"] = activity.END_PAGE;
  if (activity.PUBLISHER_LOCATION) context["publisher-location"] = activity.PUBLISHER_LOCATION;
  if (activity.PUBLISHER) context.publisher = activity.PUBLISHER;
  if (activity.SCOPE) context.scope = activity.SCOPE;
  var dates = buildDate(activity.DTY_DATE, activity.DTM_DATE, activity.DTD_DATE);
  if (dates) context.dates = dates;
  if (activity.REVIEW_AUTH && activity.REVIEW_AUTH.length > 0) {
    context.reviews = buildReviews(activity.REVIEW_AUTH);
  }
  var hbs = require('../fp-handlebars').getInstance();
  var citationTemplate = hbs.getTemplate(template);
  return citationTemplate(context)
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

function buildReviews(data) {
  var reviews = [];
  data.forEach(function(rev) {
    var review = {};
    if (rev.REVIEW_TYPE) review.type = rev.REVIEW_TYPE;
    if (rev.LNAME) review.name = buildReviewerName(rev.FNAME, rev.MNAME, rev.LNAME);
    if (rev.TITLE) review.title = rev.TITLE
    reviews.push(review)
  })
  return reviews;
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

function buildVenues(data) {
  var venues = []
  data.forEach(function(ven) {
    var venue = {};
    if (ven.TITLE) venue.title = ven.TITLE;
    if (ven.NAME) venue.name = ven.NAME;
    if (ven.LOCATION) venue.location = ven.LOCATION;
    var venueDates = formatArtDates(ven.DTY_START, ven.DTM_START, ven.DTD_START, ven.DTY_END, ven.DTM_END, ven.DTD_END)
    if (venueDates) venue.dates = venueDates;
    venues.push(venue)
  })
  return venues;
}
