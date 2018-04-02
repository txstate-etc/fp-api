var Handlebars = require('handlebars')

//some helpers from the tk20 project

var Helpers =  {
  period: function(context) {
		context = safe_string(context);
		if (!context) return "";
		context.string = context.string.trim().replace(/,$/,'') + (/[\.\?!]\s*$/.test(context.string) ? '' : '.');
		return context;
	},
  ensureperiod : function(options) {
    var ret = options.fn(this).replace(/[,\s]*$/,'').replace(/,("|<\/\w+>)$/,'$1');
    if (ret.length > 0 && !/[\.\?!](<\/\w+>)?$/.test(ret)) ret += ".";
    return ret;
  },
  italic: function(context) {
		context = safe_string(context);
		if (!context) return "";
		context.string = '<em>'+context.string+'</em>';
		return context;
	},
  all: function() {
    var options = arguments[arguments.length-1];
		for (var i = 0; i < arguments.length-1; i++)
			if (!arguments[i] || !arguments[i].length > 0) return options.inverse(this);
		return options.fn(this);
  },
  any: function() {
    var options = arguments[arguments.length-1];
		for (var i = 0; i < arguments.length-1; i++)
      if (arguments[i] && arguments[i].length > 0) return options.fn(this);
		return options.inverse(this);
  },
  firstof: function() {
    for (var i = 0; i < arguments.length; i++) {
			var v = arguments[i];
			if (v && v.trim && v.trim().length > 0) return v;
		}
		return "";
  },
  ifequal: function() {
    var context = arguments[0];
		var options = arguments[arguments.length-1];
		if (!context) return options.inverse(this);
		for (var i = 1; i < arguments.length-1; i++)
			if (filterequal(context, arguments[i])) return options.fn(this);
		return options.inverse(this);
  },
  daterange: function (startdate, enddate) {
    if (startdate && !enddate) {
      return `${startdate} - Present`
    }
    else if (enddate.length > 0 && startdate.length == 0) {
      return enddate;
    }
    else if (startdate.length > 0 && enddate.length > 0)
      return (startdate == enddate)? startdate : `${startdate} - ${enddate}`
  },
  date: function(year, month, day) {
    if (!year) return "";
    var date = "";
    if (month) {
      date += `${month} `;
      if (day) date += `${day}, `
    }
    date += `${year}`
    return date;
  },
  anydate: function() {
    var options = arguments[arguments.length-1];
		for (var i = 0; i < arguments.length-1; i++)
			if (arguments[i] && !isEmptyDate(arguments[i])) return options.fn(this);
		return options.inverse(this);
  }
}

Helpers["ng-each"] = function(context, options) {
  var ret = "";

	if ( !context ) { return }

	for(var i=0, j=context.length; i<j; i++) {
		ret = ret + options.fn(context[i],{ data: {i:i, j:j} });
	}

	return ret;
}

Helpers["ng-first"] = function(options) {
  if ( options.data.i == 0 ) {
		return options.fn(this);
	} else {
		return options.inverse(this);
	}
}

Helpers["ng-last"] = function(options) {
  if ( options.data.i == options.data.j-1 ) {
		return options.fn(this);
	} else {
		return options.inverse(this);
	}
}

module.exports = Helpers;

var safe_string = function(context) {
		if (!context || (context.string && context.string.trim().length == 0) || (context.trim && context.trim().length == 0))
			return "";
		if (context.string) return context;
		return new Handlebars.SafeString(Handlebars.Utils.escapeExpression(context.trim()));
	};

var isEmptyDate = function(date) {
  return !(date.year || date.month || date.day)
}
