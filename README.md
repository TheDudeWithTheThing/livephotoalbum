Live Photo Album
================

Live Photo Album is a chatroom with a live photo gallery where pictures that are posted are seen immediately by all connected users. The main purpose of this project was for me to play around with socket.io. The backend is using node, mongodb and the front end is twitter bootstrap, jquery, jquery-lightbox and jquery.imgCenter.

Install locally
---------------

### node v4
  `git clone https://github.com/joyent/node.git`

  `cd node`

  `git checkout v0.4`

  `configure && make && sudo make install`


### npm (node package manager)

  `curl http://npmjs.org/install.sh | sudo sh`

  or wget


### mongodb

  `brew install mongodb`

  or if you're not using homebrew

  <http://www.mongodb.org/downloads>

### live photo album

  `git clone git://github.com/TheDudeWithTheThing/livephotoalbum.git`

  `cd livephotoalbum`

  `npm install`
  
  Next change the values in the conf.js file and then start her up!

  `node app.js`
