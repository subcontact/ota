define(['angular', '_', 'hammerjs'], function(angular, _, Hammer) {
    function debugDirective() {

        function directiveLink(scope, element, attr) {

            element.on('touchstart', function() {

                console.log('starting');
                
                element.addClass("activeButton");
            });

            element.on('touchend', function() {

                console.log('ending');

                element.removeClass("activeButton");
            });
        }
        return {
            restrict: 'A',
            scope: {
            	
            },
            link: directiveLink
        };
    }
    var module = angular.module('directives', []);    
	module.directive('debug', debugDirective);
});
