var _ = require('underscore');
var async = require('async');
var sqlite3 = require('sqlite3');

var db = new sqlite3.cached.Database('imakes.db', sqlite3.READWRITE);

exports.generateQuery = function(select, from, join, options) {
  if (!options) {
    options = join;
    join = [];
  }
  if (!Array.isArray(select)) select = [select];
  if (!Array.isArray(from)) from = [from];
  if (!Array.isArray(join)) join = [join];

  var query = {
    select: select,
    from: from,
    join: join,
    where: [],
    group_by: [],
    order_by: []
  };
  if (options.deleted != null) {
    query.where.push('message.deleted=' + (options.deleted?'1':'0'));
  }
  if (options.processed != null) {
    query.where.push('message.processed=' + (options.processed?'1':'0'));
  }
  if (_.isDate(options.from)) {
    query.where.push('message.timestamp >= ' + options.from.getTime());
  }
  if (_.isDate(options.until)) {
    query.where.push('message.timestamp <= ' + options.until.getTime());
  }
  if (typeof(options.search) === 'string') {
    var words = _.compact(options.search.split(' '));
    words.forEach(function(word) {
      // Escape each word separately
      word = word.toLowerCase();
      word = word.replace(/'/g, "''");
      word = word.replace(/%/g, "\\%");
      word = word.replace(/_/g, "\\_");
      query.where.push("message.search LIKE '%"+word+"%' ESCAPE '\\'");
    });
  }
  if (options.favorite != null) {
    if (options.favorite) {
      query.from.push('favorite');
      query.where.push('favorite.message_id=message.id');
    }
    var favtype = typeof(options.favorite);
    if (favtype === 'number' || favtype === 'string') {
      query.where.push('favorite.user_id='+parseInt(options.favorite));
    }
  } else {
    query.join.push('LEFT OUTER JOIN favorite ON favorite.message_id=message.id');
  }
  query.group_by = 'message.id';
  if (options.order_by) {
    query.order_by = options.order_by;
  }
  if (options.limit) {
    query.limit = options.limit;
  }
  if (options.offset) {
    query.offset = options.offset;
  }
  return query;
}

function joinStringArray(prefix, input, sep) {
  if (!sep) {
    sep = input;
    input = prefix;
    prefix = '';
  }
  if (Array.isArray(input)) {
    if (input.length === 0) {
      return '';
    } else {
      return prefix+input.join(sep);
    }
  } else {
    return prefix+input;
  }
}

function getQueryString(query, params) {
  var querystr='';

  querystr += joinStringArray('SELECT ', query.select, ',');
  querystr += joinStringArray(' FROM ', query.from, ',');
  if (query.join && query.join.length) {
    query.join.forEach(function(join) {
      querystr += ' '+join;
    });
  }
  if (query.where && query.where.length) {
    querystr += joinStringArray(' WHERE ', query.where, ' AND ');
  }
  if (query.group_by) {
    querystr += joinStringArray(' GROUP BY ', query.group_by, ',');
  }
  if (query.order_by) {
    querystr += joinStringArray(' ORDER BY ', query.order_by, ',');
  }
  if (query.limit) {
    querystr += ' LIMIT ?';
    params.push(query.limit);
  }
  if (query.limit && query.offset) {
    querystr += ' OFFSET ?';
    params.push(query.offset);
  }

  return querystr;
};

exports.listMessageQuery = function(query, params, callback) {
  db.all(getQueryString(query, params), params, function(err, rows) {
    if (err) return callback(err);
    if (!query.limit) {
      // If we had no limitations, total messages is equal to returned messages
      return callback(null, { totalMessages: rows.length, messages: rows });
    }

    query.order_by = null;
    if (query.limit && query.offset) {
      query.offset = null;
      params.pop();
    }
    if (query.limit) {
      query.limit = null;
      params.pop();
    }
    var querystr = 'SELECT COUNT(*) AS total FROM ('+getQueryString(query, params)+')';
    db.get(querystr, params, function(err, row) {
      if (err) return callback(err);
      callback(null, { totalMessages: row.total, messages: rows });
    });
  });
};

exports.populateMessage = function(message, callback) {
  async.parallel([
    function(callback) {
      var query = 'SELECT * FROM attachment WHERE filetype = image AND message_id = ?';
      var params = [message.id];
      db.all(query, params, function(err, rows) {
        if (err) return callback(err);
        rows.forEach(function(row) {
          if (row.exif) row.exif = JSON.parse(row.exif);
        });
        message.images = rows;
        callback();
      });
    },
    function(callback) {
      var query = 'SELECT * FROM attachment WHERE filetype = video AND message_id = ?';
      var params = [message.id];
      db.all(query, params, function(err, rows) {
        if (err) return callback(err);
        rows.forEach(function(row) {
          if (row.exif) row.exif = JSON.parse(row.exif);
        });
        message.videos = rows;
        callback();
      });
    },
    function(callback) {
      var query = 'SELECT user.*, favorite.timestamp AS timestamp FROM user,favorite WHERE user.id = favorite.user_id AND favorite.message_id = ?';
      var params = [message.id];
      db.all(query, params, function(err, rows) {
        if (err) return callback(err);
        message.favorited = rows;
        callback();
      });
    }
  ], function(err) {
    callback(err, message);
  });
};

