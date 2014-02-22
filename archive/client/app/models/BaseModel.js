//Models should be used as viewmodels
define('models/BaseModel', ['angular', 'emitter'], function(angular, EventEmitter){

	return angular.module('BaseModel', []).factory('BaseModel', ['$q', function($q){
		function BaseModel(){
			EventEmitter.apply(this);
			this.isActive = false;
		}

		angular.extend(BaseModel.prototype, EventEmitter.prototype, {
			constructor : BaseModel,
			init : angular.noop,
			destroy : function(){
				this.passive();
			},
			active : function(){
				if(!this.isActive){
					this.active = true;
					this._activate();
				}
			},
			passive : function(){
				if(this.isActive){
					this.active = false;
					this._deactivate();
				}
			},
			update : angular.noop,
			_activate : angular.noop,
			_deactive : angular.noop
		});

		return BaseModel;
	}]);
});