define(['angular'], function(angular){
	//--------------------------------------------------------------------------------------------------------------------
	var BuildServices = function($log, $q, $rootScope) {

	    var self = this;

	    this.getBuildList = function() {

	    	var data = [
	    		{
	    			name : "WBC Banking Tablet",
	    			timestamp : "timestamp",
	    			id : "id"
	    		},
	    		{
	    			name : "WBC Banking Tablet",
	    			timestamp : "timestamp",
	    			id : "id"
	    		},
	    		{
	    			name : "WBC Banking Tablet",
	    			timestamp : "timestamp",
	    			id : "id"
	    		},
	    		{
	    			name : "WBC Banking Tablet",
	    			timestamp : "timestamp",
	    			id : "id"
	    		},
	    		{
	    			name : "WBC Banking Tablet",
	    			timestamp : "timestamp",
	    			id : "id"
	    		}
	    	];

	    	return {

	    		status : 0,
	    		data : data
	    	}
	    }
	}
	return angular.module('BuildServices', []).service('BuildServices', BuildServices);
});
//--------------------------------------------------------------------------------------------------------------------

