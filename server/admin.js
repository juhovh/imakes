var _ = require('underscore');

var db = require('./db');
var format = require('./format');


exports.setup = function(config, app) {
  function authenticate(req, res, next) {
    if (config.noAuthentication) {
      req.user = {
        id: 1,
        admin: 0,
        deleted: 0,
        provider: 'github',
        identifier: '123456',
        username: 'admin',
        displayname: 'Admin',
        lastlogin: 1383422748916
      };
    }
    if (!req.user || !req.user.admin) {
      res.send(401, 'Unauthorized to view the resource');
    } else {
      next();
    }
  }

  app.get('/admin/auth/', authenticate, function(req, res, next) {
    db.listAuths(function(err, result) {
      if (err) return next(err);
      res.send(result);
    });
  });

  app.get('/admin/alias/', authenticate, function(req, res, next) {
    db.listAliases(function(err, result) {
      if (err) return next(err);
      res.send(result);
    });
  });
};
