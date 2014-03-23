"use strict";
var q         = require('q');
var koa       = require('koa');
var router    = require('koa-router');
var thunkify  = require('thunkify');
var co        = require('co');
var fs        = require('co-fs');
var old_fs    = require('fs');
var path      = require('path');
var lodash    = require('lodash');
var util      = require('util');
var bplist    = require('bplist-parser');
var admZip    = require('adm-zip');
var zip       = require('zip');
var util      = require('util');
var mustache  = require('mustache');
var moment    = require('moment');
var otaconsts = require('./ota-consts');
var find     = require('find');
var cache     = require('./mem-cache');
var walk      = require('co-walk');
var unglob    = require('unglob');

function zipReadAsTextAsyncThunk(object, entry) {
  return function(done){
    // for some reason the params are non standard (swapped) meaning I had to thunk this myself.
    object.readAsTextAsync(entry, function(data, err) {
      done(err, data);
    });
  }
};

function sleep(ms) {
  return function (cb) {
    setTimeout(cb, ms);
  };
}


var otafs = function() {
  var self = this;
  var buildProjects = null;
  var buildFolderRoot = null;
  var buildFolderRootRE = null;

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

  this.clone = function(value, excludeList) {
    var cloned;
    if (!excludeList) {excludeList = [];}
    if (lodash.isArray(value)) {
      cloned = value.map(function(data) {
        return self.clone(data, excludeList);
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
      var fullFile = path.normalize(buildProfilePath + '/' + otaconsts.BUILD_DIR);
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

    for (var i=0; i<otaconsts.PARSE_BUILD_DIR.length; i++)
    {
      if (otaconsts.PARSE_BUILD_DIR[i].pattern.test(path.basename(folder))) {
        return true;
      }
    }
    return false;
  };

  this.normaliseDate = function(folder) {

    for (var i=0; i<otaconsts.PARSE_BUILD_DIR.length; i++)
    {
      if (otaconsts.PARSE_BUILD_DIR[i].pattern.test(path.basename(folder))) {
        return moment(path.basename(folder), otaconsts.PARSE_BUILD_DIR[i].format).valueOf();
      }
    }
    return path.basename(folder);
  };

  this.parseIPA = function *(file) {
    var fileBuffer  = yield fs.readFile(file);
    var reader      = zip.Reader(fileBuffer);
    var InfoFound   = false;
    var ProvisionFound = false;
    var iterator    = reader.iterator();
    var entry, data;
    while (true) {
      try {
          entry = iterator.next();
      } catch (exception) {
          if (exception === "stop-iteration")
              break;
          if (exception === "skip-iteration")
              continue;
          throw exception;
      }
/*
      console.log("!" + entry.getName() + "!");
      console.log(entry.getName().match(/\/Info\.plist$/));
      console.log(entry.getName().match(/.*moblieprovision$/));
*/
      // !Payload/MultiG.app/embedded.mobileprovision!
      // !Payload/MultiG.app/MultiMail.momd/VersionInfo.plist!

      if (!InfoFound && entry.getName().match(/Info\.plist$/)) {
        InfoFound = true;
        data = entry.getData();
        data = bplist.parseBuffer(data)[0];
      }
/*
      if (entry.getName().match(/embedded\.moblieprovision$/)) {
//      if (!ProvisionFound && entry.getName().match(/dist\.plist/)) {
        //ProvisionFound = true;
        //data = entry.getData();
        //data = bplist.parseBuffer(data)[0];
        console.log('!!!! mobileprovision !!!!');
        //console.log(data);
      }
      */
      //if (InfoFound && ProvisionFound) { break; }
      if (InfoFound) { break; }
    }
    return data ? data : {}
  };

  this.getBuildInfoIOS = function *(file) {
    var data = yield self.parseIPA(file);
    var results = {
      commitHash : "12345A",
    };  
    results['displayName']       = data[otaconsts.IOS_NAME];
    results['version']           = data[otaconsts.IOS_VERSION];
    results[otaconsts.IOS_ID]    = data[otaconsts.IOS_ID];
    results[otaconsts.IOS_TEAM]  = data[otaconsts.IOS_TEAM];
    results[otaconsts.IOS_ICON]  = data[otaconsts.IOS_ICON];
    results['url']               = path.normalize(otaconsts.HOST_SVR + '/' + encodeURI(self.removeRootPath(file)));
    results['installerUrl']      = path.normalize(encodeURI(self.removeRootPath(file) + '/installer'));

    console.log(file);
    console.log(self.removeRootPath(file));

    var output = mustache.render(yield fs.readFile('manifest.plist.template', 'utf8'), results);
    results['installerSource'] = output;
    return results;
  };

  this.getBuildInfoAND = function(file) {
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
       if (otaconsts.iOS_FILE.test(file)) {
          data = {
            type : otaconsts.TYPE_IOS,
            buildName : path.basename(file).replace(otaconsts.iOS_FILE, ""),
            buildFile : self.removeRootPath(dirPath + '/' + file),
            size      : stat.size,
            timeStamp : stat.mtime.getTime(),
            timeStamp2: moment(stat.mtime.getTime()).fromNow() + " (" + moment(stat.mtime.getTime()).toISOString() + ")",
          };
          found = true;
        }
        else if (otaconsts.AND_FILE.test(file)) {
          data = {
            type : otaconsts.TYPE_AND,
            buildName : path.basename(file).replace(otaconsts.AND_FILE, ""),
            buildFile : self.removeRootPath(dirPath + '/' + file),
            size      : stat.size,
            timeStamp : stat.mtime.getTime(),
            timeStamp2: moment(stat.mtime.getTime()).fromNow() + " (" + moment(stat.mtime.getTime()).toISOString() + ")",
          };
          found = true;
        }
        else if (otaconsts.WIN_FILE_EXE.test(file)) {
          data = {
            type : otaconsts.TYPE_WIN,
            buildName : path.basename(file).replace(otaconsts.WIN_FILE_EXE, ""),
            buildFile : self.removeRootPath(dirPath + '/' + file),
            size      : stat.size,
            timeStamp : stat.mtime.getTime(),
            timeStamp2: moment(stat.mtime.getTime()).fromNow() + " (" + moment(stat.mtime.getTime()).toISOString() + ")",
          };
          found = true;
        }
        else if (otaconsts.WIN_FILE_XAP.test(file)) {
          data = {
            type : otaconsts.TYPE_WIN,
            buildName : path.basename(file).replace(otaconsts.WIN_FILE_XAP, ""),
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
            label : otaconsts.TYPE_LABELS[buildInfo.type]
          });
        } else {
          projects.push({
            name  : path.basename(filePath),
            _id   : filePath.replace(/[\/\s]/g, '_'),
            path  : filePath,
            type  : otaconsts.TYPE_UNKNOWN,
            label : otaconsts.TYPE_LABELS[otaconsts.TYPE_UNKNOWN]
          });
        }
      }
    }
    return projects;      
  };

  this.getProjectsServiceCached = function *() {

    var data = cache.get(otaconsts.CK_GET_PROJECTS);
    if (data !== null) {
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
    cache.set(otaconsts.CK_GET_PROJECTS, cacheObj, otaconsts.M_CACHE);
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

    var cacheKey = otaconsts.CK_GET_PROJECT_BUILDS + '_' + projectPath;
    var data = cache.get(cacheKey);
    if (data !== null) {
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
    cache.set(cacheKey, cacheObj, otaconsts.M_CACHE);
    return {
        cacheHit : false,
        ts       : cacheObj.ts,
        data     : cacheObj.data
    };
  };

  this.buildInfoMethods = {};
  this.buildInfoMethods[otaconsts.TYPE_IOS] = this.getBuildInfoIOS;
  this.buildInfoMethods[otaconsts.TYPE_AND] = this.getBuildInfoAND;
  this.buildInfoMethods[otaconsts.TYPE_WIN] = this.getBuildInfoWIN;

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

    var cacheKey = otaconsts.CK_GET_BUILD_DATA + '_' + projectBuild.buildFile;
    var data = cache.get(cacheKey);
    if (data !== null) {
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
    cache.set(cacheKey, cacheObj, otaconsts.M_CACHE);
    return {
        cacheHit : false,
        ts       : cacheObj.ts,
        data     : cacheObj.data
    };
  };  
}
module.exports = new otafs();