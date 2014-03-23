/** @jsx React.DOM */

var React = require('react');
var Link = require('react-router-component').Link

var Navbar = require('./navbar')

exports.ImagesPage = React.createClass({
  render: function() {
    return (
      <div>
        <Navbar active="images" username="testuser" />
        <p>Images page</p>
      </div>
    );
  }
});

exports.VideosPage = React.createClass({
  render: function() {
    return (
      <div>
        <Navbar active="videos" username="testuser" />
        <p>Videos page</p>
      </div>
    );
  }
});

exports.MyMessagesPage = React.createClass({
  render: function() {
    return (
      <div>
        <Navbar active="mymessages" username="testuser" />
        <p>My Messages page</p>
      </div>
    );
  }
});

exports.FavoritesPage = React.createClass({
  render: function() {
    return (
      <div>
        <Navbar active="favorites" username="testuser" />
        <p>My Favorites page</p>
      </div>
    );
  }
});

exports.PopularPage = React.createClass({
  render: function() {
    return (
      <div>
        <Navbar active="popular" username="testuser" />
        <p>Popular page</p>
      </div>
    );
  }
});

exports.NotFoundPage = React.createClass({
  render: function() {
    return (
      <div>
        <p>NotFound page</p>
      </div>
    );
  }
});
