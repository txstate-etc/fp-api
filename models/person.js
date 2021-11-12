//schema for faculty members, includes PCI, admin, admin_perm
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Path = require('path');
var Config = require('../helpers/configuration.js')
var readChunk = require('read-chunk')
var fileType = require('file-type')
var path = require('path')
var exif = require('fast-exif')
var workerpool = require('workerpool').pool('/usr/src/app/face.js')
var Face = require('./face')

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
  lname_words: [String]
});

PersonSchema.index({user_id: 1});
PersonSchema.index({UPLOAD_PHOTO: 1});
PersonSchema.index({lname_words: 1}, {collation: {locale: 'en_US', strength: 2}});
PersonSchema.index({username: 1}, {collation: {locale: 'en_US', strength: 2}});

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

PersonSchema.virtual('face', {
  ref: 'Face',
  localField: 'user_id',
  foreignField: 'user_id',
  justOne: true
})

PersonSchema.methods.face_crop = function () {
  var face = this.face ? this.face.info : {}
  if (!face.width || face.width == 0) return { detected: false, aspect: face.imgH && face.imgH > 0 ? face.imgW / parseFloat(face.imgH) : 0 }
  var w = face.imgW;
  var h = face.imgH;
  var fw = face.width;
  var fh = face.height;
  var left = face.x;
  var right = w-fw-face.x;
  var top = face.y + (fh * 0.1);
  var bottom = Math.max(0, h-fh-top);

  // find a box that has an ideal zoom level on the face
  // it's ok if it goes off the canvas
  var idealzoom = 2.5
  var nw = Math.min(w, fw * idealzoom)
  var x = left - Math.floor((nw - fw) / 2)
  var nh = Math.min(h, fh * idealzoom)
  var y = top - Math.floor((nh - fh) / 2)

  // make our ideal box a square
  if (nw > nh) {
    x += Math.floor((nw - nh) / 2)
    nw = nh
  } else {
    y += Math.floor((nh - nw) / 2)
    nh = nw
  }

  // shift it onto the canvas
  if (x < 0) x = 0
  if (x + nw > w) x = w - nw
  if (y < 0) y = 0
  if (y + nh > h) y = h - nh

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
  var data = await fileType.fromBuffer(buffer)
  var ext = data ? data.ext : ''
  var exifdata = null
  try {
    exifdata = await exif.read(filepath)
  } catch (err) {
    // no exifdata, we'll live
  }

  var info = {}
  if (['jpg','png','gif','tif','bmp'].includes(ext)) {
    info = await workerpool.exec('face', [filepath, exifdata])
    if (!Object.keys(info).length) console.log(`could not detect face for ${this.basic_info().display_name} (${this.user_id})`)
  }
  this.face = this.face || new Face({ user_id: this.user_id })
  this.face.info = info
  this.face.version = global.person_version
  this.face.filename = person.UPLOAD_PHOTO
  await this.face.save()
  return info
}

PersonSchema.statics.watch_and_cache = async function () {
  var Person = mongoose.model('Person');
  var people = await Person.find({ UPLOAD_PHOTO: { $exists: true, $ne: '' } })
  var needsDetection = people.filter(p => !p.face || p.face.version !== global.person_version || p.UPLOAD_PHOTO !== p.face.filename)
  if (needsDetection.length > 0) console.log('processing '+needsDetection.length+' profile photos looking for faces...')
  for (var person of needsDetection) {
    try {
      await person.face_detection()
    } catch (e) {
      console.log(e)
    }
  }
}

PersonSchema.pre('find', function () { this.populate('face') })
PersonSchema.pre('findOne', function () { this.populate('face') })

module.exports = mongoose.model('Person', PersonSchema);
