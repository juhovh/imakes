var fs = require('fs');
var crypto = require('crypto');
var async = require('async');

var db = require('../server/db');
var filedb = require('../server/filedb');

console.log('Checking checksums of all files');
db.listMessages(function(err, result) {
  async.eachLimit(result.messages, 10, function(message, msgcb) {
    async.each(message.images, function(image, imgcb) {
      //console.log('Checking image file '+image.filename);
      filedb.getOriginalImagePath(image.filename, function(err, path) {
        if (err) return imgcb(err);
        fs.readFile(path, function(err, data) {
          if (err) return imgcb(err);
          var hash = crypto.createHash('sha256');
          hash.update(data);
          var digest = hash.digest('hex');
          if (digest !== image.checksum) {
            imgcb('Checksum failed for file '+image.filename);
          } else {
            imgcb();
          }
        });
      });
    }, function(err) {
      if (err) return msgcb(err);
      async.each(message.videos, function(video, videocb) {
        //console.log('Checking video file '+video.filename);
        filedb.getOriginalVideoPath(video.filename, function(err, path) {
          if (err) return videocb(err);
          fs.readFile(path, function(err, data) {
            if (err) return videocb(err);
            var hash = crypto.createHash('sha256');
            hash.update(data);
            var digest = hash.digest('hex');
            if (digest !== video.checksum) {
              videocb('Checksum failed for file '+video.filename);
            } else {
              videocb();
            }
          });
        });
      }, function(err) {
        msgcb(err);
      });
    });
  }, function(err) {
    if (err) {
      console.log('ERROR: '+err);
    } else {
      console.log('All checksums matched');
    }
  });
});
