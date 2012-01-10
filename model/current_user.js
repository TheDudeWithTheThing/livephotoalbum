var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  ObjectId = Schema.ObjectId;

var current_user = new Schema({
  name: String,
  user_id: ObjectId
});

module.exports = current_user;
