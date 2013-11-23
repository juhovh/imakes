var xmlbuilder = require('xmlbuilder');
var moment = require('moment');

var db = require('./db');
var format = require('./format');

exports.generate = function(callback) {
  db.listMessages({ limit: 100, order_by: 'message.id DESC' }, function(err, result) {
    if (err) return callback(err);
 
    var feed = xmlbuilder.create('feed', {'version': '1.0', 'encoding': 'utf-8'});
    feed.att('xmlns', 'http://www.w3.org/2005/Atom')
        .ele('id').txt('urn:uuid:d2a022a1-5d24-45f9-af20-479e7b093770').up()
        .ele('title').txt('Imakes 3.0').up()
        .ele('updated').txt(moment().toISOString()).up()
        .ele('link').att('rel', 'self').att('href', '/atom').up();
  
    result.messages.forEach(function(message) {
      feed.ele('entry')
          .ele('id').txt(message.id).up()
          .ele('title').txt(format.title(message.title)).up()
          .ele('updated').txt(moment(message.timestamp).toISOString()).up()
//          .ele('author').ele('name').txt(format.author(message.author)).up().up()
          .ele('link').att('rel', 'alternate').att('href', '/message/'+message.id).up()
    });

    callback(null, feed.end());
  });
};
