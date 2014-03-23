/** @jsx React.DOM */

var React = require('react');
var ReactAsync = require('react-async');
var Link = require('react-router-component').Link;

module.exports = React.createClass({
  render: function() {
    var message = this.props.message;
    var ts = new Date(message.timestamp);
    var date = ts.getDate()+'.'+(ts.getMonth()+1)+'.'+ts.getFullYear();
    var time = (ts.getHours()<10?'0':'')+ts.getHours()
             + '.'
             + (ts.getMinutes()<10?'0':'')+ts.getMinutes();
    var author = (message.owner && message.owner.name) ? message.owner.name : message.author;
    return (
      <div className="message">
        <h3><Link href={'/message/'+message.id}>{message.title}</Link></h3>
        <h5>{date} at {time} by {author}</h5>
        <h6>
          Liked by {message.favorited.length} people
          <button type="button" className="btn btn-primary btn-sm btn-favorite">Like</button>
        </h6>
        <div className="image">
          {message.images.map(function(image) {
            return (
              <a href={'/attachment/'+image.id+'/large'}>
                <img className="img-responsive" width={image.types.medium.width} height={image.types.medium.height} src={'/attachment/'+image.id+'/medium'}/>
              </a>
            );
          })}
        </div>
      </div>
    );
  }
});
