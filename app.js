var conf = require('./conf'),
    express = require('express'), 
    mongoose = require('mongoose'), 
    mongooseAuth = require('mongoose-auth'), 
    mongoStore = require('./lib/mongostore'),
    userSchema = require('./model/user'), 
    pictureSchema = require('./model/picture'),
    currentUserSchema = require('./model/current_user'),
    fs = require('fs'), 
    path = require('path'), 
    dateformat = require('dateformat'),
    form = require('connect-form');

var app = express.createServer(
          form({ keepExtensions: true }),
          express.cookieParser(), 
          express.session({ secret: 'itsasecrettoeverybody', cookie : { maxAge: 14400000 }, store: mongoStore}),
          mongooseAuth.middleware(), 
          express['static']( __dirname + "/public"),
          express.logger()),
    io = require('socket.io').listen(app),
    db = mongoose.createConnection('mongodb://'+conf.db.host + '/' + conf.db.schema),
    userFactory = db.model('User', userSchema),
    pictureFactory = db.model('Picture', pictureSchema),
    currentUserFactory = db.model('CurrentUser', currentUserSchema);

app.configure(function() {
  app.set('view engine', 'jade');
  app.set('views', __dirname+'/views');
});

app.configure('development', function() {
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});


app.get('/', function(req, res) {
  pictureFactory.find({}).sort('createdAt', -1).limit(10).run(function(err, images) {
    if (err) console.log(err);

    currentUserFactory.find({}).run(function(err, users) {
      if (err) console.log(err);
      res.render('index', {title : 'Home Page', images: images, conf: conf, users: users });
    });
  });
});

app.get('/login', function(req, res) {
  res.render('login', {title: 'Login'});
});

app.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

app.post('/add_image', function(req, res) {

  req.form.complete(function(err, fields, files){
    if (err) {
      next(err);
    } else {

      if (files.upload)
      {
        var filename = files.upload.name;

        var url_path = '/img/uploads/' + filename;
        var src_path = files.upload.path;
        var target_path = __dirname + '/public/img/uploads/' + filename;

        fs.renameSync(src_path, target_path);

        var newPic = new pictureFactory({src: url_path});
        newPic.save(function(err) {
          if(err) { console.log(err); } 
          res.redirect('/');
        });
      }
      else
      {
        var imgURL = fields.url;
      }
    }
  });

  // get and save image to fs
  // save to db
  // trigger socket message with image info
});

var parseCookie = require('connect').utils.parseCookie;

io.sockets.on('connection', function(socket) {
  var session = socket.handshake.session;
  var user = socket.handshake.user;

  // someone connected, need to add to list
  if (session.auth && session.auth.loggedIn)
  {
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
      currentUserFactory.remove({user_id: user._id}, function(err) {
        if(err) console.log(err);

        socket.broadcast.emit('disconnect_rcv', {id: 'u' + user._id, name: user.display_name});
      });
    }
  });

  socket.on('get_pic', function(data) {
    if (!data) {
      socket.emit('no_data');
      return;
    }
    if (session.auth && session.auth.loggedIn) {
      var d = {src: data, owner: user.display_name};

      var newPic = new pictureFactory(d);
      newPic.save(function(err) {
        if(err) { console.log(err); } 
      });

      socket.broadcast.emit('new_pic', d);
      socket.emit('new_pic', d);

      socket.broadcast.emit('chat_send', {user: user.display_name, msg: 'just uploaded photo ' + data});
      socket.emit('chat_send', {user: user.display_name, msg: 'just uploaded photo ' + data});
    } 
    else {
      socket.emit('not_logged_in');
    }
  });

  socket.on('chat_rcv', function(data) {
    if (data !== '')
    {
      if(session.auth && session.auth.loggedIn) {
        socket.broadcast.emit('chat_send', {user: user.display_name, msg: data});
        socket.emit('chat_send', {user: user.display_name, msg: data});
      }
      else {
        socket.emit('not_logged_in');
      }
    }
    else {
      socket.emit('no_data');
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
      }
      else {
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
console.log("running");

app.listen(3000);
