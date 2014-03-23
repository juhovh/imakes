/** @jsx React.DOM */

var React = require('react');
var Link = require('react-router-component').Link

exports.ImagesPage = React.createClass({
  render: function() {
    return (
      <div>
        <p>Images page</p>
        <Link href="/videos">videos page</Link>
      </div>
    );
  }
});

exports.VideosPage = React.createClass({
  render: function() {
    return (
      <div>
        <p>Videos page</p>
        <Link href="/images">images page</Link>
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
