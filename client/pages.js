/** @jsx React.DOM */

var React = require('react');
var Link = require('react-router-component').Link

var Navbar = require('./navbar')
var MessageList = require('./messagelist');

createPage = function(name, content) {
  return React.createClass({
    render: function() {
      return (
        <div>
          <Navbar active={name} username="testuser" />
          {content}
        </div>
      );
    }
  });
}

exports.ImagesPage = createPage(
  'images',
  <MessageList baseurl="/api/search/images?order_by=id_desc" />
);

exports.VideosPage = createPage(
  'videos',
  <MessageList baseurl="/api/search/videos?order_by=id_desc" />
);

exports.MyMessagesPage = createPage(
  'mymessages',
  ''
);

exports.FavoritesPage = createPage(
  'favorites',
  ''
);

exports.PopularPage = createPage(
  'popular',
  <MessageList baseurl="/api/search/favorites?order_by=favorited_desc,id_desc" />
);

exports.MapPage = createPage(
  'map',
  ''
);

exports.NotFoundPage = React.createClass({
  render: function() {
    return (
      <div>
        <p>NotFound page</p>
      </div>
    );
  }
});
