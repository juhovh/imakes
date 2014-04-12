/**
 * @jsx React.DOM
 */

var React       = require('react');
var ReactMount  = require('react/lib/ReactMount');
var ReactAsync  = require('react-async');
var ReactRouter = require('react-router-component');
var superagent  = require('superagent');

var Pages       = ReactRouter.Pages;
var Page        = ReactRouter.Page;
var NotFound    = ReactRouter.NotFound;
var Link        = ReactRouter.Link;

var pages       = require('./client/pages');

ReactMount.allowFullPageRender = true;

var App = React.createClass({

  render: function() {
    return (
      <html>
        <head>
          <title>Imakes</title>

          <meta name="viewport" content="initial-scale=1.0, maximum-scale=1.0"/>
          <meta name="apple-mobile-web-app-capable" content="yes"/>

          <link href="/atom.xml" type="application/atom+xml" rel="alternate" title="Imakes ATOM Feed"/>

          <link rel="stylesheet" href="/static/lib/bootstrap-3.0.3/css/bootstrap.min.css" />
          <link rel="stylesheet" href="/static/lib/bootstrap-3.0.3/css/bootstrap-theme.min.css" />
          <link rel="stylesheet" href="/static/lib/flowplayer-5.4.6-hotfix/skin/minimalist.css" />
          <link rel="stylesheet" href="/static/lib/leaflet-0.7.1/leaflet.css" />
          <link rel="stylesheet" href="/static/lib/awesome-markers-2.0.1/leaflet.awesome-markers.css" />
          <link rel="stylesheet" href="/static/lib/markercluster-0.4/MarkerCluster.css" />
          <link rel="stylesheet" href="/static/lib/markercluster-0.4/MarkerCluster.Default.css" />
          <link rel="stylesheet" href="/assets/style.css" />

          <script src="/static/lib/jquery-1.10.2.min.js" />
          <script src="/static/lib/bootstrap-3.0.3/js/bootstrap.min.js" />
          <script src="/static/lib/flowplayer-5.4.6-hotfix/flowplayer.min.js" />
          <script src="/static/lib/leaflet-0.7.1/leaflet.js" />
          <script src="/static/lib/awesome-markers-2.0.1/leaflet.awesome-markers.min.js" />
          <script src="/static/lib/markercluster-0.4/leaflet.markercluster.js" />
          <script src="/static/lib/Chart.js" />

          <script src="/assets/bundle.js" />
        </head>
        <Pages className="App" path={this.props.path}>
          <Page path="/" handler={pages.ImagesPage} />
          <Page path="/images" handler={pages.ImagesPage} />
          <Page path="/videos" handler={pages.VideosPage} />
          <Page path="/mymessages" handler={pages.MyMessagesPage} />
          <Page path="/favorites" handler={pages.FavoritesPage} />
          <Page path="/popular" handler={pages.PopularPage} />
          <Page path="/map" handler={pages.MapPage} />
          <NotFound handler={pages.NotFoundPage} />
        </Pages>
      </html>
    );
  }
});

module.exports = App;

if (typeof window !== 'undefined') {
  window.onload = function() {
    React.renderComponent(App(), document);
  }
}

