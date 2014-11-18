var async = require('async');

var db = require('../server/db');
var filedb = require('../server/filedb');

db.listMessages({ videos: true }, function(err, result) {
  if (err) return console.log(err);
  async.eachSeries(result.messages, function(message, msgcb) {
    async.eachSeries(message.videos, function(video, videocb) {
      console.log('Processing: ' + video.filename);
      filedb.processVideo(video, true, videocb);
    }, msgcb);
  }, function(err) {
    if (err) console.log('Error processing messages: ' + err);
    else console.log('Finished processing messages');
  });
});
