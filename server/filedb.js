var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;

var gm = require('gm');
var avconv = require('avconv');
var async = require('async');
var mkdirp = require('mkdirp');
var _ = require('underscore');
var winston = require('winston');

var db = require('./db');

var imagedir = path.normalize(__dirname + '/../files/images/');
var videodir = path.normalize(__dirname + '/../files/videos/');
var originalsize = 'original'

var imageSizes = [
  {
    width: 140,
    height: 140,
    options: '^',
    square: true,
    size: 'square'
  },{
    width: 320,
    height: 320,
    size: 'small'
  },{
    width: 640,
    height: 640,
    size: 'medium'
  },{
    width: 1024,
    height: 1024,
    size: 'large'
  }
];

var videoWidth = 640;
var videoHeight = 360;
var scalepad = [
  'scale=iw*sar*min('+videoWidth+'/(iw*sar)\\,'+videoHeight+'/ih):ih*min('+videoWidth+'/(iw*sar)\\,'+videoHeight+'/ih)',
  'pad='+videoWidth+':'+videoHeight+':(ow-iw)/2:(oh-ih)/2'
];
var videoFormats = [
  {
    ext: 'jpg',
    name: 'screenshot',
    filters: scalepad,
    params: [
      '-ss', '00:00:00.000',
      '-f', 'image2',
      '-vframes', '1',
    ]
  },
  {
    ext: 'mp4',
    name: 'mp4',
    filters: scalepad.concat(['setsar=1:1','format=yuv420p']),
    params: [
      '-codec:v', 'libx264',
      '-preset:v', 'slow',
      '-profile:v', 'baseline',
      '-level', '30',
      '-refs', '1',
      '-b:v', '600k',
      '-r:v', '25/1',
      '-force_fps',
      '-codec:a', 'libvo_aacenc',
      '-b:a', '60k',
      '-r:a', '44100',
      '-ac', '1'
    ]
  }
/* WebM is broken with avconv+Firefox, commenting out
  ,{
    ext: 'webm',
    name: 'webm',
    filters: scalepad.concat(['setsar=1:1','format=yuv420p']),
    params: [
      '-codec:v', 'libvpx',
      '-b:v', '600k',
      '-r:v', '25/1',
      '-force_fps',
      '-codec:a', 'libvorbis',
      '-b:a', '60k',
      '-r:a', '44100',
      '-ac', '1'
    ]
  }
*/
];
function getVideoFilename(original, ext) {
  var originalext = path.extname(original);
  var barename = original.slice(0, original.lastIndexOf(originalext));
  return barename+'.'+ext;
}

function getExifData(filename, callback) {
  exec('exiftool -json '+filename, function(err, stdout, stderr) {
    if (err) return callback(err);
    try {
      var exif = JSON.parse(stdout);
      if (!exif || !exif[0]) {
        callback(null, {});
      }
      exif = exif[0];
      delete exif.SourceFile;
      delete exif.ExifToolVersion;
      delete exif.Directory;
      delete exif.FileModifyDate;
      delete exif.FileAccessDate;
      delete exif.FileInodeChangeDate;
      delete exif.FilePermissions;
      callback(null, exif);
    } catch(e) {
      callback(e);
    }
  });
}

exports.addImage = function(filename, data, callback) {
  var outputdir = imagedir+originalsize+'/';
  mkdirp(outputdir, function(err) {
    if (err) return callback(err);
    fs.writeFile(outputdir+filename, data, callback);
  });
};

exports.getOriginalImagePath = function(filename, callback) {
  callback(null, imagedir+originalsize+'/'+filename);
};

exports.getImagePath = function(filename, sizename, callback) {
  var size = _.find(imageSizes, function(item) {
    return item.size === sizename;
  });
  if (!size) return callback('Invalid image size: ' + sizename);
  callback(null, imagedir+sizename+'/'+filename);
};

exports.addVideo = function(filename, data, callback) {
  var outputdir = videodir+originalsize+'/';
  mkdirp(outputdir, function(err) {
    if (err) return callback(err);
    fs.writeFile(outputdir+filename, data, callback);
  });
};

exports.getOriginalVideoPath = function(filename, callback) {
  callback(null, videodir+originalsize+'/'+filename);
};

exports.getVideoPath = function(filename, formatname, callback) {
  var format = _.find(videoFormats, function(item) {
    return item.name === formatname;
  });
  if (!format) return callback('Invalid video format: ' + formatname);
  callback(null, videodir+formatname+'/'+getVideoFilename(filename, format.ext));
};

function processImage(image, imgcb) {
  var inputfile = imagedir+originalsize+'/'+image.filename;
  winston.info('Processing image %s', image.filename);

  getExifData(inputfile, function(err, exifdata) {
    if (err) return videocb(err);

    async.eachSeries(imageSizes, function(size, resizecb) {
      var outputdir = imagedir+size.size+'/';
      var res = gm(inputfile)
                .autoOrient()
                .noProfile()
                .resize(size.width, size.height, size.options);
      if (size.square) {
        res = res.gravity('Center').extent(size.width, size.height);
      }
      mkdirp(outputdir, function(err) {
        if (err) return resizecb(err);
        res.write(outputdir+image.filename, resizecb);
      });
    }, function(err) {
      if (err) return imgcb(err);
      gm(inputfile).identify(function(err, value) {
        if (err) return imgcb(err);
  
        // Swap width and height based on EXIF orientation
        var regex = /^(Right|Left)(Top|Bottom)$/;
        if (regex.test(value.Orientation)) {
          image.width = value.size.height;
          image.height = value.size.width;
        } else {
          image.width = value.size.width;
          image.height = value.size.height;
        }
        image.exif = JSON.stringify(exifdata);
        db.updateImage(image, imgcb);
      });
    });
  });
}
exports.processImage = processImage;

function processVideo(video, debug, videocb) {
  if (!videocb) {
    videocb = debug;
    debug = false;
  }
  var inputfile = videodir+originalsize+'/'+video.filename;
  winston.info('Processing video %s', video.filename);

  getExifData(inputfile, function(err, exifdata) {
    if (err) return videocb(err);
    async.eachSeries(videoFormats, function(format, encodecb) {
      var outputdir = videodir+format.name+'/';
      var outputfile = outputdir+getVideoFilename(video.filename, format.ext);
      var params = format.params.slice(0);
      var filters = format.filters.slice(0);
      var rotation = exifdata.Rotation;
      if (rotation == 90) {
        filters.unshift('transpose=1');
      } else if (rotation == 180) {
        filters.unshift('transpose=1','transpose=1');
      } else if (rotation == 270) {
        filters.unshift('transpose=1','transpose=1','transpose=1');
      }
      params.unshift('-filter:v',filters.join(','));
      params = ['-i',inputfile].concat(params).concat(['-y',outputfile]);
  
      mkdirp(outputdir, function(err) {
        if (err) return videocb(err);
        var stream = avconv(params);
        if (debug) stream.pipe(process.stdout);
        stream.once('end', function(exitCode, signal) {
          if (exitCode) encodecb('avconv exit code: ' + exitCode);
          video.exif = JSON.stringify(exifdata);
          db.updateVideo(video, encodecb);
        });
      });
    }, videocb);
  });
}
exports.processVideo = processVideo;

exports.processAll = function(callback) {
  db.listMessages({ processed: false }, function(err, result) {
    if (err) throw err;
  
    async.eachSeries(result.messages, function(message, msgcb) {
      async.eachSeries(message.images, processImage, function(err) {
        if (err) return msgcb(err);
        async.eachSeries(message.videos, processVideo, function(err) {
          if (err) return msgcb(err);
          db.markProcessed(message.id, msgcb);
        });
      });
    }, callback);
  });
};
