//schema for faculty members, includes PCI, PROFILE, admin, admin_perm
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//TODO: Add more fields once they are known
var PersonSchema = new Schema({
  BIO : String,
  RESEARCH_INTERESTS : String,
  TEACHING_INTERESTS : String
});

module.exports = mongoose.model('Person', PersonSchema);
