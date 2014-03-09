'use strict';

angular.module('myApp', [
    'ngTouch',
    'ngRoute',
    'ngAnimate',
    'myApp.controllers',
    'myApp.memoryServices'
]).
config(['$routeProvider', function ($routeProvider) {
    $routeProvider.when('/', {templateUrl: 'main.html', controller: 'MainCtrl'});
    $routeProvider.when('/contacts-list', {templateUrl: 'contacts-list.html', controller: 'ContactsCtrl'});
    $routeProvider.otherwise({redirectTo: '/'});
}]);