var q       = require('q');
var koa     = require('koa');
var router  = require('koa-router');
var co      = require('co');
var fs      = require('co-fs');
var path    = require('path');
var lodash  = require('lodash');
var util    = require('util');
var find    = require('findit');

const BUILD_DIR = "builds";
const BUILD_LIST_PATTERN = /^\d{14}$/i;
const iOS_FILE  = /\.ipa$/i;
const AND_FILE  = /\.apk$/i;
const WIN_FILE  = /\.exe$/i;
const TYPE_IOS  = 1;
const TYPE_AND  = 2;
const TYPE_WIN  = 3;

const TYPE_IPHONE         = 4;
const TYPE_IPAD           = 5;
const TYPE_ANDROID_PHONE  = 6;
const TYPE_ANDROID_TABLET = 7;
const TYPE_WINDOWS_PHONE  = 8;
const TYPE_WINDOWS_TABLET = 9;

const TYPE_LABELS = {
  1 : "iOS",
  2 : "Android",
  3 : "Windows",

  4 : "iPhone",
  5 : "iPad",
  6 : "Android Phone",
  7 : "Android Tablet",
  8 : "Windows Phone",
  9 : "Windows Tablet"
};

//TODO : Turn this into a cache
var meta = {
  buildProjects : null
};

var app = koa();
var buildFolderRoot = '/Users/jcuiuli/code/ota/server/build_server';

function clone(value, excludeList) {
  var cloned;
  if (!excludeList) {excludeList = [];}
  if (lodash.isArray(value)) {
    cloned = value.map(function(data) {
      return clone(data, excludeList);
    });
    return cloned;
  } else if (lodash.isObject(value)) {
    var exclude = false;
    cloned = {};
    for (var k in value) {
      exclude = false;
      for (var i=0; i<excludeList.length; i++) {
        if (k == excludeList[i]) {exclude = true;}
      }
      if (!exclude) {
        cloned[k] = value[k];
      }
    }
    return cloned;
  }
  else {
    return value;
  }
}

function* getFolders(dirPath, filters) {

  var stat, nameFilter  = null;
  var folders = [];
  var files   = yield fs.readdir(dirPath);
  if (filters && filters.name) {
    nameFilter = filters.name;
  }
  for (var i=0; i< files.length; i++) {
    var fullFile = path.normalize(dirPath + '/' + files[i]);
    stat = yield fs.stat(fullFile);
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

// TODO - merge these two functions getFiles and getFolders
function* getFiles(dirPath, filters) {

  var stat, nameFilter  = null;
  var realFiles = [];
  var files   = yield fs.readdir(dirPath);
  if (filters && filters.name) {
    nameFilter = filters.name;
  }
  for (var i=0; i< files.length; i++) {
    var fullFile = path.normalize(dirPath + '/' + files[i]);
    stat = yield fs.stat(fullFile);
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

// the initial path representing each jenkins build profile
function* getBuildProjects(rootPath) {

  var buildProjects = yield getFolders(rootPath);
  return buildProjects;
}


function wait(ms) {
  var deferred = q.defer();
 
  setTimeout(function() { deferred.resolve("Wait Done") }, ms); 
 
  return deferred.promise;
}

// x-response-time

app.use(function *(next){
  var start = new Date;
  yield next;
  var ms = new Date - start;
  this.set('X-Response-Time', ms + 'ms');
});

// logger

app.use(function *(next){
  var start = new Date;
  yield next;
  var ms = new Date - start;
  console.log('%s %s - %s', this.method, this.url, ms);
});

app.use(router(app));  
// response

/*
app.use(function *(){
  this.body = 'Hello World';
});
*/  

app.get('/users/:id', function *(next) {
  //var data = yield wait(3000);
  var data = yield getBuildProjects(buildFolderRoot);
  this.body = data;
});

app.listen(3000);