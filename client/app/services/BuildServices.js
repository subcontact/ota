define(['angular', '_'], function(angular, _) {
	//--------------------------------------------------------------------------------------------------------------------
	var BuildServices = function($log, $q, $rootScope) {

	    var self = this;
    	var data = [
    		{
    			appName : "WBC Banking Tablet",
    			jobName : "UAT 1.1",
    			version : "1.5",
    			commit  : "234f3a",
    			build   : "13.01.01-01",
    			platform : "iOS",
    			form	 : "mobile",
    			state	 : "dev",
    			timestamp : "1383645673056",
    			id : 1
    		},
    		{
    			appName : "WBC Banking Tablet",
    			jobName : "UAT 1.1",
    			version : "1.5",
    			commit  : "234f3a",
    			build   : "13.01.01-01",
    			platform : "iOS",
    			form	 : "tablet",
    			state	 : "uat",
    			timestamp : "1383645673057",
    			id : 2
    		},
    		{
    			appName : "WBC Banking Tablet",
    			jobName : "UAT 1.1",
    			version : "1.5",
    			commit  : "234f3a",
    			build   : "13.01.01-01",
    			platform : "android",
    			form	 : "mobile",
    			state	 : "prod",
    			timestamp : "1383645673058",
    			id : 3
    		},
    		{
    			appName : "WBC Banking Tablet",
    			jobName : "UAT 1.1",
    			version : "1.5",
    			commit  : "234f3a",
    			build   : "13.01.01-01",
    			platform : "windows",
    			form	 : "tablet",
    			state	 : "dev",
    			timestamp : "1383645673059",
    			id : 4
    		},
    		{
    			appName : "WBC Banking Tablet",
    			jobName : "UAT 1.1",
    			version : "1.5",
    			commit  : "234f3a",
    			build   : "13.01.01-01",
    			platform : "iOS",
    			form	 : "mobile",
    			state	 : "dev",
    			timestamp : "1383645673060",
    			id : 5
    		}
    	];

	    this.getBuildList = function(filter) {
            //{ 'platform': 'iOS' }

            var result = null;
            if (filter) {

                result = _.where(data, filter);
            } else {

                result = data;
            }
	    	return {

	    		status : 0,
	    		data : result
	    	}
	    }

	    this.getBuildDetailById = function(id) {

	    	var buildDetail = _.find(this.getBuildList({ appName : 'WBC Banking Tablet'}).data, { 'id': parseInt(id) });

	    	return {

	    		status : 0,
	    		data : buildDetail
	    	}
	    }
	}
	return angular.module('BuildServices', []).service('BuildServices', BuildServices);
});
//--------------------------------------------------------------------------------------------------------------------

