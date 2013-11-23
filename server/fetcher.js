var async = require('async');
var winston = require('winston');

var db = require('./db');
var ImapFetcher = require('./imapfetcher').ImapFetcher;

var MAXCOUNT = 10;

module.exports = function(imapopts) {
  var mimetypes = [/^image/, /^video/];
  var imap = new ImapFetcher(imapopts, mimetypes);

  return function fetcher(callback) {
    db.getMaxUid(function(err, maxuid) {
      if (err) return callback(err);
      imap.fetchNewMessages(maxuid, function(err, messages) {
        if (err) return callback(err);

        var sliced = messages.slice(0, MAXCOUNT);
        async.eachSeries(sliced, function(msg, cb) {
          imap.fetchMsgData(msg, function(err, msgdata) {
            if (err) return cb(err);

            // Author and title can be null, but timestamp falls back to server date
            var author = msgdata.header.from ? msgdata.header.from[0] : null;
            var title = msgdata.header.subject ? msgdata.header.subject[0] : null;
            var timestamp = msgdata.header.date ? new Date(msgdata.header.date[0]) : msgdata.date;
    
            db.addMessage({
              imap_uid: msgdata.uid,
              servertime: msgdata.date,
              author: author,
              title: title,
              timestamp: timestamp,
              files: msgdata.files
            }, cb);
          });
        }, function(err) {
          if (err) {
            callback(err);
          } else {
            var hasmore = (messages.length > sliced.length) || imap.hasNewMessages();
            callback(null, hasmore);
          }
        });
      });
    });
  };
};

