var winston = require('winston');

var config = require('./config');

var filedb = require('./server/filedb');
var fetcher = require('./server/fetcher')(config.imap);

var app = require('./server/app');
var public = require('./server/public');
var private = require('./server/private');
var api = require('./server/api');

function backgroundTask() {
  fetcher(function(err, hasmore) {
    if (err) winston.error(err);
    filedb.processAll(function(err) {
      if (err) winston.error(err);
      if (hasmore) backgroundTask();
      else setTimeout(backgroundTask, 60*1000);
    });
  });
}
filedb.processAll(function(err) {
  if (err) winston.error(err);
  backgroundTask();
});

var server = app(config);
public.setup(config, server);
private.setup(config, server);
api.setup(config, server);

var port = process.env.PORT || 3000;
server.listen(port);

console.log('Listening on %d', port);
