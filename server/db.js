var fs = require('fs');
var crypto = require('crypto');
var sqlite3 = require('sqlite3');
var async = require('async');
var mime = require('mime');
var sprintf = require('sprintf-js').sprintf;

var db = new sqlite3.cached.Database('imakes.db', sqlite3.READWRITE);
var filedb = require('./filedb');
var dbutils = require('./dbutils');

// Use some ugly undocumented hacks on the mime library
mime.extensions['image/jpg'] = 'jpg';
mime.extensions['image/jpeg'] = 'jpg';
mime.extensions['image/pjpeg'] = 'jpg';
mime.extensions['video/quicktime'] = 'mov';

exports.prepare = function(callback) {
  // Configure busyTimeout to avoid busy errors
  db.configure('busyTimeout', 2000);

  // Enable foreign keys, disabled by default
  db.run('PRAGMA foreign_keys=ON', callback);
};

exports.listUsers = function(callback) {
  db.all('SELECT * FROM user', callback);
};

exports.listAuths = function(callback) {
  db.all('SELECT * FROM auth', callback);
};

exports.listAliases = function(callback) {
  db.all('SELECT * FROM alias', callback);
};

exports.getUser = function(userid, callback) {
  var query = 'SELECT * FROM user WHERE id=?';
  var params = [userid];
  db.get(query, params, callback);
}

function getUserAuth(userid, authid, callback) {
  var fields = [
    'user.*',
    'auth.id AS auth_id',
    'auth.provider AS provider',
    'auth.identifier AS identifier',
    'auth.username AS username',
    'auth.displayname AS displayname'
  ];
  var query = 'SELECT '+fields.join(',')+' FROM user, auth ' +
    'WHERE user.disabled=0 AND user.id = auth.user_id AND user.id=? AND auth.id=?';
  var params = [userid, authid];
  db.get(query, params, callback);
}
exports.getUserAuth = getUserAuth;

exports.findUserAuth = function(provider, identifier, callback) {
  var fields = [
    'user.*',
    'auth.id AS auth_id',
    'auth.provider AS provider',
    'auth.identifier AS identifier',
    'auth.username AS username',
    'auth.displayname AS displayname'
  ];
  var query = 'SELECT '+fields.join(',')+' FROM user, auth ' +
    'WHERE user.disabled=0 AND user.id = auth.user_id AND auth.provider=? AND auth.identifier=?';
  var params = [provider, identifier];
  db.get(query, params, callback);
};

exports.updateUserAuth = function(user, callback) {
  var query = 'UPDATE auth SET provider=?,identifier=?,username=?,displayname=?,lastlogin=? WHERE id=?';
  var params = [user.provider, user.identifier, user.username, user.displayname, user.lastlogin, user.auth_id];
  db.run(query, params, function(err) {
    if (err) return callback(err);
    query = 'UPDATE user SET lastlogin=? WHERE id=?';
    params = [user.lastlogin, user.id];
    db.run(query, params, function(err) {
      if (err) return callback(err);
      getUserAuth(user.id, user.auth_id, callback);
    });
  });
};

exports.getMaxUid = function(callback) {
  db.get('SELECT MAX(imap_uid) AS max_uid FROM message', function(err, row) {
    var value = (row && row.max_uid) || 0;
    callback(err, value);
  });
};

exports.setFavorite = function(userid, msgid, callback) {
  var query = 'INSERT OR IGNORE INTO favorite (user_id, message_id, timestamp) VALUES (?,?,?)';
  var params = [userid, msgid, new Date()];
  db.run(query, params, callback);
};

exports.deleteFavorite = function(userid, msgid, callback) {
  var query = 'DELETE FROM favorite WHERE user_id=? AND message_id=?';
  var params = [userid, msgid];
  db.run(query, params, callback);
};

exports.getStatistics = function(callback) {
  var year = "strftime('%Y', message.timestamp/1000, 'unixepoch')";
  var month = "strftime('%m', message.timestamp/1000, 'unixepoch')";
  var query = 'SELECT '+year+' AS year, '+month+' AS month, COUNT(attachment.id) AS count, user1.name AS user1, message.author as author, user2.name AS user2 '
            + 'FROM message, attachment '
            + 'LEFT OUTER JOIN user user1 ON message.user_id = user1.id '
            + 'LEFT OUTER JOIN alias ON message.author = alias.author '
            + 'LEFT OUTER JOIN user user2 ON alias.user_id = user2.id '
            + 'WHERE message.id=attachment.message_id AND message.deleted=0 AND attachment.deleted=0 '
            + 'GROUP BY author, year, month';
  db.all(query, callback);
};

function getSearchString(message) {
  var search = new Date(message.timestamp).toISOString();
  if (message.author) search += ' '+message.author.toLowerCase();
  if (message.title) search += ' '+message.title.toLowerCase();
  return search;
}
exports.getSearchString = getSearchString;

exports.addMessage = function(message, callback) {
  db.serialize(function() {
    var query = 'INSERT INTO message (imap_uid,servertime,author,title,timestamp,search) VALUES (?,?,?,?,?,?)';
    var params = [message.imap_uid, message.servertime, message.author, message.title, message.timestamp, getSearchString(message)];

    db.run('BEGIN TRANSACTION'); 
    db.run(query, params, function(err) {
      // This is a duplicate message
      // Prevent filedb methods from being run
      if (err) return db.run('COMMIT', callback);

      db.get('SELECT last_insert_rowid() AS rowid', function(err, row) {
        var messageid = row.rowid;
        var files = message.files.filter(function(file) { return /^(image|video)/.test(file.mimetype); });
        files.forEach(function(file, idx) { file.idx = idx+1; });

        async.eachSeries(files, function(file, cb) {
          var extension = mime.extension(file.mimetype);
          var filetype = /^image/.test(file.mimetype) ? "image" : "video";
          var filename = sprintf('%05d_%02d.%s', messageid, file.idx, extension);

          var addFile = (filetype === "image") ? filedb.addImage : filedb.addVideo;
          addFile(filename, file.data, function(err) {
            if (err) return cb(err);

            var hash = crypto.createHash('sha256');
            hash.update(file.data);
            var digest = hash.digest('hex');

            var query = 'INSERT INTO attachment (filetype,message_id,mimetype,filename,checksum) VALUES (?,?,?,?,?)';
            var params = [filetype, messageid, file.mimetype, filename, digest];
            db.run(query, params, cb);
          });
        }, function(err) {
          db.run('COMMIT', callback);
        });
      });
    });
  });
};

exports.markProcessed = function(id, callback) {
  db.run('UPDATE message SET processed=1 WHERE id=?', id, callback);
};

exports.getMessage = function(id, callback) {
  var query = 'SELECT * FROM message WHERE deleted=0 AND id=?';
  var params = [id];
  db.get(query, params, function(err, row) {
    if (err) return callback(err);
    if (!row) return callback();
    dbutils.populateMessage(row, callback);
  });
};

exports.listMessages = function(options, callback) {
  if (!callback) {
    callback = options;
    options = {};
  }
  var params = [];
  var tables = ['message','attachment'];
  if (options.userid) tables.push('alias');
  var query = dbutils.generateQuery('message.*', tables, options)
  query.where.push('attachment.deleted=0');
  query.where.push('message.id=attachment.message_id');
  if (options.userid) {
    query.where.push('(message.user_id=? OR (message.author=alias.author AND alias.user_id=?))');
    params = params.concat([options.userid, options.userid]);
  }
  if (options.images && options.videos) {
    query.where.push('attachment.filetype IN ("image", "video")');
  } else if (options.images) {
    query.where.push('attachment.filetype="image"');
  } else if (options.videos) {
    query.where.push('attachment.filetype="video"');
  }
  dbutils.listMessageQuery(query, params, function(err, result) {
    if (err) return callback(err);
    async.each(result.messages, function(message, callback) {
      dbutils.populateMessage(message, callback);
    }, function(err) {
      if (err) callback(err);
      else callback(null, result);
    });
  });
};

exports.updateAttachment = function(attachment, callback) {
  var query = 'UPDATE attachment SET mimetype=?,width=?,height=?,metadata=? WHERE id=?';
  var params = [attachment.mimetype, attachment.width, attachment.height, attachment.metadata, attachment.id];
  db.run(query, params, function(err) {
    callback(err, attachment);
  });
};

exports.getAttachmentPath = function(id, type, callback) {
  if (!callback) {
    callback = type;
    type = null;
  }
  var query = 'SELECT attachment.* '
            + 'FROM message, attachment '
            + 'WHERE message.deleted=0 AND attachment.deleted=0 AND message.processed=1 AND message.id=attachment.message_id AND attachment.id=?';
  var params = [id];
  db.get(query, params, function(err, row) {
    if (err) return callback(err);
    if (!row) return callback();
    if (row.filetype === "image") {
      type = type || 'large';
      return filedb.getImagePath(row.filename, type, callback);
    }
    if (row.filetype === "video") {
      type = type || 'mp4';
      return filedb.getVideoPath(row.filename, type, callback);
    }
    return callback();
  });
};

