//http://dailyjs.com/2012/09/24/linkedhashmap/
define(['utils/HashMap'], function(HashMap){
	/**
	 * Constructor that initializes the parent HashMap
	 * and the doubly linked list head and tail.
	 */
	var LinkedHashMap = function() {
		// invoke super constructor
		HashMap.apply(this, arguments);

		// "inner" Entry class
		this._Entry = function(value) {
			this.prev = null;
			this.next = null;
			this.value = value;
		};

		// doubly linkedlist instance variables
		this._head = this._tail = null;
	};

	// extend HashMap and overwrite the necessary functions
	var temp = function() {};
	temp.prototype = HashMap.prototype;
	LinkedHashMap.prototype = new temp();

	/**
	 * Puts the key/value pair in the HashMap and records
	 * the insertion record if it does not exist.
	 * 
	 * @override HashMap.put()
	 */
	LinkedHashMap.prototype.put = function(key, value) {
		var entry = new this._Entry(key);

		if (!this.containsKey(key)) {
			if (this.size() === 0) {
				this._head = entry;
				this._tail = entry;
			} else {
				this._tail.next = entry;
				entry.prev = this._tail;
				this._tail = entry;
			}
		}

		/*
		 * EDIT: Added optimization suggested
		 * by Chad Walker (see article comments).
		 */
		// overwrite the value with an optimized Object wrapper
		value = {value:value, entry:entry};

		HashMap.prototype.put.call(this, key, value);
	};

	/**
	 * Returns the value associated with the key.
	 * 
	 * @override HashMap.get()
	 */
	LinkedHashMap.prototype.get = function(key){
		var value = HashMap.prototype.get.call(this, key);
		
		/*
		 * EDIT: Added optimization suggested 
		 * by Chad Walker (see article comments).
		 */  
		// we must unwrap the value
		return value != null ? value.value : null;
	};

	/**
	 * Removes the key/value pair from the map and 
	 * the key from the insertion order.
	 * 
	 * @override Hashmap.remove()
	 */
	LinkedHashMap.prototype.remove = function(key) {

		/*
		 * EDIT: Added optimization suggested 
		 * by Chad Walker (see article comments).
		 */
		var value = HashMap.prototype.remove.apply(this, arguments);

		if (value != null) {
		
			var entry = value.entry;
		
			if (entry === this._head) {
				this._head = entry.next;
				this._head.prev = null;
			} else if (entry === this._tail) {
				this._tail = entry.prev;
				this._tail.next = null;
			} else {
				entry.prev.next = entry.next;
				entry.next.prev = entry.prev;
			}
		}

		return value;
	};

	/**
	 * Clears the HashMap and insertion order.
	 *
	 * @override HashMap.clear()
	 */
	LinkedHashMap.prototype.clear = function() {
		HashMap.prototype.clear.apply(this, arguments);
		this._head = this._tail = null;
	};

	/**
	 * Returns the HashMap keys in insertion order.
	 *
	 * @override HashMap.keys()
	 */
	LinkedHashMap.prototype.keys = function() {
		var keys = [];
		for (var cur = this._head; cur != null; cur = cur.next) {
			keys.push(cur.value);
		}
		return keys;
	};

	/**
	 * Returns the HashMap values in insertion order.
	 * 
	 * @override HashMap.values()
	 */
	LinkedHashMap.prototype.values = function() {
		var values = [];
		for (var cur = this._head; cur != null; cur = cur.next) {
			values.push(this.get(cur.value));
		}
		return values;
	};
	
	return LinkedHashMap;
});