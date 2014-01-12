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
var ota     = require('./ota-fs');
var otacontsts = require('./ota-consts');

var app = koa();
ota.setBuildFolderRoot(process.argv.length > 2 ? process.argv[2] : ".");

// logger
app.use(function *(next){
  var start = new Date;
  yield next;
  var ms = new Date - start;
  console.log('%s %s - %s', this.method, this.url, ms);
});

app.use(router(app));  

var getProjectsRoute = function *(next) {
  var data = yield ota.getProjectsService();
  this.body = data;
};

var getProjectBuildsRoute = function *(next) {
  var projectList   = yield ota.getProjectsService();
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

app.get('/',          getProjectsRoute);
app.get('/projects',  getProjectsRoute);

app.get('/types', function *(next) {
  this.body = otaconsts.TYPE_LABELS;
});

app.get('/projects/:projectId/builds',  getProjectBuildsRoute);
app.get('/projects/:projectId',         getProjectBuildsRoute );

app.get('/projects/:projectId/builds/:buildId', getProjectBuildDataRoute);

app.listen(3001);