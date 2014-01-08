angular.module('imakes', ['ngRoute', 'ui.bootstrap'])

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
  function getSearchPromise(url, page) {
    page = page || 1;

    var promise;
    var params = {limit: 20, offset: (page-1)*20};
    if (/^\/images/.test(url)) {
      params.order_by = 'id_desc';
      promise = messageSearch.searchImages(params);
    } else if (/^\/videos/.test(url)) {
      params.limit = 10;
      params.order_by = 'id_desc';
      promise = messageSearch.searchVideos(params);
    } else if (/^\/mymessages/.test(url)) {
      params.order_by = 'favorited_desc,id_desc';
      promise = messageSearch.searchMessages($scope.userid, params);
    } else if (/^\/favorites/.test(url)) {
      promise = messageSearch.searchFavorites($scope.userid);
    } else if (/^\/popular/.test(url)) {
      params.order_by = 'favorited_desc,id_desc';
      promise = messageSearch.searchFavorites(params);
    }
    return promise;
  }
  function processSearchPromise(promise) {
    promise.then(function(result) {
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
      });
      $scope.result = result.data;
      $scope.totalItems = result.data.totalMessages;
    });
  }
  processSearchPromise(getSearchPromise($location.url()));

  $scope.currentPage = 1;
  $scope.$watch('currentPage', function() {
    var promise = getSearchPromise($location.url(), $scope.currentPage);
    processSearchPromise(promise);
    console.log(promise);
  });
  $scope.itemsPerPage = 20;
  $scope.maxSize = 5;
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
