var winston = require('winston');

var config = require('./config');

var db = require('./server/db');
var filedb = require('./server/filedb');
var fetcher = require('./server/fetcher')(config.imap);

var app = require('./server/app');
var api = require('./server/api');
var render = require('./server/render');

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
api.setup(config, server);
render.setup(config, server);

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
