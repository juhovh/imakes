/** @jsx React.DOM */
var React = require('react');
var Router = require('react-router-component')

var Locations = Router.Locations;
var Location = Router.Location;
var NotFound = Router.NotFound;

var pages = require('./pages');

var App = React.createClass({
  render: function() {
    return (
      <Locations>
        <Location path="/static/" handler={pages.ImagesPage} />
        <Location path="/images" handler={pages.ImagesPage} />
        <Location path="/videos" handler={pages.VideosPage} />
        <Location path="/mymessages" handler={pages.MyMessagesPage} />
        <Location path="/favorites" handler={pages.FavoritesPage} />
        <Location path="/popular" handler={pages.PopularPage} />
        <Location path="/map" handler={pages.MapPage} />
        <NotFound handler={pages.NotFoundPage} />
      </Locations>
    );
  }
});
React.renderComponent(App(), document.body)

