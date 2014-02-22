define(['angular'], function(angular){
	function shallowEquals(o1, o2, depth){
		if (o1 === o2) return true;
		if (o1 === null || o2 === null) return false;
		if (o1 !== o1 && o2 !== o2) return true; // NaN === NaN
		var t1 = typeof o1, t2 = typeof o2, length, key, keySet;
		if (t1 == t2) {
			if (t1 == 'object') {
				var nextDepth = depth - 1;
				if (angular.isArray(o1)) {
					if (!angular.isArray(o2)) return false;
					if ((length = o1.length) == o2.length) {
						if(depth > 0){
							for(key=0; key<length; key++) {
								if (!shallowEquals(o1[key], o2[key], nextDepth)) return false;
							}
						}
						return true;
					}
				} else if (angular.isDate(o1)) {
					return angular.isDate(o2) && o1.getTime() == o2.getTime();
				} else {
					if (isScope(o1) || isScope(o2) || isWindow(o1) || isWindow(o2) || angular.isArray(o2)) return false;
					if(depth > 0){
						keySet = {};
						for(key in o1) {
						if (key.charAt(0) === '$' || angular.isFunction(o1[key])) continue;
						if (!shallowEquals(o1[key], o2[key], nextDepth)) return false;
						keySet[key] = true;
						}
						for(key in o2) {
						if (!keySet[key] &&
							key.charAt(0) !== '$' &&
							o2[key] !== undefined &&
							!angular.isFunction(o2[key])) return false;
						}
					}
					return true;
				}
			}
		}
		return false;
	}

	function isWindow(obj) {
		return obj && obj.document && obj.location && obj.alert && obj.setInterval;
	}


	function isScope(obj) {
		return obj && obj.$evalAsync && obj.$watch;
	}

	function initWatchVal(){}

	return angular.module('ScopeUtils', []).factory('ScopeUtils', function(){
		return {
			shallowWatch : function(prop, depth){
				var idx = 0;
				var old = initWatchVal;
				return function(current){
					var val = current.$eval(prop);
					if(!shallowEquals(old, val, depth)){
						idx++;
						old = angular.copy(val);
					}
					return idx;
				};
			}
		};
	});
});