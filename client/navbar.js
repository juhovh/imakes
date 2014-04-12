/** @jsx React.DOM */

var React = require('react');
var Link = require('react-router-component').Link;

module.exports = React.createClass({
  render: function() {
    var imagesClasses = this.props.active === 'images' ? 'active' : '';
    var videosClasses = this.props.active === 'videos' ? 'active' : '';
    var mymessagesClasses = this.props.active === 'mymessages' ? 'active' : '';
    var favoritesClasses = this.props.active === 'favorites' ? 'active' : '';
    var popularClasses = this.props.active === 'popular' ? 'active' : '';
    var mapClasses = this.props.active === 'map' ? 'active' : '';
    return (
      <div className="navbar navbar-inverse navbar-static-top" role="navigation">
        <div className="container">
          <div className="navbar-header">
            <button type="button" className="navbar-toggle" data-toggle="collapse" data-target="#main-navbar-collapse">
              <span className="sr-only">Toggle navigation</span>
              <span className="icon-bar"></span>
              <span className="icon-bar"></span>
              <span className="icon-bar"></span>
            </button>
            <Link href="/"><span className="navbar-brand">Imakes 3.0</span></Link>
          </div>
          <div className="collapse navbar-collapse" id="main-navbar-collapse">
            <ul className="nav navbar-nav">
              <li className={imagesClasses}><Link href="/images">Images</Link></li>
              <li className={videosClasses}><Link href="/videos">Videos</Link></li>
              <li className={mymessagesClasses}><Link href="/mymessages">My Messages</Link></li>
              <li className={favoritesClasses}><Link href="/favorites">My Favorites</Link></li>
              <li className={popularClasses}><Link href="/popular">Popular</Link></li>
              <li className={mapClasses}><Link href="/map">Map</Link></li>
            </ul>
            <ul className="nav navbar-nav navbar-right">
              <li className="dropdown">
                <a className="dropdown-toggle" data-toggle="dropdown">{this.props.username} <b className="caret"></b></a>
                <ul className="dropdown-menu">
                  <li><a href="/logout">Logout</a></li>
                </ul>
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }
});


