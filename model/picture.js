var mongoose = require('mongoose'),
  Schema = mongoose.Schema, 
  ObjectId = Schema.ObjectId;

var picture = new Schema({
  owner : String,
  src : String,
  createdAt : {type: Date, default: Date.now}
});

module.exports = picture;
