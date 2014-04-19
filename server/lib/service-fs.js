"use strict";

var fs        = require('co-fs');
var thunkify  = require('thunkify');
var path      = require('path');
var lodash    = require('lodash');
var util      = require('util');
var bplist    = require('bplist-parser');
var parseAPK  = require('apk-parser');
var zip       = require('zip');
var util      = require('util');
var mustache  = require('mustache');
var moment    = require('moment');
var consts    = require('./consts');
var LRU       = require("lru-cache");
var walk      = require('co-walk');
var unglob    = require('unglob');

var apkParser = thunkify(parseAPK);

var service = function() {
  var self = this;
  var buildProjects = null;
  var buildFolderRoot = null;
  var buildFolderRootRE = null;
  var lruCache = LRU({ max : 200,  maxAge : consts.M_CACHE});

  this.setBuildFolderRoot = function(value) {
    buildFolderRoot   = value;
    buildFolderRootRE = new RegExp("^" + buildFolderRoot); // used to check if a path is already starting at the root for resolveRootPath
  };

  this.getBuildFolderRoot = function() {
    return buildFolderRoot;
  };

  this.resolveRootPath = function(value) {
    return path.resolve(buildFolderRoot, value);
  };

  this.removeRootPath = function(value) {
    return path.normalize(value).replace(buildFolderRootRE, "").replace(new RegExp("^/"),"");
  };

  this.getFolders = function *(dirPath){
    var stat, fullFile, files, i;
    var folders = [];
    try {
      files = yield fs.readdir(dirPath);
    } catch(e) {
      return [];
    }
    for (i=0; i<files.length; i++) {
      fullFile = path.normalize(dirPath + '/' + files[i]);
      stat = yield fs.lstat(fullFile);
      if (stat.isDirectory()) {
          folders.push(fullFile);
      }
    }
    return folders;
  };

  // retreives a list of build folders for a build profile
  // expects a folder named "build" with a list of folders matching a time format
  this.getBuildProjectList = function *(buildProfilePath) {
    var buildList = [];
    var i,j;
      var fullFile = path.normalize(buildProfilePath + '/' + consts.BUILD_DIR);
      if (yield fs.exists(fullFile)) {
        var stat = yield fs.stat(fullFile);
        if (stat.isDirectory()) {
          buildList = yield this.getFolders(fullFile);
        }
      }
      return buildList.sort(function(a,b) {

        if (b<a) return -1;
        if (a<b) return 1;
        return 0;
      });
  };

  this.filterKnownBuildFolder = function(folder) {

    for (var i=0; i<consts.PARSE_BUILD_DIR.length; i++)
    {
      if (consts.PARSE_BUILD_DIR[i].pattern.test(path.basename(folder))) {
        return true;
      }
    }
    return false;
  };

  this.normaliseDate = function(folder) {

    for (var i=0; i<consts.PARSE_BUILD_DIR.length; i++)
    {
      if (consts.PARSE_BUILD_DIR[i].pattern.test(path.basename(folder))) {
        return moment(path.basename(folder), consts.PARSE_BUILD_DIR[i].format).valueOf();
      }
    }
    return path.basename(folder);
  };

  this.parseIPA = function *(file) {
    var fileBuffer      = yield fs.readFile(file);
    var reader          = zip.Reader(fileBuffer);
    var InfoFound       = false;
    var ProvisionFound  = false;
    var iterator        = reader.iterator();
    var entry;
    var data = {};
    while (true) {
      try {
          entry = iterator.next();
      } catch (exception) {
          if (exception === "stop-iteration")
              break;
          if (exception === "skip-iteration")
              continue;
          break;
      }

      if (entry.getName().match('/CommitHash')) {
        data.commitHash = entry.getData().toString('utf-8').trim();
      }
      if (!InfoFound && entry.getName().match(/Info\.plist$/) && entry.isFile()) {
        InfoFound = true;
        lodash.extend(data,bplist.parseBuffer(entry.getData())[0]);
      }
    }
    return data ? data : {}
  };

  this.getBuildInfoIOS = function *(file) {

    var data = yield this.parseIPA(file);

    console.log(data);
    var results = {

      'commitHash'            : data.commitHash,
      'displayName'           : data['CFBundleDisplayName'],
      'version'               : data['CFBundleVersion'],
      'id'                    : data['CFBundleName'],
      'package'               : data['CFBundleIdentifier'],
      'icon'                  : data['CFBundleIconFile'],
      'url'                   : path.normalize(consts.HOST_SVR + '/' + encodeURI(this.removeRootPath(file))),
      'installerUrl'          : path.normalize(encodeURI(this.removeRootPath(file) + '/installer')),
      'installerSource'       : null
    };

    var output = mustache.render(yield fs.readFile(__dirname + '/manifest.plist.template', 'utf8'), results);
    results.installerSource = output;

    return results;
  };

  this.parseAPK = function *(file) {

    var data = yield apkParser(file);
    return data;
  };

  this.getBuildInfoAND = function *(file) {
    var data = yield this.parseAPK(file);

    var results = {

      'commitHash'            : null,
      'displayName'           : data.manifest[0].application[0]['@android:name'],
      'version'               : data.manifest[0]['@android:versionName'],
      'id'                    : null,
      'package'               : data.manifest[0]['@package'],
      'icon'                  : data.manifest[0].application[0]['@android:icon'],
      'url'                   : path.normalize(consts.HOST_SVR + '/' + encodeURI(this.removeRootPath(file))),
      'installerUrl'          : path.normalize(encodeURI(this.removeRootPath(file) + '/installer')),
      'installerSource'       : null
    };
    return results;
  };

  this.getBuildInfoWIN = function(file) {

    var results = {

      'commitHash'            : null,
      'displayName'           : null,
      'version'               : null,
      'id'                    : null,
      'package'               : null,
      'icon'                  : null,
      'url'                   : path.normalize(consts.HOST_SVR + '/' + encodeURI(this.removeRootPath(file))),
      'installerUrl'          : path.normalize(encodeURI(this.removeRootPath(file) + '/installer')),
      'installerSource'       : null
    };
    return results;
  };

  this.findBuildFile = function *(dirPath) {
    var file, stat, files;
    var found = false;
    var data = null;
    try {
      files = yield walk(dirPath);
    } catch (e) {return null}
    var list = unglob.list(['**/*.xap', '**/*.exe', '**/*.ipa', '**/*.apk'], files);

    for (var i=0; i<list.length; i++) {
       file = list[i];
       stat = yield fs.stat(this.resolveRootPath(dirPath + '/' + file));
       if (consts.iOS_FILE.test(file)) {
          data = {
            type : consts.TYPE_IOS,
            buildName : path.basename(file).replace(consts.iOS_FILE, ""),
            buildFile : this.removeRootPath(dirPath + '/' + file),
            size      : stat.size,
            timeStamp : stat.mtime.getTime(),
            timeStamp2: moment(stat.mtime.getTime()).fromNow() + " (" + moment(stat.mtime.getTime()).toISOString() + ")",
          };
          found = true;
        }
        else if (consts.AND_FILE.test(file)) {
          data = {
            type : consts.TYPE_AND,
            buildName : path.basename(file).replace(consts.AND_FILE, ""),
            buildFile : this.removeRootPath(dirPath + '/' + file),
            size      : stat.size,
            timeStamp : stat.mtime.getTime(),
            timeStamp2: moment(stat.mtime.getTime()).fromNow() + " (" + moment(stat.mtime.getTime()).toISOString() + ")",
          };
          found = true;
        }
        else if (consts.WIN_FILE_EXE.test(file)) {
          data = {
            type : consts.TYPE_WIN,
            buildName : path.basename(file).replace(consts.WIN_FILE_EXE, ""),
            buildFile : this.removeRootPath(dirPath + '/' + file),
            size      : stat.size,
            timeStamp : stat.mtime.getTime(),
            timeStamp2: moment(stat.mtime.getTime()).fromNow() + " (" + moment(stat.mtime.getTime()).toISOString() + ")",
          };
          found = true;
        }
        else if (consts.WIN_FILE_XAP.test(file)) {
          data = {
            type : consts.TYPE_WIN,
            buildName : path.basename(file).replace(consts.WIN_FILE_XAP, ""),
            buildFile : this.removeRootPath(dirPath + '/' + file),
            size      : stat.size,
            timeStamp : stat.mtime.getTime(),
            timeStamp2: moment(stat.mtime.getTime()).fromNow() + " (" + moment(stat.mtime.getTime()).toISOString() + ")",
          };
          found = true;
        }
        if (found) {break}
    }
    return data;
  };

  this.getProjectsService = function *() {

    var p = yield this.getFolders(buildFolderRoot);
    var projects = []; 

    var list, files, dirPath, fullFile, buildInfo, filePath;
    // loop through and get the builds for each project. 
    // We need one to work out the type of project (EG TYPE);
    for (var i=0; i<p.length; i++) {

      filePath = this.resolveRootPath(p[i]);
      list = yield this.getBuildProjectList(filePath);
      if (list.length > 0) {
        dirPath = list[0];
        buildInfo = yield this.findBuildFile(dirPath);
        if (buildInfo) {
          projects.push({
            name  : path.basename(filePath),
            _id   : filePath.replace(/[\/\s]/g, '_'),
            path  : filePath,
            type  : buildInfo.type,
            label : consts.TYPE_LABELS[buildInfo.type]
          });
        } else {
          projects.push({
            name  : path.basename(filePath),
            _id   : filePath.replace(/[\/\s]/g, '_'),
            path  : filePath,
            type  : consts.TYPE_UNKNOWN,
            label : consts.TYPE_LABELS[consts.TYPE_UNKNOWN]
          });
        }
      }
    }
    return projects;      
  };

  this.getProjectsServiceCached = function *() {

    var data = lruCache.get(consts.CK_GET_PROJECTS);
    if (data != null) {
      return {
        cacheHit : true,
        ts       : data.ts,
        data     : data.data
      };
    }
    data = yield this.getProjectsService();
    var cacheObj = {
      ts   : Date.now(),
      data : data
    };
    lruCache.set(consts.CK_GET_PROJECTS, cacheObj);
    return {
        cacheHit : false,
        ts       : cacheObj.ts,
        data     : cacheObj.data
    };
  };

  this.getProjectBuildListService = function *(projectPath) {

    if (!projectPath || typeof projectPath !== 'string') {return []}

    var list, files, dirPath, fullFile, buildInfo, buildData, data, filePath;
    filePath = this.resolveRootPath(projectPath);
    list = yield this.getBuildProjectList(filePath);
    var buildList = [];
    for (var i=0; i<list.length; i++) {
      data = this.removeRootPath(list[i]);
      buildList.push({
        instanceName  : path.basename(data),
        instanceLabel : this.normaliseDate(path.basename(data)),
        instanceLabel2: moment(this.normaliseDate(path.basename(data))).fromNow() + " (" + moment(this.normaliseDate(path.basename(data))).toISOString() + ")",
        _id           : data.replace(/[\/\s]/g, '_'),
        instancePath  : data,
      });

      buildInfo = yield this.findBuildFile(this.resolveRootPath(list[i]));
      if (buildInfo) {
        lodash.extend(buildList[i], buildInfo);
      }
    }
    return buildList; 
  };

  this.getProjectBuildListServiceCached = function *(projectPath) {

    if (!projectPath || typeof projectPath !== 'string') {return []}

    var cacheKey = consts.CK_GET_PROJECT_BUILDS + '_' + projectPath;
    var data = lruCache.get(cacheKey);
    if (data != null) {
      return {
        cacheHit : true,
        ts       : data.ts,
        data     : data.data
      };
    }
    data = yield this.getProjectBuildListService(projectPath);
    var cacheObj = {
      ts   : Date.now(),
      data : data
    };
    lruCache.set(cacheKey, cacheObj);
    return {
        cacheHit : false,
        ts       : cacheObj.ts,
        data     : cacheObj.data
    };
  };

  this.buildInfoMethods = {};
  this.buildInfoMethods[consts.TYPE_IOS] = this.getBuildInfoIOS;
  this.buildInfoMethods[consts.TYPE_AND] = this.getBuildInfoAND;
  this.buildInfoMethods[consts.TYPE_WIN] = this.getBuildInfoWIN;

  this.getProjectBuildDataService = function* (projectBuild) {

    if (!projectBuild || !util.isObject(projectBuild)) {return null}

    var buildData = null;
    if (projectBuild.hasOwnProperty('type') && this.buildInfoMethods[projectBuild.type]) {
      buildData = yield this.buildInfoMethods[projectBuild.type].call(this, this.resolveRootPath(projectBuild.buildFile));
    }
    return buildData;
  };

  this.getProjectBuildDataServiceCached = function *(projectBuild) {

    if (!projectBuild || !util.isObject(projectBuild)) {return null}

    var cacheKey = consts.CK_GET_BUILD_DATA + '_' + projectBuild.buildFile;
    var data = lruCache.get(cacheKey);
    if (data !=  null) {
      return {
        cacheHit : true,
        ts       : data.ts,
        data     : data.data
      };
    }
    data = yield this.getProjectBuildDataService(projectBuild);
    var cacheObj = {
      ts   : Date.now(),
      data : data
    };
    lruCache.set(cacheKey, cacheObj);
    return {
        cacheHit : false,
        ts       : cacheObj.ts,
        data     : cacheObj.data
    };
  };  
}
module.exports = new service();