var db = require('./db');
var atom = require('./atom');

exports.setup = function(config, app) {
  app.get('/', function(req, res) {
    if (req.user || config.noAuthentication) {
      res.redirect('/images');
    } else {
      res.redirect('/login');
    }
  });

  app.get('/login', function(req, res) {
    if (req.user) {
      res.redirect('/images');
    } else {
      res.render('login', {
      });
    }
  });

  app.get('/logout', function(req, res) {
    req.logout();
    res.render('logout', {
    });
  });

  app.get('/atom.xml', function(req, res, next) {
    atom.generate(function(err, feed) {
      if (err) return next(err);
      res.writeHead(200, { 'Content-Type': 'application/atom+xml; charset=utf-8' });
      res.end(feed);
    });
  });
};
