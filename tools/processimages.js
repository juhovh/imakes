var async = require('async');

var db = require('../server/db');
var filedb = require('../server/filedb');

db.listMessages({ images: true }, function(err, result) {
  if (err) return console.log(err);
  async.eachSeries(result.messages, function(message, msgcb) {
    async.eachSeries(message.images, function(image, imagecb) {
      console.log('Processing: ' + image.filename);
      filedb.processImage(image, imagecb);
    }, msgcb);
  }, function(err) {
    if (err) console.log('Error processing messages: ' + err);
    else console.log('Finished processing messages');
  });
});
