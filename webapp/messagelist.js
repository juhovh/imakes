/** @jsx React.DOM */

var React = require('react');
var ReactAsync = require('react-async');

var Message = require('./message');

module.exports = React.createClass({
  mixins: [ReactAsync.Mixin],

  getInitialState: function() {
    return {messages: []};
  },
  getInitialStateAsync: function(cb) {
    $.getJSON(this.props.baseurl+'?limit=20&order_by=id_desc', function(data) {
      cb(null, data);
    }.bind(this));
  },
  render: function() {
    return (
      <div className="container">
        {this.state.messages.map(function(message) {
          return <Message message={message} />
        })}
      </div>
    );
  }
});
