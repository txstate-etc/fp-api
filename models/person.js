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
  OPHONE3: String
});

module.exports = mongoose.model('Person', PersonSchema);
