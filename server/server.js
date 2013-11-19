var fs = require('fs');
var path = require('path');
var q = require('q');
var FS = require("q-io/fs");
var suspend = require("suspend");

var rootDir = "../..";


var getFolders = function(rootDir) {

	var info = null;
	suspend(function* (resume) {

		var files = yield fs.readdir(rootDir, resume);
		files.forEach( function (file) {

			suspend(function* (resume) {
				var fullFile = path.normalize(rootDir + '/' + file);
				info = yield fs.stat(fullFile, resume);
				console.log(fullFile);
		        if (info.isDirectory()) {

		        	console.log('directory!! ');
		        } else {

		        	console.log('Not')
				}
			})();
		});
	})();
};

getFolders(rootDir);
