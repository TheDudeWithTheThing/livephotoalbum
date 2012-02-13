var conf = require('./conf') 
  , express = require('express')
  , mongoose = require('mongoose')
  , mongooseAuth = require('mongoose-auth')
  , mongoStore = require('./lib/mongostore')
  , userSchema = require('./model/user')
  , pictureSchema = require('./model/picture')
  , currentUserSchema = require('./model/current_user')
  , benchmarkSchema = require('./model/benchmark')
  , fs = require('fs') // used for writing POSTed pics to fs
  , path = require('path') // used for POSTed pics
  , form = require('connect-form')  // used for POSTed pics
  , crypto = require('crypto');  // used in benchmark to save garbage data

// need to create token for when proxying for remote address
express.logger.token('real_ip', function(req, res) { return req.headers['x-forwarded-for'] || req.socket.remoteAddress; });

var app = express.createServer(
            form({ keepExtensions: true })
          , express.cookieParser()
          , express.session({ secret: 'itsasecrettoeverybody', cookie : { maxAge: 14400000 }, store: mongoStore})
          , mongooseAuth.middleware()
          , express['static']( __dirname + "/public")
          , express.logger(':real_ip - - [:date] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"'))
  , io = require('socket.io').listen(app)
  , db = mongoose.createConnection('mongodb://'+conf.db.host + '/' + conf.db.schema)
  , userFactory = db.model('User', userSchema)
  , pictureFactory = db.model('Picture', pictureSchema)
  , currentUserFactory = db.model('CurrentUser', currentUserSchema)
  , benchmarkFactory = db.model('Benchmark', benchmarkSchema);

app.configure(function() {
  app.set('view engine', 'jade');
  app.set('views', __dirname+'/views');
});

// dump errors in dev environment
app.configure('development', function() {
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

// root
app.get('/', function(req, res) {
  pictureFactory.find({}).sort('createdAt', -1).limit(9).run(function(err, images) {
    if (err) console.log(err);
  
    currentUserFactory.find({}).run(function(err, users) {
      if (err) console.log(err);
      res.render('index', {title : 'Home Page', images: images, conf: conf, users: users });
    });
  });
});

app.get('/benchmark_read', function(req, res) {

  benchmarkFactory.find({}).limit(10).run( function(err, benches) {
    res.render('benchmark', {title: 'Bench', values: benches, conf: conf});
  });

});

app.get('/benchmark_write', function(req, res) {

  var uniq_id = crypto.
    createHash('md5').
    update("" + (new Date()).getTime()).
    digest("hex");

  var newBench = new benchmarkFactory({garbage: uniq_id}); 
  newBench.save(function(err) {
    if(err) {
      console.log(err);
      res.send(404);
    }

    res.send('OK!');
  });
});

// logout for everyauth
app.get('/logout', function(req, res) {
  req.logout();
});


// added for adding actual images not just URLs
app.post('/add_image', function(req, res) {

  req.form.complete(function(err, fields, files) {
    if (err) {
      next(err);
    } else {

      if (files.upload) {
        var filename = files.upload.name
          , url_path = '/img/uploads/' + filename
          , src_path = files.upload.path
          , target_path = __dirname + '/public/img/uploads/' + filename
          , newPic = new pictureFactory({src: url_path});

        fs.renameSync(src_path, target_path);

        newPic.save(function(err) {
          if(err) { console.log(err); } 
          res.redirect('/');
        });
      }
      else {
        var imgURL = fields.url;
      }
    }
  });

});

var parseCookie = require('connect').utils.parseCookie;

io.configure('production', function(){
  io.enable('browser client minification');  // send minified client
  io.enable('browser client etag');          // apply etag caching logic based on version number
  io.enable('browser client gzip');          // gzip the file
  io.set('log level', 1);                    // reduce logging
  io.set('transports', [                     // enable all transports (optional if you want flashsocket)
      'websocket' 
    , 'htmlfile'
    , 'xhr-polling'
    , 'jsonp-polling'
    ]);
});


io.sockets.on('connection', function(socket) {
  var session = socket.handshake.session
    , user = socket.handshake.user;

  // someone connected, need to add to current user list
  if (session.auth && session.auth.loggedIn) {

    currentUserFactory.find({user_id: user._id}).run( function(err, foundUser) {
      if(!foundUser.length) {

        var currentUser = new currentUserFactory({name: user.display_name, user_id: user._id});
        currentUser.save( function(err) {
          if(err) console.log(err);

          socket.broadcast.emit('connect_rcv', {id: 'u' + user._id, name: user.display_name});
          socket.emit('connect_rcv', {id: 'u' + user._id, name: user.display_name});
        });
      }
    });
  }

  socket.on('disconnect', function() {
    if (session.auth && session.auth.loggedIn) {
      // on disconnect remove from current user list
      currentUserFactory.remove({user_id: user._id}, function(err) {
        if(err) console.log(err);
        // tell clients this user disconnected
        socket.broadcast.emit('disconnect_rcv', {id: 'u' + user._id, name: user.display_name});
      });
    }
  });

  socket.on('get_pic', function(data) {
    if (!data) {
      socket.emit('error', "No Data");
      return;
    }
    if (session.auth && session.auth.loggedIn) {
      var d = {src: data, owner: user.display_name}
        , newPic = new pictureFactory(d);

      newPic.save(function(err) {
        // error saving, avoid broadcasting a fail save image
        if(err) { console.log(err); return; } 
      
        // adds to list
        socket.broadcast.emit('new_pic', d);
        socket.emit('new_pic', d);

        // grab just the file name from the URL for putting in a chat message
        var img_name = data.match(/[\w_.-]*?(?=\?)|[\w_.-]*$/);

        // broadcast to users and self
        socket.broadcast.emit('chat_send', {user: user.display_name, msg: 'just uploaded photo ' + img_name});
        socket.emit('chat_send', {user: user.display_name, msg: 'just uploaded photo ' + img_name});
      });
    } else {
      socket.emit('error', 'Not Logged In');
    }
  });

  socket.on('chat_rcv', function(data) {
    if (data !== '') {
      if(session.auth && session.auth.loggedIn) {
        socket.broadcast.emit('chat_send', {user: user.display_name, msg: data});
        socket.emit('chat_send', {user: user.display_name, msg: data});
      }
      else {
        socket.emit('error', "Not Logged In");
      }
    } else {
      socket.emit('error', "No Data");
    }
  });
});

// grabbed from http://www.danielbaulig.de/socket-ioexpress/
io.set('authorization', function (data, accept) {
  if(data.headers.cookie) {
    data.cookie = parseCookie(data.headers.cookie);
    data.sessionId = data.cookie['connect.sid'];
    mongoStore.get(data.sessionId, function(err, session) {
      if(err || !session) {
        console.log('### session not valid');
        accept('Not Authenticated Error', false);
      } else {
        data.session = session;
        for (var u in session.auth) {
          var userId = session.auth.userId;
        }
        userFactory.findById(userId, function(err, user) {
          if (err) {
            console.log('###');
            console.log(err);
            accept('Not Authenticated Error', false);
          }
          data.user = user;
          accept(null, true);
        });
      }
    });
  }
});

mongooseAuth.helpExpress(app);
console.log("running on port " + conf.port);

app.listen(conf.port);
