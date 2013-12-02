define(["angular", "controllers/BuildListController", "directives/directives", "services/BuildServices"], function(angular) {

    var app = angular.module('main', ['ngRoute', 'ngAnimate', /* 'ngTouch', */ 'BuildServices', 'BuildListController', 'directives']);

    app.config(['$routeProvider', function($routeProvider) {

      $routeProvider.when('/builds', {
          templateUrl: 'partials/build-list.html',
          controller: 'BuildListController'
      }).
      when('/builds/:buildId', {
          templateUrl: 'partials/build-detail.html',
          controller: 'BuildDetailController'
      }).
      otherwise({
          redirectTo: '/builds'
      });
    }]);
});
