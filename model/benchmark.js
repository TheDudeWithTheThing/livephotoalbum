var mongoose = require('mongoose'),
  Schema = mongoose.Schema, 
  ObjectId = Schema.ObjectId;

module.exports = new Schema({
    bench : {type: Date, default: Date.now}
  , garbage : String
});
