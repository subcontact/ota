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
var bplist  = require('bplist-parser');
var ota     = require('./ota-fs');
var otaconsts = require('./ota-consts');

var app = koa();
ota.setBuildFolderRoot(process.argv.length > 2 ? process.argv[2] : ".");

// logger
app.use(function *(next){
  var start = new Date();
  yield next;
  var ms = new Date() - start;
  console.log('%s %s - %s', this.method, this.url, ms + ' ms');
});

app.use(function *(next){
    //TODO - add a last modified by adding a timestamp to each service call response
    //this.set('Last-Modified', stats.mtime.toUTCString());
    yield next;
    // not while we're debugging
    //this.set('Cache-Control', 'max-age=' + (60 * 60 * 24 * 5));
});

app.use(serve('.', {maxage: 1000 * 60 * 60 * 24 * 5}));
app.use(serve('../..', {maxage: 1000 * 60 * 60 * 24 * 5}));
app.use(serve(ota.getBuildFolderRoot(), {maxage: 1000  * 60 * 60 * 24 * 5}));

app.use(router(app));  

var getProjectsRoute = function *(next) {
  var data = yield ota.getProjectsService();
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

app.listen(8080);