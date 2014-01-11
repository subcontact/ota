var q       = require('q');
var koa     = require('koa');
var router  = require('koa-router');
var co      = require('co');
var fs      = require('co-fs');
var path    = require('path');
var lodash  = require('lodash');
var util    = require('util');
var find    = require('findit');
var bplist  = require('bplist-parser');
var otaconsts = require('./ota-consts');

var otafs = function() {
  var self = this;
  var buildProjects = null;
  var buildFolderRoot = null;

  this.setBuildFolderRoot = function(path) {
    buildFolderRoot = path;
  };

  this.getBuildFolderRoot = function() {
    return buildFolderRoot;
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
  };

  // retreives a list of build folders for a build profile
  // expects a folder named "build" with a list of folders matching a time format
  this.getBuildProjectList = function *(buildProfilePath) {
      var fullFile = path.normalize(buildProfilePath + '/' + otaconsts.BUILD_DIR);
      if (yield fs.exists(fullFile)) {
        var stat = yield fs.stat(fullFile);
        if (stat.isDirectory()) {
          var buildList = yield self.getFolders(fullFile, { name : otaconsts.BUILD_LIST_PATTERN }); // using direct regex syntax rather than a string 
        }
      }
      return buildList;
  };

  this.getBuildInfoIOS = function(file) {
    return {
      commitHash : "12345A",
      version    : "1.54",
      //icon       : "data:image/png;base64,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"
    };  
  };

  this.getBuildInfoAND = function(file) {
    return {
      commitHash : "12345A",
      version    : "1.54",
      //icon       : "data:image/png;base64,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"
    };  
  };

  this.getBuildInfoWIN = function(file) {
    return {
      commitHash : "12345A",
      version    : "1.54",
      //icon       : "data:image/png;base64,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"
    };  
  };

  this.findBuildFile = function(dirPath) {
    return function(done) {
      var finder = find(dirPath);
      var found = false;
      var data = null;
      var buildData = null;

      finder.on('directory', onDirectory);
      finder.on('file', onFile);
      finder.on('end', onEnd);
      finder.on('stop', onEnd);

      function onDirectory(dir, stat, stop) {
          if (found) { stop(); }
      }

      function onFile(file, stat) {
        if (found) { return; }
        if (otaconsts.iOS_FILE.test(file)) {
          data = {
            type : otaconsts.TYPE_IOS,
            buildName : path.basename(file).replace(otaconsts.iOS_FILE, ""),
            buildFile : file
          };
          found = true;
        }
        else if (otaconsts.AND_FILE.test(file)) {
          data = {
            type : otaconsts.TYPE_AND,
            buildName : path.basename(file).replace(otaconsts.AND_FILE, ""),
            buildFile : file
          };
          found = true;
        }
        else if (otaconsts.WIN_FILE.test(file)) {
          data = {
            type : otaconsts.TYPE_WIN,
            buildName : path.basename(file).replace(otaconsts.WIN_FILE, ""),
            buildFile : file
          };
          found = true;
        }
      }

      function onEnd() {
        cleanup();
        done(null, data);
      }

      function cleanup() {
        finder.removeListener('directory', onDirectory);
        finder.removeListener('file', onFile);
        finder.removeListener('end', onEnd);
        finder.removeListener('stop', onEnd);
      }
    };
  };

  this.getProjectsService = function *() {
    if (buildProjects) {
       return self.clone(buildProjects, ['list']);
    }
    var bp   = yield self.getFolders(buildFolderRoot);
    // get the names at the root level
    buildProjects  = bp.map(function(data) {
      return {
        name  : path.basename(data),
        _id   : data.replace(/\//g, '_'),
        path  : data,
      };
    });
    //timeStamp = Date.now();
    var list, files, dirPath, fullFile, buildInfo;
    // loop through and get the builds for each project. 
    // We need one to work out the type of project (EG TYPE);
    for (var i=0; i<buildProjects.length; i++) {
      list = yield self.getBuildProjectList(buildProjects[i].path);
      if (list.length > 0) {
        dirPath = list[0];
        buildInfo = yield self.findBuildFile(dirPath);
        if (buildInfo) {
          buildProjects[i].type  = buildInfo.type;
          buildProjects[i].label = otaconsts.TYPE_LABELS[buildInfo.type];
          //meta.buildProjects[i].icon  = "TODO//ICON";
        }
      }
    }
    return self.clone(buildProjects, ['list']);    
  };

  this.getProjectBuildListService = function *(project) {
    if (project.list) {
       return self.clone(project.list, ['list']);
    }
    var list, files, dirPath, fullFile, buildMeta, buildData;
    list = yield self.getBuildProjectList(project.path);
    project.list = [];
    for (var i=0; i<list.length; i++) {
      project.list[i] = {
        instanceName  : path.basename(list[i]),
        _id   : list[i].replace(/\//g, '_'),
        instancePath  : list[i],
      };
      buildMeta = yield self.findBuildFile(list[i]);
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
      buildData = self.getBuildInfoIOS(projectBuild.buildFile);
    }
    else if (projectBuild.type === otaconsts.TYPE_AND) {
      buildData = self.getBuildInfoAND(projectBuild.buildFile);
    }    
    else if (projectBuild.type === otaconsts.TYPE_WIN) {
      buildData = self.getBuildInfoWIN(projectBuild.buildFile);
    }
    if (buildData) {
      projectBuild.buildData = buildData;
    }
    return projectBuild.buildData;
  };
}

module.exports = new otafs();

