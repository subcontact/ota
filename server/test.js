"use strict";

var co        = require('co');
var util      = require('util');
var ota       = require('./ota-fs');
var assert	  = require('assert');
var q 		= require('q');

var thisFolder = ".";
var serverFolder = "..";
var homeFolder = "~";
var noFolder = "/ZXBC987QQQHSGD34567FFF3452F";

var giveme = function (value) {
  var deferred = q.defer();
  deferred.resolve(value);
  return deferred.promise;
};


co(function *(){
	var folders = yield ota.getFolders(thisFolder);

	//var a = yield giveme(10);
	//console.log(a);
	//console.log(a===3);
	//assert(a===3, 'nope');
	assert.strictEqual(util.isArray(folders), true, 'not an array');
	assert(folders.length > 0, 'no items found');
})();

co(function *(){
	//var folders = yield ota.getFolders(thisFolder);

	var a = yield giveme(10);
	//console.log(a);
	//console.log(a===3);
	assert.strictEqual(true,false, 'failed');
	//assert.strictEqual(util.isArray(folders), true, 'not an array');
	//assert(folders.length == 0, 'no items found');
})();
	assert.strictEqual(true,false, 'failed');

/*
co(function *(){
	var folders = yield ota.getFolders(serverFolder);

	assert.strictEqual(util.isArray(folders), true, 'not an array');
	assert(folders.length > 0, 'no items found');
})();
*/
/*
co(function *(){
	var folders = yield ota.getFolders(homeFolder);

	assert.strictEqual(util.isArray(folders), true, 'not an array');
	assert(folders.length > 0, 'no items found');
})();
*/
co(function *(){
	var folders = yield ota.getFolders(noFolder);

	assert.strictEqual(util.isArray(folders), true, 'not an array');
	assert(folders.length == 0, 'no items found');
})();

/*
co(function *(){
	var folders = yield ota.getFiles(thisFolder);

	assert.strictEqual(util.isArray(folders), true, 'not an array');
	assert(folders.length > 0, 'no items found');
})();

co(function *(){
	var folders = yield ota.getFiles(serverFolder);

	assert.strictEqual(util.isArray(folders), true, 'not an array');
	assert(folders.length > 0, 'no items found');
})();
*/
/*
co(function *(){
	var folders = yield ota.getFiles(homeFolder);

	assert.strictEqual(util.isArray(folders), true, 'not an array');
	assert(folders.length > 0, 'no items found');
})();

co(function *(){
	var folders = yield ota.getFiles(noFolder);

	assert.strictEqual(util.isArray(folders), true, 'not an array');
	assert(folders.length > 0, 'no items found');
})();
*/