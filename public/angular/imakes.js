angular.module('imakes', ['ngRoute'])

.run(function($rootScope, $location) {
  $rootScope.userid = user.id;
  $rootScope.username = user.name;
  $rootScope.isActive = function(url) {
    return new RegExp("^"+url).test($location.url());
  };
})

.factory('messageSearch', function($http) {
  function getSearch(type) {
    return function (userid, params) {
      if (typeof(userid) === 'object') {
        params = userid;
        userid = null;
      }
      params = params || {};
      return $http.get('/api/search/'+type+(userid?'/'+userid:''), {params: params});
    }
  }
  return {
    searchMessages: getSearch('messages'),
    searchImages: getSearch('images'),
    searchVideos: getSearch('videos'),
    searchFavorites: getSearch('favorites')
  };
})

.config(function($routeProvider) {
  var messageListRoute = {
    controller: 'MessageListCtrl',
    templateUrl: 'messagelist.html',
  };
  $routeProvider
    .when('/images', messageListRoute)
    .when('/videos', messageListRoute)
    .when('/mymessages', messageListRoute)
    .when('/favorites', messageListRoute)
    .when('/popular', messageListRoute)
    .otherwise({
      redirectTo: '/images'
    });
})

.controller('MessageListCtrl', function($scope, $location, $routeParams, messageSearch) {
  var promise;
  var params = {limit: 20};
  if (/^\/images/.test($location.url())) {
    params.order_by = 'id_desc';
    promise = messageSearch.searchImages(params);
  } else if (/^\/videos/.test($location.url())) {
    params.limit = 10;
    params.order_by = 'id_desc';
    promise = messageSearch.searchVideos(params);
  } else if (/^\/mymessages/.test($location.url())) {
    params.order_by = 'favorited_desc,id_desc';
    promise = messageSearch.searchMessages($scope.userid, params);
  } else if (/^\/favorites/.test($location.url())) {
    promise = messageSearch.searchFavorites($scope.userid);
  } else if (/^\/popular/.test($location.url())) {
    params.order_by = 'favorited_desc,id_desc';
    promise = messageSearch.searchFavorites(params);
  }
  if (promise) promise.then(function(result) {
    angular.forEach(result.data.messages, function(message) {
      var ts = new Date(message.timestamp);
      message.date = ts.getDate()+'.'+(ts.getMonth()+1)+'.'+ts.getFullYear();
      message.time = (ts.getHours()<10?'0':'')+ts.getHours()
                   + '.'
                   + (ts.getMinutes()<10?'0':'')+ts.getMinutes();
      if (message.owner && message.owner.name) {
        message.author = message.owner.name;
      }
      angular.forEach(message.favorited, function(user) {
        if (user.id === $scope.userid) message.favorite = true;
      });
      angular.forEach(message.images, function(image) {
        image.src = '/attachment/'+image.id+'/medium';
      });
      angular.forEach(message.videos, function(video) {
        video.src = '/attachment/'+video.id+'/mp4';
      });
    });
    $scope.result = result.data;
  });
})
.directive('imakesFlowplayer', function() {
  return {
    link: function(scope, element, attr) {
      attr.$observe('imakesFlowplayer', function(value) {
        if (!value) return;
        $(element).flowplayer({
          preload: 'none',
          swf: '/static/flowplayer-5.4.6/flowplayer.swf',
          poster: '/attachment/'+value+'/screenshot',
          playlist: [
            [ { mp4: '/attachment/'+value+'/mp4' } ]
          ]
        });
      });
    }
  };
})
