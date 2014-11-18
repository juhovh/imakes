var express = require('express');
var compression = require('compression');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var cookieSession = require('cookie-session');

var cons = require('consolidate');
var passport = require('passport');
var GoogleStrategy = require('passport-google').Strategy;
var GitHubStrategy = require('passport-github').Strategy;

var db = require('./db');

module.exports = function(config) {
  var app = express();
  app.use(compression());
  app.use(bodyParser.urlencoded({
    extended: true
  }));
  app.use(bodyParser.json());
  app.use(cookieParser());
  app.use(cookieSession({
    secret: config.secret,
    cookie: { maxAge: config.sessionDuration }
  }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use('/static', express.static(config.staticPath));

  app.enable('strict routing');
  app.engine('html', cons.swig);

  app.set('view engine', 'html');
  app.set('views', config.viewsPath);

  passport.serializeUser(function(user, done) {
    done(null, { userid: user.id, authid: user.auth_id });
  });

  passport.deserializeUser(function(ids, done) {
    db.getUserAuth(ids.userid, ids.authid, done);
  });

  passport.use(new GoogleStrategy(config.google,
    function(identifier, profile, done) {
      var email = profile.emails.length && profile.emails[0].value;
      db.findUserAuth('google', identifier, function(err, user) {
        if (err || !email) return done(err);

        if (user) {
          user.username = email;
          user.displayname = profile.displayName;
          user.lastlogin = new Date();
          db.updateUserAuth(user, done);
          return;
        }

        // Try to fall back to finding by email, update identifier respectively
        db.findUserAuth('google', profile.emails[0].value, function(err, user) {
          if (err || !user) return done(err, user);

          user.identifier = identifier;
          user.username = email;
          user.displayname = profile.displayName;
          user.lastlogin = new Date();
          db.updateUserAuth(user, done);
        });
      });
    }
  ));

  passport.use(new GitHubStrategy(config.github,
    function(accessToken, refreshToken, profile, done) {
      db.findUserAuth('github', profile.id, function(err, user) {
        if (err || !user) return done(err, user);

        user.username = profile.username;
        user.displayname = profile.displayName;
        user.lastlogin = new Date();
        db.updateUserAuth(user, done);
      });
    }
  ));

  function authenticate(provider) {
    return function(req, res, next) {
      passport.authenticate(provider, function(err, user, info) {
        if (err) return next(err);
        if (!user) return res.redirect(config.loginFailedPage);
        req.logIn(user, function(err) {
          if (err) return next(err);

          // Check if redirectUrl was set in server/private.js
          if (req.session.redirectUrl) {
            var redirectUrl = req.session.redirectUrl;
            delete req.session.redirectUrl;
            res.redirect(redirectUrl);
          } else {
            res.redirect(config.loginSuccessPage);
          }
        });
      })(req, res, next);
    };
  };

  app.get('/auth/google', passport.authenticate('google'));
  app.get('/auth/google/return', authenticate('google'));
  app.get('/auth/github', passport.authenticate('github'));
  app.get('/auth/github/callback', authenticate('github'));

  return app;
};
