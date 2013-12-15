var fs = require('fs');
var crypto = require('crypto');
var sqlite3 = require('sqlite3');
var async = require('async');
var mime = require('mime');
var sprintf = require('sprintf-js').sprintf;

var db = new sqlite3.cached.Database('imakes.db', sqlite3.READWRITE);
var filedb = require('./filedb');
var dbutils = require('./dbutils');

// Configure busyTimeout to avoid busy errors
db.configure('busyTimeout', 2000);

// Use some ugly undocumented hacks on the mime library
mime.extensions['image/jpg'] = 'jpg';
mime.extensions['image/jpeg'] = 'jpg';
mime.extensions['image/pjpeg'] = 'jpg';
mime.extensions['video/quicktime'] = 'mov';

exports.listUsers = function(callback) {
  db.all('SELECT * FROM user', callback);
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
      return db.run('COMMIT', callback);
    });
    db.get('SELECT last_insert_rowid() AS rowid', function(err, row) {
      var messageid = row.rowid;
      var images = message.files.filter(function(file) { return /^image/.test(file.mimetype); });
      var videos = message.files.filter(function(file) { return /^video/.test(file.mimetype); });

      images.forEach(function(image, idx) { image.idx = idx+1; });
      videos.forEach(function(video, idx) { video.idx = idx+1; });

      async.eachSeries(images, function(file, cb) {
        var extension = mime.extension(file.mimetype);
        var filename = sprintf('%05d_%02d.%s', messageid, file.idx, extension);
        filedb.addImage(filename, file.data, function(err) {
          if (err) return cb(err);

          var hash = crypto.createHash('sha256');
          hash.update(file.data);
          var digest = hash.digest('hex');

          var query = 'INSERT INTO image (message_id,mimetype,filename,checksum) VALUES (?,?,?,?)';
          var params = [messageid, file.mimetype, filename, digest];
          db.run(query, params, cb);
        });
      }, function(err) {
        if (err) return callback(err);
        async.eachSeries(videos, function(file, cb) {
          var extension = mime.extension(file.mimetype);
          var filename = sprintf('%05d_%02d.%s', messageid, file.idx, extension);
          filedb.addVideo(filename, file.data, function(err) {
            if (err) return cb(err);

            var hash = crypto.createHash('sha256');
            hash.update(file.data);
            var digest = hash.digest('hex');

            var query = 'INSERT INTO video (message_id,mimetype,filename,checksum) VALUES (?,?,?,?)';
            var params = [messageid, file.mimetype, filename, digest];
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
  var query = dbutils.generateQuery('message.*', 'message', options)
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

exports.listImages = function(options, callback) {
  if (!callback) {
    callback = options;
    options = {};
  }
  var params = [];
  var query = dbutils.generateQuery('message.*', ['message','image'], options)
  query.where.push('image.deleted=0');
  query.where.push('message.id=image.message_id');
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

exports.listVideos = function(options, callback) {
  if (!callback) {
    callback = options;
    options = {};
  }
  var params = [];
  var query = dbutils.generateQuery('message.*', ['message','video'], options)
  query.where.push('video.deleted=0');
  query.where.push('message.id=video.message_id');
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

exports.updateImage = function(image, callback) {
  var query = 'UPDATE image SET mimetype=?,width=?,height=?,exif=? WHERE id=?';
  var params = [image.mimetype, image.width, image.height, image.exif, image.id];
  db.run(query, params, function(err) {
    callback(err, image);
  });
};

exports.getImagePath = function(id, size, callback) {
  if (!callback) {
    callback = size;
    size = 'large';
  }
  var query = 'SELECT image.* '
            + 'FROM message, image '
            + 'WHERE message.deleted=0 AND image.deleted=0 AND message.processed=1 AND message.id=image.message_id AND image.id=?';
  var params = [id];
  db.get(query, params, function(err, row) {
    if (err) return callback(err);
    if (!row) return callback();
    filedb.getImagePath(row.filename, size, callback);
  });
};

exports.updateVideo = function(video, callback) {
  var query = 'UPDATE video SET mimetype=?,exif=? WHERE id=?';
  var params = [video.mimetype, video.exif, video.id];
  db.run(query, params, function(err) {
    callback(err, video);
  });
};

exports.getVideoPath = function(id, format, callback) {
  if (!callback) {
    callback = format;
    format = 'mp4';
  }
  var query = 'SELECT video.* '
            + 'FROM message, video '
            + 'WHERE message.deleted=0 AND video.deleted=0 AND message.processed=1 AND message.id=video.message_id AND video.id=?';
  var params = [id];
  db.get(query, params, function(err, row) {
    if (err) return callback(err);
    if (!row) return callback();
    filedb.getVideoPath(row.filename, format, callback);
  });
};

