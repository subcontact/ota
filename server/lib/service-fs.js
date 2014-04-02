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
          buildList = yield self.getFolders(fullFile);
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
    //console.log(data);  
    var results = {};
    results.commitHash        = data.commitHash;
    results.displayName       = data[consts.IOS_NAME];
    results.version           = data[consts.IOS_VERSION];
    results[consts.IOS_ID]    = data[consts.IOS_ID];
    results[consts.IOS_TEAM]  = data[consts.IOS_TEAM];
    results[consts.IOS_ICON]  = data[consts.IOS_ICON];
    results.url               = path.normalize(consts.HOST_SVR + '/' + encodeURI(this.removeRootPath(file)));
    results.installerUrl      = path.normalize(encodeURI(this.removeRootPath(file) + '/installer'));
    //console.log(file);
    //console.log(self.removeRootPath(file));
    var output = mustache.render(yield fs.readFile(__dirname + '/manifest.plist.template', 'utf8'), results);
    results.installerSource = output;
    //console.log(results);
    return results;
  };

  this.parseAPK = function *(file) {

    var data = yield apkParser(file);
    return data;
  };

  this.getBuildInfoAND = function *(file) {
    var data = yield this.parseAPK(file);
    return {
      commitHash : "12345A",
      version    : "1.54",
    };  
  };

  this.getBuildInfoWIN = function(file) {
    return {
      commitHash : "12345A",
      version    : "1.54",
    };  
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
       stat = yield fs.stat(self.resolveRootPath(dirPath + '/' + file));
       if (consts.iOS_FILE.test(file)) {
          data = {
            type : consts.TYPE_IOS,
            buildName : path.basename(file).replace(consts.iOS_FILE, ""),
            buildFile : self.removeRootPath(dirPath + '/' + file),
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
            buildFile : self.removeRootPath(dirPath + '/' + file),
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
            buildFile : self.removeRootPath(dirPath + '/' + file),
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
            buildFile : self.removeRootPath(dirPath + '/' + file),
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

    var p = yield self.getFolders(buildFolderRoot);
    var projects = []; 

    var list, files, dirPath, fullFile, buildInfo, filePath;
    // loop through and get the builds for each project. 
    // We need one to work out the type of project (EG TYPE);
    for (var i=0; i<p.length; i++) {

      filePath = self.resolveRootPath(p[i]);
      list = yield self.getBuildProjectList(filePath);
      if (list.length > 0) {
        dirPath = list[0];
        buildInfo = yield self.findBuildFile(dirPath);
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
    data = yield self.getProjectsService();
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
    filePath = self.resolveRootPath(projectPath);
    list = yield self.getBuildProjectList(filePath);
    var buildList = [];
    for (var i=0; i<list.length; i++) {
      data = self.removeRootPath(list[i]);
      buildList.push({
        instanceName  : path.basename(data),
        instanceLabel : self.normaliseDate(path.basename(data)),
        instanceLabel2: moment(self.normaliseDate(path.basename(data))).fromNow() + " (" + moment(self.normaliseDate(path.basename(data))).toISOString() + ")",
        _id           : data.replace(/[\/\s]/g, '_'),
        instancePath  : data,
      });

      buildInfo = yield self.findBuildFile(self.resolveRootPath(list[i]));
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
    data = yield self.getProjectBuildListService(projectPath);
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
      buildData = yield this.buildInfoMethods[projectBuild.type](self.resolveRootPath(projectBuild.buildFile));
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
    data = yield self.getProjectBuildDataService(projectBuild);
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