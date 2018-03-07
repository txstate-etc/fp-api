//schema for faculty members, includes PCI, PROFILE, admin, admin_perm
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//TODO: Add more fields once they are known
var PersonSchema = new Schema({
  BIO : String,
  RESEARCH_INTERESTS : String,
  TEACHING_INTERESTS : String,
  username : String,
  PREFIX : String,
  FNAME : String,
  MNAME : String,
  LNAME : String,
  EMAIL : String
});

module.exports = mongoose.model('Person', PersonSchema);
