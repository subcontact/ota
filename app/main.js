define(["angular", "controllers/BuildListController", "directives/directives", "services/BuildServices"], function(angular){
	
	var app = angular.module('main', ['BuildServices', 'BuildListController', 'directives']);

app.config(['$routeProvider', function($routeProvider) {
    
    $routeProvider.when('/phones', {
        templateUrl: 'partials/phone-list.html',
        controller: 'PhoneListCtrl'
      }).
      when('/phones/:phoneId', {
        templateUrl: 'partials/phone-detail.html',
        controller: 'PhoneDetailCtrl'
      }).
      otherwise({
        redirectTo: '/phones'
      });
  }]);
});