var winston = require('winston');

var config = require('./config');

var db = require('./server/db');
var filedb = require('./server/filedb');
var fetcher = require('./server/fetcher')(config.imap);

var app = require('./server/app');
var public = require('./server/public');
var private = require('./server/private');
var api = require('./server/api');
var admin = require('./server/admin');

function backgroundTask() {
  fetcher(function(err, hasmore) {
    if (err) winston.error('Fetcher error: '+err);
    filedb.processAll(function(err) {
      if (err) winston.error('File processing error: '+err);
      if (hasmore) backgroundTask();
      else setTimeout(backgroundTask, 60*1000);
    });
  });
}

var server = app(config);
public.setup(config, server);
private.setup(config, server);
api.setup(config, server);
admin.setup(config, server);

db.prepare(function(err) {
  if (err) winston.error('Preparing database error: '+err);
  filedb.processAll(function(err) {
    if (err) winston.error('File processing error: '+err);
    backgroundTask();
  });

  var port = process.env.PORT || 3000;
  server.listen(port);

  console.log('Listening on %d', port);
});
