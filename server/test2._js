
"use strict";

var fs = require('fs');
var path = require('path');

function getFolders(_, dirPath) {

  var stat    = null;
  var folders = [];
  var files   = fs.readdir(dirPath, _);

  for (var i=0; i< files.length; i++) {

    var fullFile = path.normalize(dirPath + '/' + files[i]);
    stat = fs.stat(fullFile, _);
    if (stat.isDirectory()) {

      folders.push(fullFile);
    }
  }
  return folders;
}

try {

  var p = process.argv.length > 2 ? process.argv[2] : ".";
  var t0 = Date.now();
  var folders = getFolders(_, p);
  console.log(folders);
  console.log("length : " + folders.length);
  console.log("completed in " + (Date.now() - t0) + " ms");
} 
catch (ex) {
  console.error(ex.stack);
}
