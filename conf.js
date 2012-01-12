module.exports = {
  db: {
    user: 'your mongo user',
    pass: 'your mongo user password',
    host: 'localhost',
    port: 27017,
    schema: 'livephotoalbum',
    options: {
      auto_reconnect: true, 
      native_parser: true
    }
  },
  hostname: 'your hostname',
  port: 3000,
  fb: {
        appId: 'fp app id',
        appSecret: 'fp app secret'
      },
  twit: {
        consumerKey: 'twitter app key',
        consumerSecret: 'twitter app secret'
      },
  google: {
        clientId: 'google client id',
        clientSecret: 'google client secret',
        scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email'
      }
};
