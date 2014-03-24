/** @jsx React.DOM */

var React = require('react');
var ReactAsync = require('react-async');
var superagent  = require('superagent');

var Message = require('./message');

module.exports = React.createClass({
  mixins: [ReactAsync.Mixin],

  getInitialStateAsync: function(cb) {
    superagent.get(
      'http://localhost:3000'+this.props.baseurl+'?limit=20&order_by=id_desc',
      function(err, res) {
        cb(err, res ? res.body : null);
      });
  },
  render: function() {
    var messages = {};
    if (this.state.messages) {
      this.state.messages.forEach(function(message) {
          messages['message-'+message.id] = <Message key={message.id} message={message} />
      });
    }
    return (
      <div className="container">{messages}</div>
    );
  }
});
