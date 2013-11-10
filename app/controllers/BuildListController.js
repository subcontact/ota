define(['angular'], function(angular) {

	var module = angular.module('BuildListController', []);
/*
	function BuildListController($scope, $timeout, $log, BuildServices){

		$scope.dialogMessage 	= '';
		$scope.dialogComment 	= '';

	    $scope.dialogStateList = {

	    	NULL 		: null,
	        CORRECT 	: 'correct',
	        INCORRECT 	: 'incorrect',
	        LOCKED	  	: 'lockChoice'
	    };
	    $scope.dialogState = $scope.dialogStateList.NULL;

	    $scope.appStateList = {

	    	INIT	: 'INIT',
	    	START	: 'START',
	    	OPEN 	: 'OPEN',
	    	LOCKED  : 'LOCKED',
	    	RESULT 	: 'RESULT',
	    	CLOSED  : 'CLOSED',
	    	DESTROY : 'DESTROY'
	    };
	    $scope.appState = $scope.appStateList.INIT;

	    $scope.buildList = BuildServices.getBuildList().data;

	    console.log($scope.buildList);
	}

	module.controller('BuildListController', BuildListController);
*/
	
	function BuildListController($scope, $timeout, $log, BuildServices){

		$scope.dialogMessage 	= '';
		$scope.dialogComment 	= '';

	    $scope.platformFilterEnum = {

	        ALL 		: 'all',
	        IOS_MOBILE 	: 'iosm',
	        IOS_TABLET  : 'iost',
	        ANDROID  	: 'android',
	        WIN_MOBILE  : 'winm',
	        WIN_TABLET  : 'wint'
	    };
	    $scope.platformFilterState = $scope.platformFilterEnum.ALL;

	    $scope.appStateList = {

	    	INIT	: 'INIT',
	    	START	: 'START',
	    	OPEN 	: 'OPEN',
	    	LOCKED  : 'LOCKED',
	    	RESULT 	: 'RESULT',
	    	CLOSED  : 'CLOSED',
	    	DESTROY : 'DESTROY'
	    };
	    $scope.appState = $scope.appStateList.INIT;

	    $scope.buildList = BuildServices.getBuildList().data;

	    //console.log($scope.buildList);

	}
	module.controller('BuildListController', BuildListController);

	function BuildDetailController($scope, $timeout, $log, $routeParams, BuildServices){

		$scope.dialogMessage 	= '';
		$scope.dialogComment 	= '';

	    $scope.dialogStateList = {

	    	NULL 		: null,
	        CORRECT 	: 'correct',
	        INCORRECT 	: 'incorrect',
	        LOCKED	  	: 'lockChoice'
	    };
	    $scope.dialogState = $scope.dialogStateList.NULL;

	    $scope.appStateList = {

	    	INIT	: 'INIT',
	    	START	: 'START',
	    	OPEN 	: 'OPEN',
	    	LOCKED  : 'LOCKED',
	    	RESULT 	: 'RESULT',
	    	CLOSED  : 'CLOSED',
	    	DESTROY : 'DESTROY'
	    };
	    $scope.appState = $scope.appStateList.INIT;

	    $scope.buildDetail = BuildServices.getBuildDetailById($routeParams.buildId).data;
//	    $scope.buildDetail = BuildServices.getBuildDetailById(3);

	    console.log($scope.buildDetail);

	}
	module.controller('BuildDetailController', BuildDetailController);
	
	return module;
});