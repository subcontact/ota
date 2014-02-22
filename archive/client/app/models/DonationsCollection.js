define(['angular', 'utils/LinkedHashMap', 'models/BaseModel', 'services/PolledService'], function(angular, LinkedHashMap){
	return angular.module('DonationsCollection', ['BaseModel', 'PolledService']).factory('DonationsCollection', [
		'BaseModel', 'PolledService',
		function(BaseModel, PolledService){

			function DonationsCollection(){
				BaseModel.apply(this, arguments);
				this.service = PolledService.create({
					httpConfig : {
						method : 'GET',
						url : 'mock/getDonationCollection.json'
					},
					pollingInterval : 1000
				});
				this.data = {};
				this.items = new LinkedHashMap();
			}

			angular.extend(DonationsCollection.prototype, BaseModel.prototype, {
				constructor : DonationsCollection,
				init : function(){
					this.service.on('data', angular.bind(this, this.onData));
					return this.service.refresh();
				},
				destroy : function(){
					BaseModel.prototype.destroy.apply(this, arguments);
					this.service.off('data');
				},
				onData : function(data){
					var self = this;
					var items = data.items;
					var foundItemKeys = {};
					var modified = false;
					angular.forEach(items, function(item){
						var oldItem;
						item.id = 'donation-' + item.itemId;
						oldItem = self.items.get(item.id);
						if(!oldItem){
							modified = true;
							self.items.put(item.id, item);
						} else {
							angular.extend(oldItem, item);
						}
						foundItemKeys[item.id] = true;
					});

					angular.forEach(self.items.keys(), function(id){
						if(!foundItemKeys.hasOwnProperty(id)){
							modified = true;
							self.items.remove(id);
						}
					});

					delete data.items;
					angular.extend(self.data, data);

					self.emit('collectionUpdate', modified);
				},
				_activate : function(){
					var self = this;
					this.service.start();
				},
				_deactivate : function(){
					this.service.pause();
				}
			});

			return DonationsCollection;
		}
	]);
});