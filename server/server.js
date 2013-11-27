var fs = require('fs');
var path = require('path');
var q = require('q');
var FS = require("q-io/fs");
var suspend = require("suspend");
var co = require("co");

var rootDir = "../..";


var getFolders = function(rootDir) {

	var info = null;
	suspend(function* (resume) {

		var files = yield fs.readdir(rootDir, resume);
		for (var i=0; i< files.length; i++) {

			var fullFile = path.normalize(rootDir + '/' + files[i]);
			console.log(fullFile);
			info = yield fs.stat(fullFile, resume);
	        if (info.isDirectory()) {

	        	console.log('directory!! ');
	        } else {

	        	console.log('Not')
			}
		}
	})();
};

function isDirectory(file) {
  return function(fn){
    fs.stat(file, function(err, stat){
      if (err) return fn(err);
      fn(null, stat.isDirectory());
    });
  }
}

function findFiles(rootDir) {
  return function(fn){
    fs.readdir(rootDir, function(err, files){
      if (err) return fn(err);
      fn(null, files);
    });
  }
}

var getFolders2 = function(rootDir) {

	var isDirectoryFlag = null;

	co(function *() {

		var files = yield findFiles(rootDir);

		for (var i=0; i< files.length; i++) {

			var fullFile = path.normalize(rootDir + '/' + files[i]);
			console.log(fullFile);
			isDirectoryFlag = yield isDirectory(fullFile);
	        if (isDirectoryFlag) {

	        	console.log('directory!! ');
	        } else {

	        	console.log('Not')
			}
		}
	})();
};

//getFolders2(rootDir);
getFolders(rootDir);
