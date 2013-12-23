
"use strict";

var fs      = require('fs');
var path    = require('path');
var lodash  = require('lodash');

const BUILD_DIR = "builds";

var meta = {

  buildProjects : [

    {
      name    : null,
      type    : "IOS_MOB",
      builds  : [

        {
          name    : null,
        }
      ]
    }
  ]
}

/* --------------- */
/* --------------- */

function getFolders(dirPath, filters, _) {

  var stat, nameFilter  = null;
  var folders = [];
  var files   = fs.readdir(dirPath, _);
  if (filters && filters.name) {
    nameFilter = filters.name; // expecting native regex syntax rather than creating a regex object off a string
  }
  for (var i=0; i< files.length; i++) {
    var fullFile = path.normalize(dirPath + '/' + files[i]);
    stat = fs.stat(fullFile, _);
    if (stat.isDirectory()) {
      if (nameFilter) {
        if (nameFilter.test(path.basename(fullFile))) {
          folders.push(fullFile);
        }
      }
      else {
        folders.push(fullFile);
      }
    }
  }
  return folders;
}
/* --------------- */
/* --------------- */
// TODO - merge these two functions getFiles and getFolders
function getFiles(dirPath, filters, _) {

  var stat, nameFilter  = null;
  var realFiles = [];
  var files   = fs.readdir(dirPath, _);
  if (filters && filters.name) {
    nameFilter = filters.name; // expecting native regex syntax rather than creating a regex object off a string
  }
  for (var i=0; i< files.length; i++) {
    var fullFile = path.normalize(dirPath + '/' + files[i]);
    stat = fs.stat(fullFile, _);
    if (stat.isFile()) {
      if (nameFilter) {
        if (nameFilter.test(path.basename(fullFile))) {
          realFiles.push(fullFile);
        }
      }
      else {
        realFiles.push(fullFile);
      }
    }
  }
  return realFiles;
}

/* --------------- */
/* --------------- */

// the initial path representing each jenkins build profile
function getBuildProjects(rootPath, _) {

  var buildProjects = getFolders(rootPath, null, _);
  return buildProjects;
}

/* --------------- */
/* --------------- */

// exists workaround as it doesnt have the usual callback signature
// see https://github.com/Sage/streamline-fs
var fileExists = _(function(path, cb) {
        fs.exists(path, function(result) {
                cb(null, result);
        });
}, 1);

/* --------------- */
/* --------------- */

// retreives a list of build folders for a build profile
// expects a folder named "build" with a list of folders matching a time format
function getBuildProjectList(buildProfilePath, _) {

    var fullFile = path.normalize(buildProfilePath + '/' + BUILD_DIR);
    if (fileExists(fullFile, _)) {
      var stat = fs.stat(fullFile, _);
      if (stat.isDirectory()) {
        var buildList = getFolders(fullFile, { name : /^\d{14}$/i }, _); // using direct regex syntax rather than a string 
      }
    }
    return buildList;
}

function getBuildFile() {

}

function getBuildInfo() {

}

function findAppType() {

}

try {

  var p = process.argv.length > 2 ? process.argv[2] : ".";
  var t0 = Date.now();
  var buildProjects = getBuildProjects(p, _);
  console.log(getBuildProjectList(buildProjects[0], _));
  //console.log(buildProjects);
  //console.log("length : " + buildProjects.length);
  console.log("completed in " + (Date.now() - t0) + " ms");
} 
catch (ex) {
  console.error(ex.stack);
}
