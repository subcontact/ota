var fs = require('fs');
var path = require('path');
var q = require('q');
var FS = require("q-io/fs");
var suspend = require("suspend");
var co = require("co");

var rootDir = "build_server";


function exists(file, cb) {

    fs.exists(file, function(exists){
      cb(null, exists);
    });
}

var getFolders = function(rootDir) {

	var info = null;
	var file_exist = null;
	suspend(function* (resume) {

		var files = yield fs.readdir(rootDir, resume);
		for (var i=0; i< files.length; i++) {

			var fullFile = path.normalize(rootDir + '/' + files[i]);
			console.log(fullFile);
			info = yield fs.stat(fullFile, resume);

	        if (info.isDirectory()) {

	        	console.log('directory!! ');
	        	fullFile = fullFile + "/builds";
	        	file_exist = yield exists(fullFile, resume);
	        	if (file_exist) {

	        		console.log("build dir exists");

	        		getFolders(fullFile);
	        	}

	        } else {

	        	console.log('Not')
			}
		}
	})();
};

getFolders(rootDir);
