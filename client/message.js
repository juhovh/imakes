/** @jsx React.DOM */

var React = require('react');
var ReactAsync = require('react-async');
var Link = require('react-router-component').Link;

module.exports = React.createClass({
  componentDidMount: function() {
    var refs = this.refs;
    Object.keys(refs).forEach(function(key) {
      var match = key.match(/^video-(\d+)$/);
      var element = refs[key].getDOMNode();
      if (match) {
        var videoid = match[1]
        $(element).flowplayer({
          preload: 'none',
          swf: '/static/flowplayer-5.4.6/flowplayer.swf',
          poster: '/attachment/'+videoid+'/screenshot',
          playlist: [
            [ { mp4: '/attachment/'+videoid+'/mp4' } ]
          ]
        });
      }
    });
  },

  componentWillUnmount: function() {
    // We should do flowplayer cleanup here, but flowplayer
    // has no cleanup, this might be a problem...
  },

  render: function() {
    var message = this.props.message;
    var ts = new Date(message.timestamp);
    var date = ts.getDate()+'.'+(ts.getMonth()+1)+'.'+ts.getFullYear();
    var time = (ts.getHours()<10?'0':'')+ts.getHours()
             + '.'
             + (ts.getMinutes()<10?'0':'')+ts.getMinutes();
    var author = (message.owner && message.owner.name) ? message.owner.name : message.author;
    var images = {};
    var videos = {};

    message.images.forEach(function(image) {
      var width = image.types.medium.width;
      var height = image.types.medium.height;
      images['attachment-'+image.id] =
        <div className="image">
          <a href={'/attachment/'+image.id+'/large'}>
            <img className="img-responsive" width={width} height={height} src={'/attachment/'+image.id+'/medium'}/>
          </a>
        </div>
    });

    message.videos.forEach(function(video) {
      var ref = 'video-'+video.id;
      videos['attachment-'+video.id] =
        <div className="video">
          <div ref={ref}/>
        </div>
    });

    return (
      <div className="message">
        <h3><Link href={'/message/'+message.id}>{message.title}</Link></h3>
        <h5>{date} at {time} by {author}</h5>
        <h6>
          Liked by {message.favorited.length} people&nbsp;
          <button type="button" className="btn btn-primary btn-sm btn-favorite">Like</button>
        </h6>
        {images}
        {videos}
      </div>
    );
  }
});
