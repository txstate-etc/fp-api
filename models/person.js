//schema for faculty members, includes PCI, admin, admin_perm
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Path = require('path');
var Config = require('../helpers/configuration.js')
var cv = require('opencv')
var readChunk = require('read-chunk')
var fileType = require('file-type')
var path = require('path')
var exif = require('fast-exif')

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
  cached_face_detection_version: Number,
  lname_words: [String]
});

PersonSchema.index({user_id: 1});
PersonSchema.index({UPLOAD_PHOTO: 1});
PersonSchema.index({cached_face_detection_version: 1});
PersonSchema.index({FNAME: 1}, {collation: {locale: 'en_US', strength: 2}});
PersonSchema.index({LNAME: 1}, {collation: {locale: 'en_US', strength: 2}});
PersonSchema.index({MNAME: 1}, {collation: {locale: 'en_US', strength: 2}});
PersonSchema.index({lname_words: 1}, {collation: {locale: 'en_US', strength: 2}});

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

  if (person.UPLOAD_PHOTO) {
    var ppfname = Path.basename(person.UPLOAD_PHOTO);
    ret.portrait = {
      face: person.face_crop(),
      filename: ppfname,
      path: Config.createlink('/files/photo/'+person.user_id+'/'+ppfname)
    }
  }

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

  ret.email = person.EMAIL;
  ret.office_location = "";
  ret.office_location += (person.BUILDING) ? `${person.BUILDING} ` : "";
  ret.office_location += (person.ROOMNUM) ? `${person.ROOMNUM}` : "";
  if (person.OPHONE1 && person.OPHONE2 && person.OPHONE3)
    ret.phone_number = `(${person.OPHONE1}) ${person.OPHONE2}-${person.OPHONE3}`

  return ret;
}


PersonSchema.methods.face_crop = function (face) {
  face = face || this.cached_face_detection
  if (!face.width || face.width == 0) return { detected: false, aspect: face.imgH && face.imgH > 0 ? face.imgW / parseFloat(face.imgH) : 0 }
  var w = face.imgW;
  var h = face.imgH;
  var fw = face.width;
  var fh = face.height;
  var left = face.x;
  var right = w-fw-face.x;
  var top = face.y;
  var bottom = h-fh-face.y;

  var distance = Math.min(left, right, top, bottom)

  var x = left - distance
  var y = top - distance
  var nw = fw+2*distance
  var nh = fh+2*distance

  if (nw < fw * 1.5) {
    var needed = Math.floor(fw*1.5-nw);
    var adjust = Math.min(w-nw, h-nh, needed)

    nw += adjust
    x -= Math.min(x, Math.max(Math.ceil(adjust/2.0), nw+x-w))
    nh += adjust
    y -= Math.min(y, Math.max(Math.ceil(adjust/2.0), nh+y-h))
  }

  return {
    detected: true,
    left: 100.0 * x / nw,
    top: 100.0 * y / nw,
    width: 100.0 * w / nw
  }
}

PersonSchema.methods.face_detection = async function () {
  var person = this
  if (!person.UPLOAD_PHOTO) return {}

  var filepath = global.dm_files_path+person.UPLOAD_PHOTO
  console.log(filepath)

  var buffer = await readChunk(filepath, 0, 4100)
  var data = fileType(buffer)
  var ext = data ? data.ext : ''
  var exifdata = null
  try {
    exifdata = await exif.read(filepath)
  } catch (err) {
    // no exifdata, we'll live
  }

  var info = {}
  if (['jpg','png','gif','tif','bmp'].includes(ext)) {
    info = await new Promise(function(resolve,reject) {
      cv.readImage(filepath, function (err, im) {
        if (err) return resolve({});
        if (exifdata) {
          var rotation = exifdata.image.Orientation
          if (rotation == 3) im.rotate(180)
          if (rotation == 6) im.rotate(90)
          if (rotation == 8) im.rotate(-90)
        }

        process_image(im, 'alt2')
        .then(function (ifo) {
          return ifo.width ? ifo : process_image(im, 'alt')
        })
        .then(function (ifo) {
          return ifo.width ? ifo : process_image(im, 'default')
        })
        .then(function (ifo) {
          resolve(ifo)
        })
      })
    })
  }
  person.cached_face_detection_version = global.app_version
  person.cached_face_detection = info
  person.save()
  return info
}

var cascade_path = path.join(path.dirname(require.resolve("opencv")), '..', 'data');
var process_image = function(im, method) {
  return new Promise(function (resolve, reject) {
    setTimeout(function () { // since we do this three times, give the run loop a chance to run something else in between executions
      im.detectObject(cascade_path+'/haarcascade_frontalface_'+method+'.xml', {}, function (err, faces) {
        if (err || !faces) return resolve({});
        faces = faces.filter(function (face) { return face.width / parseFloat(im.width()) > 0.15 })
        if (faces.length == 0 || faces.length > 1) return resolve({imgW: im.width(), imgH: im.height()})
        var face = faces[0];
        resolve({x: face.x, y: face.y, width: face.width, height: face.height, imgW: im.width(), imgH: im.height()})
      })
    }, 0);
  })
}

PersonSchema.methods.lastname_index = function() {
  var person = this
  person.lname_words = person.LNAME.split(/\W+/)
  return person.save()
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

  people = await Person.find({ lname_words: { $exists: false } }).limit(100)
  for (person of people) {
    await person.lastname_index()
  }

  setTimeout(Person.watch_and_cache, 9000)
}

module.exports = mongoose.model('Person', PersonSchema);
