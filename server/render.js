var path        = require('path');
var url         = require('url');
var express     = require('express');
var browserify  = require('connect-browserify');
var ReactAsync  = require('react-async');
var nodejsx     = require('node-jsx').install();
var App         = require('../client');

var development = process.env.NODE_ENV !== 'production';

function renderApp(req, res, next) {
  var path = url.parse(req.url).pathname;
  var app = App({path: path});
  ReactAsync.renderComponentToStringWithAsyncState(app, function(err, markup) {
    if (err) {
      return next(err);
    }
    res.send(markup);
  });
}

exports.setup = function(config, app) {
  if (development) {
    app.get('/assets/bundle.js',
      browserify('./client', {
      }));
  }
  app.use('/assets', express.static(path.join(__dirname, 'assets')));
  app.use(renderApp);
}

