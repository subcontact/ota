
"use strict";

var fs = require('fs');
var path = require('path');
var async = require('async');

function getFolders(dirPath, cb) {

  var folders = [];
  fs.readdir(dirPath, function(err, files) {

    if (!err) {

      for (var i=0; i< files.length; i++) {

        files[i] = path.normalize(dirPath + '/' + files[i]);
      }
      async.map(files, fs.stat, function(err, stats) {

        if (!err) {
          for (var i=0; i< stats.length; i++) {

            if (stats[i].isDirectory()) {

              folders.push(files[i]);
            }
          }
        }
        cb(null, folders);
      });
    }
    else {

      console.log('error 2');
    }
  });
}

  var p = process.argv.length > 2 ? process.argv[2] : ".";
  var t0 = Date.now();
  getFolders(p, function(err, folders) {

    if (!err) {

      console.log(folders);
      console.log("length : " + folders.length);
    }
    console.log("completed in " + (Date.now() - t0) + " ms");
  });
