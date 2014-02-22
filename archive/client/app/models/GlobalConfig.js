//Global configuration for the application
define(['angular', 'models/BaseModel', 'services/PolledService'], function(angular){
	return angular.module('GlobalConfig', ['PolledService', 'BaseModel']).factory('GlobalConfig', ['PolledService', 'BaseModel', function(PolledService, BaseModel){
		var service = PolledService.create({
			httpConfig : {
				method : 'GET',
				url : 'mock/getGlobalSystemConfig.json'
			},
			pollingInterval : 30000
		});

		function GlobalConfig(service){
			BaseModel.apply(this, arguments);
			this.service = service;
		}

		angular.extend(GlobalConfig.prototype, BaseModel.prototype, {
			constructor : GlobalConfig,
			init : function(){
				this.service.on('data', angular.bind(this, this.onData));
				return this.service.refresh();
			},
			destroy : function(){
				BaseModel.prototype.destroy.apply(this, arguments);
				this.service.off('data');
			},
			onData : function(){
				this.data = data;
			},
			update : function(){
				return this.service.refresh();
			},
			_activate : function(){
				this.service.start();
			},
			_deactivate : function(){
				this.service.pause();
			}
		});

		return new GlobalConfig(service);
	}]);
});