angular.module('imakes', ['ngRoute'])

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
  $routeProvider
    .when('/images', {
      controller: 'ListCtrl',
      templateUrl: 'messagelist.html',
    })
    .when('/videos', {
      controller: 'ListCtrl',
      templateUrl: 'messagelist.html',
    })
    .when('/mymessages', {
      controller: 'ListCtrl',
      templateUrl: 'messagelist.html',
    })
    .when('/favorites', {
      controller: 'ListCtrl',
      templateUrl: 'messagelist.html',
    })
    .when('/popular', {
      controller: 'ListCtrl',
      templateUrl: 'messagelist.html',
    })
    .otherwise({
      redirectTo: '/images'
    });
})

.controller('ListCtrl', function($scope, $location, $routeParams, messageSearch) {
  var promise;
  var params = {limit: 20};
  if (/^\/images/.test($location.url())) {
    params.order_by = 'id_desc';
    promise = messageSearch.searchImages(params);
  } else if (/^\/videos/.test($location.url())) {
    params.order_by = 'id_desc';
    promise = messageSearch.searchVideos(params);
  } else if (/^\/mymessages/.test($location.url())) {
    params.order_by = 'favorited_desc,id_desc';
    promise = messageSearch.searchMessages(8, params);
  } else if (/^\/favorites/.test($location.url())) {
    promise = messageSearch.searchFavorites(8);
  } else if (/^\/popular/.test($location.url())) {
    params.order_by = 'favorited_desc,id_desc';
    promise = messageSearch.searchFavorites(params);
  }
  if (promise) promise.then(function(result) {
    angular.forEach(result.data.messages, function(message) {
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