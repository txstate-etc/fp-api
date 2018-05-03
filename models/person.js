//schema for faculty members, includes PCI, admin, admin_perm
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Path = require('path');
var Config = require('../helpers/configuration.js')
var cv = require('opencv')
var readChunk = require('read-chunk')
var fileType = require('file-type')

var PersonSchema = new Schema({
  user_id : Number,
  username : String,
  PREFIX : String,
  PFNAME : String,
  FNAME : String,
  MNAME : String,
  LNAME : String,
  SUFFIX : String,
  EMAIL : String,
  BUILDING: String,
  ROOMNUM: String,
  OPHONE1: String,
  OPHONE2: String,
  OPHONE3: String,
  DPHONE1: String,
  DPHONE2: String,
  DPHONE3: String,
  UPLOAD_VITA: String,
  UPLOAD_PHOTO: String,
  positions: [{
    title : String,
    organization : {
      college: String,
      department: String,
      is_academic: Boolean
    }
  }],
  cached_face_detection: { x: Number, y: Number, width: Number, height: Number, imgW: Number, imgH: Number },
  cached_face_detection_version: Number
});

PersonSchema.index({user_id: 1});
PersonSchema.index({UPLOAD_PHOTO: 1});
PersonSchema.index({cached_face_detection_version: 1});
PersonSchema.index({FNAME: 1}, {collation: {locale: 'en_US', strength: 2}});
PersonSchema.index({LNAME: 1}, {collation: {locale: 'en_US', strength: 2}});
PersonSchema.index({MNAME: 1}, {collation: {locale: 'en_US', strength: 2}});

PersonSchema.virtual('display_name').get(function () {
  var ret = [];
  if (this.PREFIX) ret.push(this.PREFIX);
  if (this.PFNAME) ret.push(this.PFNAME);
  else {
    if (this.FNAME) ret.push(this.FNAME);
    if (this.MNAME) ret.push(this.MNAME);
  }
  if (this.LNAME) ret.push(this.LNAME);
  if (this.SUFFIX) ret.push(this.SUFFIX);
  return ret.join(' ');
});

PersonSchema.methods.basic_info = function () {
  var ret = {};
  var person = this;
  ret.id = person.user_id;

  ret.display_name = person.display_name;

  ret.primary_title = "";
  if (person.positions && person.positions.length > 0 && person.positions[0].title)
    ret.primary_title = person.positions[0].title;

  ret.primary_department = "";
  if (person.positions && person.positions.length > 0 && person.positions[0].organization && person.positions[0].organization.department)
    ret.primary_department = person.positions[0].organization.department;

  return ret;
}

PersonSchema.methods.advanced_info = function () {
  var person = this;
  var ret = person.basic_info();

  if (person.positions && person.positions.length > 0) {
    ret.positions = [];
    person.positions.forEach(function(position) {
      ret.positions.push({"title" : position.title, "department": position.organization.department})
    })
  }

  if (person.UPLOAD_VITA) {
    var cvfname = Path.basename(person.UPLOAD_VITA);
    ret.uploadedcv = {
      filename: cvfname,
      path: Config.createlink('/files/cv/'+person.user_id+'/'+cvfname)
    }
  }

  if (person.UPLOAD_PHOTO) {
    var ppfname = Path.basename(person.UPLOAD_PHOTO);
    ret.portrait = {
      face: person.face_crop(),
      filename: ppfname,
      path: Config.createlink('/files/photo/'+person.user_id+'/'+ppfname)
    }
  }

  ret.email = person.EMAIL;
  ret.office_location = "";
  ret.office_location += (person.BUILDING) ? `${person.BUILDING} ` : "";
  ret.office_location += (person.ROOMNUM) ? `${person.ROOMNUM}` : "";
  if (person.OPHONE1 && person.OPHONE2 && person.OPHONE3)
    ret.phone_number = `(${person.OPHONE1}) ${person.OPHONE2}-${person.OPHONE3}`

  return ret;
}

PersonSchema.methods.face_crop = function () {
  var face = this.cached_face_detection
  var w = face.imgW;
  var h = face.imgH;
  var fw = face.width;
  var fh = face.height;
  var left = face.x;
  var right = w-fw-face.x;
  var top = face.y;
  var bottom = h-fh-face.y;

  var distance = Math.min(left, right, top, bottom);
  var box = {
    x: left - distance,
    y: top - distance,
    w: fw+2*distance,
    h: fh+2*distance
  }
  return {
    left: 100.0 * box.x / box.w,
    top: 100.0 * box.y / box.w,
    width: 100.0 * w / box.w
  }
}

PersonSchema.methods.face_detection = async function () {
  var person = this
  if (!person.UPLOAD_PHOTO) return {}

  var filepath = global.dm_files_path+person.UPLOAD_PHOTO
  console.log(filepath)

  var buffer = readChunk.sync(filepath, 0, 4100)
  var data = fileType(buffer)
  var ext = data ? data.ext : ''

  var info = {}
  if (['jpg','png','gif','tif','bmp'].includes(ext)) {
    info = await new Promise(function(resolve,reject) {
      cv.readImage(filepath, function (err, im) {
        if (err) return resolve({});
        im.detectObject(cv.FACE_CASCADE, {}, function (err, faces) {
          if (err || !faces || faces.length != 1) return resolve({});
          var face = faces[0];
          resolve({x: face.x, y: face.y, width: face.width, height: face.height, imgW: im.width(), imgH: im.height()})
        })
      })
    })
  }
  person.cached_face_detection_version = global.app_version
  person.cached_face_detection = info
  person.save()
}

PersonSchema.statics.watch_and_cache = async function () {
  var Person = mongoose.model('Person');
  var people = await Person.find({ UPLOAD_PHOTO: { $exists: true, $ne: '' }, cached_face_detection_version: { $ne: global.app_version } }).limit(50)

  if (people.length > 0) console.log('processing '+people.length+' profile photos looking for faces...')
  try {
    for (person of people) {
      await person.face_detection()
    }
  } catch(err)  {
    console.log(err)
  }
  setTimeout(Person.watch_and_cache, 9000)
}

module.exports = mongoose.model('Person', PersonSchema);
