var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var index = require('./routes/index');
var profile = require('./routes/profile');
var profiles = require('./routes/profiles');
var department = require('./routes/department');
var search = require('./routes/search');
var files = require('./routes/files');

var handlebars = require('./fp-handlebars').getInstance();

require('./helpers/extensions.js');

global.person_version = 10;
global.activity_version = 5;

var app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// database setup
var mongoose = require('mongoose');
var db_host = process.env.DB_HOST || 'localhost';
var db_port = process.env.DB_PORT || '27017';
var db_authdb = process.env.DB_AUTHDATABASE || '';
var db_user = process.env.DB_USER || '';
var db_pw = process.env.DB_PASSWORD || '';
var db_name = process.env.DB_DATABASE || 'facultyprofiles';
var db_userpassword_prefix = '';
if (db_user.length > 0 && db_pw.length > 0) db_userpassword_prefix = db_user+':'+db_pw+'@';
var db_authdb_suffix = '';
if (db_authdb.length > 0) db_authdb_suffix = '?authSource='+db_authdb;

var db_connect = async function () {
  try {
    await mongoose.connect('mongodb://'+db_userpassword_prefix+db_host+':'+db_port+'/'+db_name+db_authdb_suffix, {
      ssl: process.env.DB_SSL == 'true' ? true : false,
      maxPoolSize: 20,
      // useUnifiedTopology: true, <-- deprecated as an option and always treated as true now.
      // useNewUrlParser: true <-- deprecated as an option and always treated as true now.
    })
  } catch (e) {
    console.error(e)
    return setTimeout(db_connect, 5000)
  }
  console.log("DB connection alive");

  var Activity = require('./models/activity');
  var Person = require('./models/person');

  while (true) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    await Activity.watch_and_cache();
    await Person.watch_and_cache();
  }
}
db_connect().catch(function (err) {
  console.error(err);
})

global.dm_files_path = process.env.DM_FILE_PATH || '/fp-files/';


app.use('/', index);
app.use('/profile', profile);
app.use('/profiles', profiles);
app.use('/department', department);
app.use('/search', search);
app.use('/files', files);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  //res.render('error');
  res.send(err.message)
});

module.exports = app;
