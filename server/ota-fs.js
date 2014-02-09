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
var find      = require('findit');
var bplist    = require('bplist-parser');
var admZip    = require('adm-zip');
var zip       = require('zip');
var util      = require('util');
var mustache  = require('mustache');
var moment    = require('moment');
var otaconsts = require('./ota-consts');
var find2     = require('find');

var zipReadAsTextAsyncThunk = function(object, entry) {
  return function(done){
    // for some reason the params are non standard (swapped) meaning I had to thunk this myself.
    object.readAsTextAsync(entry, function(data, err) {
      done(err, data);
    });
  }
};

var otafs = function() {
  var self = this;
  var buildProjects = null;
  var buildFolderRoot = null;
  var buildFolderRootRE = null;

  this.setBuildFolderRoot = function(value) {
    buildFolderRoot   = value;
    buildFolderRootRE = new RegExp("^" + buildFolderRoot + "(//+)?"); // used to check if a path is already starting at the root for resolveRootPath
  };

  this.getBuildFolderRoot = function() {
    return buildFolderRoot;
  };

  this.resolveRootPath = function(value) {
    return buildFolderRootRE.test(value) ? value : path.normalize(buildFolderRoot + '/' + value);
  };

  this.removeRootPath = function(value) {
    return value.replace(buildFolderRootRE, "");
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

  this.getFolders = function *(dirPath, filters) {
    var stat, nameFilter  = null;
    var folders = [];
    var files   = yield fs.readdir(dirPath);
    if (filters && filters.name) {
      nameFilter = filters.name;
    }
    for (var i=0; i< files.length; i++) {
      var fullFile = path.normalize(dirPath + '/' + files[i]);
      stat = yield fs.lstat(fullFile);
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
  };

  this.getFiles = function *(dirPath, filters) {
    var stat, nameFilter  = null;
    var realFiles = [];
    var files   = yield fs.readdir(dirPath);
    if (filters && filters.name) {
      nameFilter = filters.name;
    }
    for (var i=0; i< files.length; i++) {
      var fullFile = path.normalize(dirPath + '/' + files[i]);
      stat = yield fs.lstat(fullFile);
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

/*
  this.filterKnownBuildFolderList = function(folders) {

    var list = [];
    for (i=0; i<folders.length; i++) {
      for (j=0; j<otaconsts.PARSE_BUILD_DIR.length; j++)
      {
        if (otaconsts.PARSE_BUILD_DIR[j].pattern.test(path.basename(folders[i]))) {
          list.push(folders[i]);
          break;
        }
      }
    }
    return list;
  };

  this.normaliseDateList = function(folders) {

    var list = [];
    for (i=0; i<folders.length; i++) {
      for (j=0; j<otaconsts.PARSE_BUILD_DIR.length; j++)
      {
        if (otaconsts.PARSE_BUILD_DIR[j].pattern.test(path.basename(folders[i]))) {
          list.push(moment(path.basename(folders[i]), otaconsts.PARSE_BUILD_DIR[j].format).valueOf());
          break;
        }
      }
    }
    return list;
  };
*/
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
    results['displayName']     = data[otaconsts.IOS_NAME];
    results['version']  = data[otaconsts.IOS_VERSION];
    results[otaconsts.IOS_ID]       = data[otaconsts.IOS_ID];
    results[otaconsts.IOS_TEAM]     = data[otaconsts.IOS_TEAM];
    results[otaconsts.IOS_ICON]     = data[otaconsts.IOS_ICON];
    results['url'] = 'http://192.168.0.3:8080/' + file;
    results['installerUrl'] = path.dirname('/' + file) + '/installer';

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

  this.findBuildFile = function(dirPath) {
    return function (done) {

      var found = false;
      var data = null;
      var buildData = null;
      //console.log(dirPath);
            
      find2.eachfile(/./, dirPath, function(file, stat) {
        if (found) { return; }
        if (otaconsts.iOS_FILE.test(file)) {
          data = {
            type : otaconsts.TYPE_IOS,
            buildName : path.basename(file).replace(otaconsts.iOS_FILE, ""),
            buildFile : self.removeRootPath(file),
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
            buildFile : self.removeRootPath(file),
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
            buildFile : self.removeRootPath(file),
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
            buildFile : self.removeRootPath(file),
            size      : stat.size,
            timeStamp : stat.mtime.getTime(),
            timeStamp2: moment(stat.mtime.getTime()).fromNow() + " (" + moment(stat.mtime.getTime()).toISOString() + ")",
          };
          found = true;
        }
      }).end(function(){
        done(null,data);
      });
    };
  };

  this.getProjectsService = function *() {
    if (buildProjects) {
       return self.clone(buildProjects, ['list']);
    }
   var bp = yield self.getFolders(buildFolderRoot);
   buildProjects = []; // shouldn't be needed

    var list, files, dirPath, fullFile, buildInfo, filePath;
    // loop through and get the builds for each project. 
    // We need one to work out the type of project (EG TYPE);
    for (var i=0; i<bp.length; i++) {
      filePath = self.removeRootPath(bp[i]);
      list = yield self.getBuildProjectList(path.normalize(buildFolderRoot + '/' + filePath));
      console.log(list);
      if (list.length > 0) {
        dirPath = list[0];
        buildInfo = yield self.findBuildFile(dirPath);
        if (buildInfo) {
          buildProjects.push({
            name  : path.basename(filePath),
            _id   : filePath.replace(/[\/\s]/g, '_'),
            path  : filePath,
            type  : buildInfo.type,
            label : otaconsts.TYPE_LABELS[buildInfo.type]
          });
        } else {
          buildProjects.push({
            name  : path.basename(filePath),
            _id   : filePath.replace(/[\/\s]/g, '_'),
            path  : filePath,
            type  : otaconsts.TYPE_UNKNOWN,
            label : otaconsts.TYPE_LABELS[otaconsts.TYPE_UNKNOWN]
          });
        }
      }
    }
    return self.clone(buildProjects, ['list']);    
  };

  this.getProjectBuildListService = function *(project) {
    if (project.list) {
       return self.clone(project.list, ['list']);
    }
    var list, files, dirPath, fullFile, buildMeta, buildData, data;
    list = yield self.getBuildProjectList(path.normalize(buildFolderRoot + '/' + project.path));
    project.list = [];
    for (var i=0; i<list.length; i++) {
      data = self.removeRootPath(list[i]);
      project.list[i] = {
        instanceName  : path.basename(data),
        instanceLabel : self.normaliseDate(path.basename(data)),
        instanceLabel2: moment(self.normaliseDate(path.basename(data))).fromNow() + " (" + moment(self.normaliseDate(path.basename(data))).toISOString() + ")",
        _id           : data.replace(/[\/\s]/g, '_'),
        instancePath  : data,
      };

      buildMeta = yield self.findBuildFile(self.resolveRootPath(list[i]));
   //   console.log(buildMeta);
      if (buildMeta) {
        lodash.extend(project.list[i], buildMeta);
      }
    }
    return self.clone(project.list, ['list']);  
  };

  this.getProjectBuildDataService = function(projectBuild) {

    if (projectBuild.buildData) {
       return projectBuild.buildData;
    }
    var buildData;
    if (projectBuild.type === otaconsts.TYPE_IOS) {
      buildData = self.getBuildInfoIOS(self.resolveRootPath(projectBuild.buildFile));
    }
    else if (projectBuild.type === otaconsts.TYPE_AND) {
      buildData = self.getBuildInfoAND(self.resolveRootPath(projectBuild.buildFile));
    }    
    else if (projectBuild.type === otaconsts.TYPE_WIN) {
      buildData = self.getBuildInfoWIN(self.resolveRootPath(projectBuild.buildFile));
    }
    if (buildData) {
      projectBuild.buildData = buildData;
    }
    return projectBuild.buildData;
  };
}
module.exports = new otafs();