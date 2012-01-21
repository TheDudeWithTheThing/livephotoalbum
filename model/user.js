var everyauth = require('everyauth'), 
    conf = require('../conf'), 
    mongoose = require('mongoose'), 
    Schema = mongoose.Schema, 
    ObjectId = mongoose.SchemaTypes.ObjectId,
    mongooseAuth = require('mongoose-auth');

//everyauth.debug = true;

var UserSchema = new Schema({ name: {first: String, last: String} }), 
    User;


UserSchema.plugin(mongooseAuth, {
    everymodule: {
      everyauth: {
          User: function () {
            return User;
          },
          logoutRedirectPath: conf.path
      }
    },
    facebook: {
      everyauth: {
           myHostname: conf.hostname,
           appId: conf.fb.appId,
           appSecret: conf.fb.appSecret,
           redirectPath: conf.path
      }
    },
    twitter: {
      everyauth: {
          myHostname: conf.hostname,
          consumerKey: conf.twit.consumerKey,
          consumerSecret: conf.twit.consumerSecret,
          redirectPath: conf.path
      }
    },
    google: {
      everyauth: {
        myHostname: conf.hostname,
        appId: conf.google.clientId,
        appSecret: conf.google.clientSecret,
        scope: conf.google.scope,
        redirectPath: conf.path
      }
    }
});

UserSchema.virtual('display_name').get(function() {
  
  if(this.google.id)
  {
    return this.google.name.first;
  }

  if(this.twit.id) {
    return this.twit.name;
  }

  if(this.fb.id) {
    return this.fb.name.first;
  }

  return 'butts';
});

var db = mongoose.createConnection('mongodb://'+conf.db.host + '/' + conf.db.schema);
User = db.model('user', UserSchema);

module.exports = UserSchema;
