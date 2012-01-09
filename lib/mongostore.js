var conf = require('../conf'), 
    Db = require('mongodb').Db, 
    Server = require('mongodb').Server,
    server_config = new Server(conf.db.host, conf.db.port, conf.db.options),
    db = new Db(conf.db.schema, server_config, {}),
    mongoStore = require('connect-mongodb');

module.exports = new mongoStore({db:db});
