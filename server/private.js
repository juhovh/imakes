var _ = require('underscore');

var db = require('./db');
var format = require('./format');

var PAGESIZE = 20;

exports.setup = function(config, app) {
  function authenticate(req, res, next) {
    if (config.noAuthentication) {
      req.user = {
        id: 1,
        admin: 1,
        deleted: 0,
        provider: 'github',
        identifier: '123456',
        username: 'admin',
        displayname: 'Admin',
        lastlogin: 1383422748916
      };
    }
    if (!req.user) {
      req.session.redirectUrl = req.url;
      res.redirect('/login');
    } else {
      next();
    }
  }

  function prepareMessage(message, userid) {
    message.author = format.author(message.author);
    message.title = format.title(message.title);
    message.date = format.date(message.timestamp);
    message.time = format.time(message.timestamp);
    if (userid) {
      var user = _.find(message.favorited, function(user) {
        return user.id == userid;
      });
      message.favorite = (user != null);
    }
  }

  app.get('/images', authenticate, function(req, res, next) {
    var options = {
      deleted: false,
      processed: true,
      order_by: 'message.id DESC'
    };
    var page = req.query.page;
    if (!page || page < 1) page = 1;
    if (page >= 1) {
      page = parseInt(page);
      options.limit = PAGESIZE,
      options.offset = (page-1)*PAGESIZE
    }
    db.listImages(options, function(err, result) {
      if (err) return next(err);
      result.messages.forEach(function(message) {
        prepareMessage(message, req.user.id);
        message.videos = [];
      });
      res.render('messagelist', {
        url: '/images',
        user: req.user,
        username: format.user(req.user),
        messages: result.messages,
        page: page,
        lastpage: Math.floor((result.totalMessages+PAGESIZE-1)/PAGESIZE)
      });
    });
  });

  app.get('/videos', authenticate, function(req, res, next) {
    var options = {
      deleted: false,
      processed: true,
      order_by: 'message.id DESC'
    };
    var page = req.query.page;
    if (!page || page < 1) page = 1;
    if (page >= 1) {
      page = parseInt(page);
      options.limit = PAGESIZE,
      options.offset = (page-1)*PAGESIZE
    }
    db.listVideos(options, function(err, result) {
      if (err) return next(err);
      result.messages.forEach(function(message) {
        prepareMessage(message, req.user.id);
        message.images = [];
      });
      res.render('messagelist', {
        url: '/videos',
        user: req.user,
        username: format.user(req.user),
        messages: result.messages,
        page: page,
        lastpage: Math.floor((result.totalMessages+PAGESIZE-1)/PAGESIZE)
      });
    });
  });

  app.get('/favorites', authenticate, function(req, res, next) {
    var options = {
      deleted: false,
      processed: true,
      favorite: req.user.id,
      order_by: 'favorite.timestamp DESC'
    };
    var page = req.query.page;
    if (!page || page < 1) page = 1;
    if (page >= 1) {
      page = parseInt(page);
      options.limit = PAGESIZE,
      options.offset = (page-1)*PAGESIZE
    }
    db.listMessages(options, function(err, result) {
      if (err) return next(err);
      result.messages.forEach(function(message) {
        prepareMessage(message, req.user.id);
      });
      res.render('messagelist', {
        url: '/favorites',
        user: req.user,
        username: format.user(req.user),
        messages: result.messages,
        page: page,
        lastpage: Math.floor((result.totalMessages+PAGESIZE-1)/PAGESIZE)
      });
    });
  });

  app.get('/popular', authenticate, function(req, res, next) {
    var options = {
      deleted: false,
      processed: true,
      favorite: true,
      order_by: [
        'COUNT(DISTINCT favorite.user_id) DESC',
        'message.id DESC'
      ]
    };
    var page = req.query.page;
    if (!page || page < 1) page = 1;
    if (page >= 1) {
      page = parseInt(page);
      options.limit = PAGESIZE,
      options.offset = (page-1)*PAGESIZE
    }
    db.listMessages(options, function(err, result) {
      if (err) return next(err);
      result.messages.forEach(function(message) {
        prepareMessage(message, req.user.id);
      });
      res.render('messagelist', {
        url: '/popular',
        user: req.user,
        username: format.user(req.user),
        messages: result.messages,
        page: page,
        lastpage: Math.floor((result.totalMessages+PAGESIZE-1)/PAGESIZE)
      });
    });
  });

  app.get('/map', authenticate, function(req, res, next) {
    res.render('map', {
      url: '/map',
      user: req.user,
      username: format.user(req.user)
    });
  });

  app.get('/stats', authenticate, function(req, res, next) {
    res.render('stats', {
      url: '/stats',
      user: req.user,
      username: format.user(req.user)
    });
  });

  app.get('/message/:id', authenticate, function(req, res, next) {
    db.getMessage(req.params.id, function(err, message) {
      if (err) return next(err);
      if (!message) return res.send(404, 'Message not found');
      prepareMessage(message, req.user.id);
      res.render('message', {
        url: req.url,
        user: req.user,
        username: format.user(req.user),
        message: message
      });
    });
  });
};
