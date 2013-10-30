define(['angular'], function(angular){

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
	    //alert('test');
	}

/*
	angular.extend(BuildListController, {
		$inject : ['$scope', '$timeout', '$log', 'BuildServices']
	});
*/
	return angular.module('BuildListController', []).controller('BuildListController', BuildListController);
});