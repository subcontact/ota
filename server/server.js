"use strict";
var q       = require('q');
var koa     = require('koa');
var router  = require('koa-router');
var serve   = require('koa-static');
var send    = require('koa-send');
var co      = require('co');
var fs      = require('co-fs');
var path    = require('path');
var lodash  = require('lodash');
var util    = require('util');
var find    = require('findit');
var parseArgs = require('minimist');
var winston = require('winston');
var bplist  = require('bplist-parser');
var ota     = require('./ota-fs');
var otaconsts = require('./ota-consts');
var cachify = require('transparentcache');
var cache = require('./mem-cache');

var app = koa();
var argv;

(function() {
  var defaults = { 
    debug   : false,
    nocache : false,
    maxage  : (60 * 60 * 24 * 5), // http cache maxage setting in seconds - 432,000 is 5 days (for static assets - should make this far dated in the future)
    mcache  : (1000 * 60 * 5), // internal memory cache in millseconds - 300,000 is 5 minutes
    builds  : ".",
    port    : 8181,
    host    : "http://localhost"
  };
  defaults.host += ":" + defaults.port;
  argv = parseArgs((process.argv.slice(2)), { default : defaults });
})();

console.log(argv);
ota.setBuildFolderRoot(argv.builds);
otaconsts.HOST_SVR = argv.host;

// logger
app.use(function *(next){
  var start = new Date();
  yield next;
  var ms = new Date() - start;
  console.log('%s %s - %s', this.method, this.url, ms + ' ms');
});

if (!argv.nocache) {
  app.use(function *(next) {
      //TODO - add a last modified by adding a timestamp to each service call response
      //this.set('Last-Modified', stats.mtime.toUTCString());
      yield next;
      //this.set('Cache-Control', 'max-age=' + argv.maxage);
  });
}

(function() { // wrap this up in it's own scope so we can throw away the config variable
  var config = argv.nocache ? null : { maxage : argv.maxage};
  console.log(config);
  app.use(serve('.', config));
  app.use(serve('../..', config));
  app.use(serve(ota.getBuildFolderRoot(), config));
})();

app.use(router(app));  

var getProjectsRoute = function *(next) {
  var data = cache.get(otaconsts.GET_PROJECTS);
  if (data === null) {
    data = yield ota.getProjectsService();
    cache.put(otaconsts.GET_PROJECTS, data, argv.mcache);
    this.set('X-Cache-Hit', false);
  } else {
    this.set('X-Cache-Hit', true);
  }
  this.body = data;
};


var getProjectBuildsRoute = function *(next) {
  var projectList   = yield ota.getProjectsService();
  var projectId     = this.params.projectId;
  var project       = lodash.find(projectList, {_id : this.params.projectId});
  var projectBuilds = yield ota.getProjectBuildListService(project);
  this.body = projectBuilds;
};

var getProjectBuildDataRoute = function *(next) {
  var projectList   = yield ota.getProjectsService();
  var project       = lodash.find(projectList, {_id : this.params.projectId});
  var projectBuilds = yield ota.getProjectBuildListService(project);
  var build         = lodash.find(projectBuilds, {_id : this.params.buildId});  
  var buildData     = yield ota.getProjectBuildDataService(build);
  this.body = buildData;
};

var getProjectBuildInstallerRoute = function *(next) {
  var projectList   = yield ota.getProjectsService();
  var project       = lodash.find(projectList, {_id : this.params.projectId});
  var projectBuilds = yield ota.getProjectBuildListService(project);
  var build         = lodash.find(projectBuilds, {_id : this.params.buildId}); 
  var buildData     = yield ota.getProjectBuildDataService(build);
  var installer     = buildData.installerSource;
  this.body = installer;
  this.set('Content-Type', 'application/xml');
};

var getProjectBuildFileRoute = function *(next) {
  var projectList   = yield ota.getProjectsService();
  var project       = lodash.find(projectList, {_id : this.params.projectId});
  var projectBuilds = yield ota.getProjectBuildListService(project);
  var build         = lodash.find(projectBuilds, {_id : this.params.buildId});  
  var buildData     = yield ota.getProjectBuildDataService(build);
  var installer     = buildData.installerSource;
  yield send(this, build.buildFile, {root : ota.getBuildFolderRoot()});
};

var getProjectBuildDownloadRoute = function *(next) {
  var projectList   = yield ota.getProjectsService();
  var project       = lodash.find(projectList, {_id : this.params.projectId});
  var projectBuilds = yield ota.getProjectBuildListService(project);
  var build         = lodash.find(projectBuilds, {_id : this.params.buildId});  
  var buildData     = yield ota.getProjectBuildDataService(build);
  var installer     = buildData.installerSource;
  yield send(this, build.buildFile, {root : ota.getBuildFolderRoot()});
  this.response.attachment([path.basename(build.buildFile)]);
};

app.get('/',          getProjectsRoute);
app.get('/projects',  getProjectsRoute);

app.get('/types', function *(next) {
  this.body = otaconsts.TYPE_LABELS;
});

app.get('/projects/:projectId/builds',  getProjectBuildsRoute);
app.get('/projects/:projectId',         getProjectBuildsRoute);

app.get('/projects/:projectId/builds/:buildId', getProjectBuildDataRoute);
app.get('/projects/:projectId/builds/:buildId/installer', getProjectBuildInstallerRoute);

app.register('/projects/:projectId/builds/:buildId/file', ['get', 'head'], getProjectBuildFileRoute);
app.register('/projects/:projectId/builds/:buildId/download', ['get', 'head'], getProjectBuildDownloadRoute);

app.listen(argv.port);