var util = require('util'),
    Imap = require('imap'),
    mmm = require('mmmagic'),
    _ = require('underscore'),
    winston = require('winston');

var ImapFetcher = (function() {
  function ImapFetcher(imapopts, mimetypes) {
    this.imap = new Imap(imapopts || {});
    this.mimetypes = mimetypes || [];
    this.magic = new mmm.Magic(mmm.MAGIC_MIME_TYPE);

    var self = this;
    this.imap.on('mail', function(msgnum) {
      self.newMessages = true;
    });
  }

  ImapFetcher.prototype.shouldFetchMimetype = function(mimetype) {
    var mimetypes = this.mimetypes;

    // Each accepted mimetype can be either a full string or a regexp
    for (i=0; i<this.mimetypes.length; i++) {
      if (_.isString(this.mimetypes[i]) && this.mimetypes[i] === mimetype) {
        return true;
      } else if (_.isRegExp(this.mimetypes[i]) && this.mimetypes[i].test(mimetype)) {
        return true;
      }
    }
    return false;
  };

  // Process a message with only struct data and no body
  // NOTE: If you use any other async than events, make
  //       sure to modify the caller respectively
  ImapFetcher.prototype.processMsg = function(msg, cb) {
    var self = this;
    var attrs = {};
    var files = [];
    var binaries = [];

    msg.once('attributes', function(attributes) {
      attrs = attributes;
      if (!attrs.struct) return;

      // Recursive search through attachments
      function searchAttachments(struct) {
        var mimetype, target = [];

        if (struct.length > 1) {
          _.each(struct, function(attachment) {
            searchAttachments(attachment);
          });
        } else if (struct.length === 1) {
          mimetype = struct[0].type + '/' + struct[0].subtype;
          if (mimetype === 'application/octet-stream') {
            winston.debug('Found application/octet-stream, add to binaries for magic test');
            target = binaries;
          } else if (self.shouldFetchMimetype(mimetype)) {
            target = files;
          } else {
            winston.debug('Rejected mimetype: %s', mimetype);
            return;
          }
          if (struct[0].encoding.toLowerCase() === 'base64') {
            target.push(struct[0]);
          } else {
            winston.warn('Ignoring file %s because of unsupported encoding %s', mimetype, struct[0].encoding);
          }
        }
      }
      searchAttachments(attrs.struct);
      if (files.length === 0 && binaries.length === 0) {
        winston.warn('Found a message UID %d with no suitable attachments', attrs.uid);
        winston.debug(util.inspect(attrs, false, null));
      }
    });
    msg.once('end', function() {
      var message = _.pick(attrs, 'uid', 'flags', 'date');
      message.files = files;
      message.binaries = binaries;
      winston.debug('For UID %d found %d files and %d unknown binaries', message.uid, files.length, binaries.length);
      if (cb) cb(message);
    });
  };

  // Processes a message with a header and N data bodies
  ImapFetcher.prototype.processDataMsg = function(msg, metadata, cb) {
    var message = _.pick(metadata, 'uid', 'flags', 'date');
    var totalfiles = 0;
    var finished = false;
    var self = this;
  
    message.files = [];
    function handlefinished() {
      if (totalfiles === 0 && finished && cb) {
        cb(null, message);
      }
    }
    msg.on('body', function(stream, info) {
      var buffer = new Buffer(0);

      stream.on('data', function(chunk) {
        buffer = Buffer.concat([buffer, chunk]);
      });
      stream.once('end', function() {
        var fileinfo, mimetype;

        if (/^HEADER/.test(info.which)) {
          message.header = Imap.parseHeader(buffer.toString());
        } else {
          buffer = new Buffer(buffer.toString(), 'base64');
          fileinfo = _.find(metadata.files, function(file) { return file.partID === info.which; });
          if (fileinfo) {
            mimetype = fileinfo.type + '/' + fileinfo.subtype;
            winston.debug('Fetched %s file of %d bytes', mimetype, buffer.length);
            message.files.push({
              mimetype: mimetype,
              data: buffer
            });
          } else {
            totalfiles += 1;
            winston.debug('Fetched unknown file of %d bytes', buffer.length);
            self.magic.detect(buffer, function(err, result) {
              if (err) {
                winston.error('Error detecting file type with magic: %s', err);
                cb(err);
              }
              if (self.shouldFetchMimetype(result)) {
                winston.debug('Magic detected the file to be of type %s', result);
                message.files.push({
                  mimetype: result,
                  data: buffer
                });
              }
              totalfiles -= 1;

              // Because magic is async, we have to call here as well
              handlefinished();
            });
          }
        }
      });
    });
    msg.once('end', function() {
      finished = true;
      handlefinished();
    });
  };

  ImapFetcher.prototype.connect = function(cb) {
    var imap = this.imap;
    var state = this.imap.state;
    if (state === 'authenticated') {
      if (cb) cb();
      return;
    }
    if (cb) imap.once('error', cb);
    if (cb) imap.once('ready', cb);
    if (state === 'disconnected') {
      imap.connect();
    }
  };

  // Fetch data for the message info (from processMsg)
  ImapFetcher.prototype.fetchMsgData = function(message, cb) {
    var self = this;

    this.connect(function() {
      var imap = self.imap;

      var bodies = ['HEADER.FIELDS (FROM SUBJECT DATE)'];
      bodies = bodies.concat(_.pluck(message.files, 'partID'));
      bodies = bodies.concat(_.pluck(message.binaries, 'partID'));
    
      var starttime = new Date();
      winston.debug('Downloading message UID %d...', message.uid);
      var f = imap.fetch(''+message.uid, { bodies: bodies });
      f.once('message', function(msg) {
        self.processDataMsg(msg, message, function(err, result) {
          if (!err) {
            var time = Math.round((new Date()-starttime)/100)/10;
            winston.info('Downloaded message UID %d with %d files in %d seconds', result.uid, result.files.length, time);
          }
          if (cb) cb(err, result);
        });
      });
      f.once('error', function(err) {
        cb(err);
      });
    });
  };

  ImapFetcher.prototype.hasNewMessages = function() {
    return !!this.newMessages;
  };

  // Fetch all new messages
  ImapFetcher.prototype.fetchNewMessages = function(lastuid, cb) {
    var self = this;

    this.connect(function(err) {
      var imap = self.imap;
      var messages = [];

      if (err) return cb(err);
      imap.openBox('INBOX', function(err, box) {
        if (err) throw err;

        self.newMessages = false;
        var starttime = new Date();
        winston.debug('Starting to fetch new messages starting from UID %d', (lastuid+1));
        var f = imap.fetch((lastuid+1)+':*', { struct: true });
        f.on('message', function(msg, seqno) {
          self.processMsg(msg, function(message) {
            // Sometimes IMAP returns lower UIDs than lastuid+1
            if (message.uid > lastuid) {
              messages.push(message);
            }
          });
        });
        f.once('error', function(err) {
          winston.error('Fetch error: ' + err);
          if (cb) cb(err);
        });
        f.once('end', function() {
          var time = Math.round((new Date()-starttime)/100)/10;
          if (messages.length === 0) {
            winston.debug('Found 0 new messages, fetching took %d seconds', time);
          } else {
            winston.info('Found %d new messages, fetching took %d seconds', messages.length, time);
          }
          if (cb) cb(null, messages);
        });
      });
    });
  };

  return ImapFetcher;
})();


exports.ImapFetcher = ImapFetcher;

