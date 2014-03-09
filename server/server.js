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

var app = koa();
var argv;

(function() {
  var defaults = { 
    debug   : false,
    nocache : false,
    maxage  : (60 * 60 * 24 * 5),
    builds  : ".",
    port    : 8181,
    host    : "http://localhost"
  };
  defaults.host += ":" + defaults.port;
  argv = parseArgs((process.argv.slice(2)), { default : defaults });
})();


function one (a, b) {
    console.log( 'one actually invoked' );
    return '|' + b + '|' + a + '|' + b + '|';
}

var oneCached = cachify(one, {parameters:[0]});

console.log( oneCached(1, 2) );
console.log( oneCached(1, 3) );
console.log( oneCached(1, 4) );
console.log( oneCached(1, 5) );
console.log( oneCached(2, 2) );
console.log( oneCached(2, 999) );


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
      this.set('Last-Modified', stats.mtime.toUTCString());
      yield next;
      this.set('Cache-Control', 'max-age=' + argv.maxage);
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
  var data = yield ota.getProjectsService();
  this.body = data;
};

var getProjectsRouteCache = cachify(getProjectsRoute);

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
app.get('/projects',  getProjectsRouteCache);

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