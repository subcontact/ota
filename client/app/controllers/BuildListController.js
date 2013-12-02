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
/*
	    $scope.platformFilterEnum = {

	        ALL 		: 'all',
	        IOS_MOBILE 	: 'iosm',
	        IOS_TABLET  : 'iost',
	        ANDROID  	: 'android',
	        WIN_MOBILE  : 'winm',
	        WIN_TABLET  : 'wint'
	    };
	    */
	    $scope.platformFilterEnum = {

	    	ALL 		: 'ALL',
	    	IOS_MOBILE 	: 'IOS_MOBILE',
	    	IOS_TABLET 	: 'IOS_TABLET',
	    	ANDROID 	: 'ANDROID',
	    	WIN_MOBILE 	: 'WIN_MOBILE',
	    	WIN_TABLET	: 'WIN_TABLET'
	    };

	    $scope.platformFilterMap = {

	        ALL 		: 'all',
	        IOS_MOBILE 	: {platform : 'iOS', form : 'mobile'},
	        IOS_TABLET  : {platform : 'iOS', form : 'tablet'},
	        ANDROID  	: {platform : 'android'},
	        WIN_MOBILE  : {platform : 'windows', form : 'mobile'},
	        WIN_TABLET  : {platform : 'windows', form : 'tablet'}
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

	    //$scope.buildList = BuildServices.getBuildList().data;
	    $scope.$watch('platformFilterState', function(newValue, oldValue) {

/*
	    	console.log('platformFilterState');
	    	console.log(newValue);
	    	console.log(oldValue);
	    	console.log($scope.platformFilterMap[newValue]);
*/
	    	if (newValue === $scope.platformFilterEnum.ALL) {

				$scope.buildList = BuildServices.getBuildList().data;
	    	} else {

	    		$scope.buildList = BuildServices.getBuildList($scope.platformFilterMap[newValue]).data;
	    	}
	    	
	    });
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