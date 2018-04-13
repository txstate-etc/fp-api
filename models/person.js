//schema for faculty members, includes PCI, PROFILE, admin, admin_perm
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Path = require('path');
var Config = require('../helpers/configuration.js')

//TODO: Add more fields once they are known
var PersonSchema = new Schema({
  user_id : String,
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
  CURRICULUM_VITAE: String,
  PROFILE_PHOTO: String,
  positions: [{
    title : String,
    organization : {
      college: String,
      department: String,
      is_academic: Boolean
    }
  }]
});

PersonSchema.index({user_id: 1});
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

  var cvfname = Path.basename(person.CURRICULUM_VITAE);
  ret.uploadedcv = {
    filename: cvfname,
    path: Config.createlink('/files/cv/'+person.user_id+'/'+cvfname)
  }

  var ppfname = Path.basename(person.PROFILE_PHOTO);
  ret.portrait = {
    filename: ppfname,
    path: Config.createlink('/files/photo/'+person.user_id+'/'+ppfname)
  }

  ret.email = person.EMAIL;
  ret.office_location = "";
  ret.office_location += (person.BUILDING) ? `${person.BUILDING} ` : "";
  ret.office_location += (person.ROOMNUM) ? `${person.ROOMNUM}` : "";
  ret.phone_number = `(${person.OPHONE1}) ${person.OPHONE2}-${person.OPHONE3}`

  return ret;
}

module.exports = mongoose.model('Person', PersonSchema);
