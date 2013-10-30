require.config({
	baseUrl : "app",
	paths : {
		"angular" : "../lib/angular-1.2.0-rc.3.min",
		"angular-animate" : "../lib/angular-animate-1.2.0-rc.3.min",
		"jquery" : "../lib/jquery-2.0.3.min",
		"fastclick"	 : "../lib/fastclick-0.6.11.min",
		"hammerjs"	: "../lib/hammerjs-1.0.5",
		"_"			: "../lib/lodash-2.2.1.min"
	},
	shim : {
		"angular" : {
			exports : "angular",
			deps : ["jquery"]
		},

		"angular-animate" : {

			deps : ["angular"]
		}
	}
});

require(['angular', 'fastclick', 'main',], function(angular, fastclick, main){
	angular.element().ready(function() {
		fastclick.attach(document.body);
        angular.bootstrap(document, ['main']);
	});
});