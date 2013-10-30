
//Creates a polling service
define(['angular', 'emitter'], function(angular, EventEmitter){
	return angular.module('PolledService', []).provider('PolledService', [
		function(){
			var provider = this;
			this.defaultPollingInterval = 1000;
			this.$get = [
				'$http', '$timeout',
				function($http, $timeout){

					function PolledService(options){
						if(!options.httpConfig){
							throw new Error('PolledService: httpConfig is a required parameter');
						}
						EventEmitter.apply(this);
						this.httpConfig = options.httpConfig;
						this.pollingInterval = options.pollingInterval || provider.defaultPollingInterval;
						this.onTimeout = angular.bind(this, this.onTimeout);
						this.setTimeout = angular.bind(this, this.setTimeout);
						this.retryOnFail = options.retryOnFail || true;

						this.httpConfig.cache = false;

						this.data = {};
					}

					angular.extend(PolledService.prototype, EventEmitter.prototype, {
						start : function(){
							//restarts if called again
							this.clearTimeout();
							this.setTimeout();
							return this.refresh();
						},
						pause : function(){
							this.clearTimeout();
						},
						clearTimeout : function(){
							if(this.timeoutId){
								$timeout.clear(this.timeoutId);
							}
						},
						setTimeout : function(){
							this.timeoutId = $timeout(this.onTimeout, this.pollingInterval);
						},
						onTimeout : function(){
							return this.refresh().then(this.setTimeout, this.retryOnFail?this.setTimeout:angular.noop);
						},
						refresh : function(){
							var self = this;
							return $http(this.httpConfig).then(function(response){
								if(angular.isObject(response.data)){
									angular.extend(self.data, response.data);
								}
								self.emit('data', self.data);
								return response;
							});
						}
					});

					return {
						create : function(config){
							return new PolledService(config);
						}
					};
				}
			];

			return this;
		}
	]);
});