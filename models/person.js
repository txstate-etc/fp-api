//schema for faculty members, includes PCI, PROFILE, admin, admin_perm
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//TODO: Add more fields once they are known
var PersonSchema = new Schema({
  username : String,
  PREFIX : String,
  FNAME : String,
  MNAME : String,
  LNAME : String,
  EMAIL : String,
  BUILDING: String,
  ROOMNUM: String,
  OPHONE1: String,
  OPHONE2: String,
  OPHONE3: String,
  DPHONE1: String,
  DPHONE2: String,
  DPHONE3: String,
  positions: [{
    title : String,
    organization : {
      college: String,
      department: String,
      is_academic: Boolean
    }
  }]
});

PersonSchema.methods.basic_info = function () {
  var ret = {};
  var person = this;
  ret.userid = person.username;

  ret.display_name = "";
  ret.display_name += (person.PREFIX) ? `${person.PREFIX} ` : "";
  ret.display_name += (person.FNAME) ? `${person.FNAME} ` : "";
  ret.display_name += (person.MNAME) ? `${person.MNAME} ` : "";
  ret.display_name += (person.LNAME) ? `${person.LNAME}` : "";

  ret.primary_title = "";
  if (person.positions && person.positions.length > 0 && person.positions[0].title)
    ret.primary_title = person.positions[0].title;

  ret.primary_department = "";
  if (person.positions && person.positions.length > 0 && person.positions[0].organization && person.positions[0].organization.department)
    ret.primary_department = person.positions[0].organization.department;

  return ret;
}

module.exports = mongoose.model('Person', PersonSchema);
