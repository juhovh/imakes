/** @jsx React.DOM */

var React = require('react');
var Link = require('react-router-component').Link

var Navbar = require('./navbar')
var MessageList = require('./messagelist');

exports.ImagesPage = React.createClass({
  render: function() {
    return (
      <div>
        <Navbar active="images" username="testuser" />
        <MessageList baseurl="/api/search/images" />
      </div>
    );
  }
});

exports.VideosPage = React.createClass({
  render: function() {
    return (
      <div>
        <Navbar active="videos" username="testuser" />
        <MessageList baseurl="/api/search/videos" />
      </div>
    );
  }
});

exports.MyMessagesPage = React.createClass({
  render: function() {
    return (
      <div>
        <Navbar active="mymessages" username="testuser" />
      </div>
    );
  }
});

exports.FavoritesPage = React.createClass({
  render: function() {
    return (
      <div>
        <Navbar active="favorites" username="testuser" />
      </div>
    );
  }
});

exports.PopularPage = React.createClass({
  render: function() {
    return (
      <div>
        <Navbar active="popular" username="testuser" />
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
