var sqlite3 = require('sqlite3');
var async = require('async');
var _ = require('underscore');

var db = new sqlite3.Database('imakes.db', sqlite3.OPEN_READONLY);
var detected = [];

console.log('Starting detecting duplicates');
db.all('SELECT * FROM message', function(err, rows) {
  async.each(rows, function(row, callback) {
    var query = 'SELECT id FROM message WHERE id>? AND title=?';
    var params = [row.id, row.title];
    db.all(query, params, function(err, rows) {
      if (err) return callback(err);
      if (rows.length > 0) {
        if (detected.indexOf(row.id) >= 0) {
          // Skip already detected row
          return callback();
        }
        var ids = _.pluck(rows, 'id');
        detected = detected.concat(ids);
        console.log('Found potential duplicates for id %d title "%s": %s', row.id, row.title, ids.join(','));
      }
      callback();
    });
  }, function(err) {
    console.log('Finished detecting duplicates');
  });
});
