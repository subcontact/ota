var fs = require('fs');
var path = require('path');
var q = require('q');
var FS = require("q-io/fs");

var rootDir = "..";


var getFolders = function(rootDir) {

    var deferred = q.defer();

    FS.list(rootDir).then(function(files) {
      var folders = [];
      files.forEach( function (file) {
        var fullFile = path.normalize(rootDir + '/' + file);
        FS.isDirectory(fullFile).then(function(result) {
          if (result) {
            folders.push(fullFile);
          }
        }).fail(function() {

          return deferred.reject('error stating file');
        });
      });
      return deferred.resolve(folders);
    }).fail(function(error) {

      return deferred.reject('error listing directory : ' + error);
    });

    return deferred.promise;  
};

getFolders(rootDir).then(function(folders) {

  console.log(folders);
}).fail(function(error) {

  console.log('failed ' + error);
});

/*

fs.readdir(rootDir, function (err, files) { 

  if (err) throw err;

   files.forEach( function (file) {

    fullFile = path.normalize(rootDir + '/' + file);
    console.log(fullFile);

    fs.lstat(fullFile, function(err, stats) {

      //console.log(err);


       if (!err && stats.isDirectory()) { //conditing for identifying folders

          console.log('directory : ' + file);
       }
       else if (!err && stats.isFile()) {

          console.log('file : ' + file);
      }
      else if (err) {

        console.log(err);
      }
     });
   });
});



function* countLines(path) {
    var names = yield fs.readdir(path);
    var total = 0;
    for (var i = 0; i < names.length; i++) {
        var fullname = path + '/' + names[i];
        var count = (yield fs.readFile(fullname, 'utf8')).split('\n').length;
        console.log(fullname + ': ' + count);
        total += count;
    }
    return total;
}

function* projectLineCounts() {
    var total = 0;
    total += yield countLines(__dirname + '/../examples');
    total += yield countLines(__dirname + '/../lib');
    total += yield countLines(__dirname + '/../test');
    console.log('TOTAL: ' + total);
    return total;
}

*/