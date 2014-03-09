'use strict';

angular.module('myApp.controllers', [])
    .controller('MainCtrl', ['$scope', '$rootScope', '$window', '$location', function ($scope, $rootScope, $window, $location) {
        $scope.userAgent = navigator.userAgent;
        $scope.location = $location.url();
        
        $scope.isCordova = $location.search().hasOwnProperty('isCordova') ? true : false;
        $scope.isNative =  $location.search().hasOwnProperty('isNative') ? true : false;
        $scope.isBrowser = (!$scope.isCordova) && (!$scope.isNative);
        $scope.slide = '';
        $rootScope.back = function() {
          $scope.slide = 'slide-right';
          $window.history.back();
        }
        $rootScope.go = function(path){
          $scope.slide = 'slide-left';
          $location.url(path);
        }
        // demo purposes only
        // probably should be done by native client.
        $scope.injectCordovaScript = function() {
            var s = document.createElement('script');
            s.type = 'text/javascript';
            s.src = "bower_components/cordova/cordova.android.js";
            document.getElementsByTagName('head')[0].appendChild(s);
        }
        if ($scope.isCordova) {
            $scope.injectCordovaScript();
        }
    }])
    .controller('EmployeeListCtrl', ['$scope', 'Employee', function ($scope, Employee) {
        $scope.employees = Employee.query();
    }])
    .controller('EmployeeDetailCtrl', ['$scope', '$routeParams', 'Employee', function ($scope, $routeParams, Employee) {
        $scope.employee = Employee.get({employeeId: $routeParams.employeeId});
    }])
    .controller('ReportListCtrl', ['$scope', '$routeParams', 'Report', function ($scope, $routeParams, Report) {
        $scope.employees = Report.query({employeeId: $routeParams.employeeId});
    }]);
