var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var FaceSchema = new Schema({
  user_id: {
    type: Number,
    index: true
  },
  filename: String,
  version: Number,
  info: { x: Number, y: Number, width: Number, height: Number, imgW: Number, imgH: Number }
})

module.exports = mongoose.model('Face', FaceSchema)
