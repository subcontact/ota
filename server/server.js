"use strict";
var koa       = require('koa');
var router    = require('koa-router');
var send      = require('koa-send');
var path      = require('path');
var lodash    = require('lodash');
var parseArgs = require('minimist');
var consts    = require('./lib/consts');
var serve     = require('./lib/koa-static-virtual');

var app = koa();
var argv;

(function() {
  var defaults = { 
    debug   : false,
    nocache : false,
    maxage  : (60 * 60 * 24 * 5), // http cache maxage setting in seconds - 432,000 is 5 days (for static assets - should make this far dated in the future)
//    mcache  : (1000 * 60 * 5), // internal memory cache in millseconds - 300,000 is 5 minutes
    mcache  : (5000), // internal memory cache in millseconds - 1.5 sec
    builds  : ".",
    port    : 8181,
    host    : "http://localhost",
    env     : 'prod'
  };
  defaults.host += ":" + defaults.port;
  argv = parseArgs((process.argv.slice(2)), { default : defaults });
})();

console.log(argv);
consts.HOST_SVR = argv.host;
consts.M_CACHE = argv.mcache;

var service   = require('./lib/service-fs');
service.setBuildFolderRoot(argv.builds);

// ---------------------------------------------------------------------------------------
// logger
if (argv.debug) {
  app.use(function *(next){
    var start = new Date();
    yield next;
    var ms = new Date() - start;
    console.log('%s %s - %s', this.method, this.url, ms + ' ms');
  });
}

if (!argv.nocache) {
  app.use(function *(next) {

      yield next;
      //TODO - add a last modified by adding a timestamp to each service call response
      //this.set('Last-Modified', stats.mtime.toUTCString());
      //this.set('Cache-Control', 'max-age=' + argv.maxage);
  });
}

(function() { // wrap this up in it's own scope so we can throw away the config variable
  var config = argv.nocache ? null : { maxage : argv.maxage};
  //console.log(config);
  //app.use(serve('.', config));
  //app.use(serve('../..', config));
  //app.use(serve(service.getBuildFolderRoot(), config));

  switch (argv.env) {
    case consts.ENV_DEV :
      app.use(serve('web-dev','../client-web/source', config));
      app.use(serve('qooxdoo','../../qooxdoo', config));
    break;
    case consts.ENV_PROD :
    //default :
    //  app.use(serve('client','../client-web/build', config));
    break;
  }


})();

app.use(router(app));  

var getProjectsRoute = function *(next) {

  var projectList;
  projectList = yield service.getProjectsServiceCached();
  this.set('x-Cache-Hit', projectList.cacheHit);
  this.set('x-Cache-Time', projectList.ts);
  this.body = projectList.data;
};


var getProjectBuildsRoute = function *(next) {
  
  var projectId, project, projectList, buildList;

  projectId     = this.params.projectId;
  if (projectId && typeof projectId === 'string') {
    projectList = yield service.getProjectsServiceCached();
    project     = lodash.find(projectList.data, {_id : projectId});
    buildList   = yield service.getProjectBuildListServiceCached(project.path);
    this.set('x-Cache-Hit', buildList.cacheHit);
    this.set('x-Cache-Time', buildList.ts);
    this.body = buildList.data;
  } else {
    console.log('getProjectBuildsRoute params error');
    this.body = null;  }
};

var getProjectBuildDataRoute = function *(next) {

  var projectId, project, build, buildList, buildData, buildId, projectList;

  projectId     = this.params.projectId;
  buildId       = this.params.buildId;
  if ((projectId  && typeof projectId === 'string') &&
      (buildId    && typeof buildId   === 'string')
    ) {
    try {
      projectList = yield service.getProjectsServiceCached();
      project     = lodash.find(projectList.data, {_id : projectId});
      buildList   = yield service.getProjectBuildListServiceCached(project.path);
      build       = lodash.find(buildList.data, {_id : buildId});
      buildData   = yield service.getProjectBuildDataServiceCached(build);

      this.set('x-Cache-Hit',  buildData.cacheHit);
      this.set('x-Cache-Time', buildData.ts);
      this.body = buildData.data;
    } catch(e) {
      console.log('getProjectBuildDataRoute', e);
      console.log(buildData);
      this.body = null;
    }
  } else {
    console.log('getProjectBuildDataRoute params error');
    this.body = null;
  }
};

// iOS only (so far)
var getProjectBuildInstallerRoute = function *(next) {

  var projectId, project, build, buildList, buildData, buildId, projectList;

  projectId     = this.params.projectId;
  buildId       = this.params.buildId;
  if ((projectId  && typeof projectId === 'string') &&
      (buildId    && typeof buildId   === 'string')
    ) {
    try {
      projectList = yield service.getProjectsServiceCached();
      project     = lodash.find(projectList.data, {_id : projectId});
      buildList   = yield service.getProjectBuildListServiceCached(project.path);
      build       = lodash.find(buildList.data, {_id : buildId});
      buildData   = yield service.getProjectBuildDataServiceCached(build);

      this.set('x-Cache-Hit',  buildData.cacheHit);
      this.set('x-Cache-Time', buildData.ts);
      this.set('Content-Type', 'application/xml');
      this.body = buildData.data.installerSource;

    } catch(e) {
      console.log('getProjectBuildInstallerRoute', e);
      console.log(buildData);
      this.body = null;
    }
  } else {
    console.log('getProjectBuildInstallerRoute params error');    
    this.body = null;
  }
};

var getProjectBuildFileRoute = function *(next) {

  var projectId, project, build, buildList, buildData, buildId, projectList;

  projectId     = this.params.projectId;
  buildId       = this.params.buildId;
  if ((projectId  && typeof projectId === 'string') &&
      (buildId    && typeof buildId   === 'string')
    ) {
    try {
      projectList = yield service.getProjectsServiceCached();
      project     = lodash.find(projectList.data, {_id : projectId});
      buildList   = yield service.getProjectBuildListServiceCached(project.path);
      build       = lodash.find(buildList.data, {_id : buildId});

      //this.set('x-Cache-Hit',  buildData.cacheHit);
      //this.set('x-Cache-Time', buildData.ts);
      var config = { 
        root : service.getBuildFolderRoot(),
        maxage : argv.nocache ? 0 : argv.maxage
      };
      yield send(this, build.buildFile, config);

    } catch(e) {
      console.log('getProjectBuildFileRoute', e);
      console.log(buildData);
      this.body = null;
    }
  } else {
    console.log('getProjectBuildFileRoute params error');       
    this.body = null;
  }
};

var getProjectBuildDownloadRoute = function *(next) {

  var projectId, project, build, buildList, buildData, buildId, projectList;

  projectId     = this.params.projectId;
  buildId       = this.params.buildId;
  if ((projectId  && typeof projectId === 'string') &&
      (buildId    && typeof buildId   === 'string')
    ) {
    try {
      projectList = yield service.getProjectsServiceCached();
      project     = lodash.find(projectList.data, {_id : projectId});
      buildList   = yield service.getProjectBuildListServiceCached(project.path);
      build       = lodash.find(buildList.data, {_id : buildId});

      //this.set('x-Cache-Hit',  buildData.cacheHit);
      //this.set('x-Cache-Time', buildData.ts);
      this.response.attachment([path.basename(build.buildFile)]);
      var config = { 
        root : service.getBuildFolderRoot(),
        maxage : !argv.nocache ? 0 : argv.maxage
      };
      console.log(argv.nocache);
      console.log(argv.maxage);
      console.log(config);
      yield send(this, build.buildFile, config);

    } catch(e) {
      console.log('getProjectBuildDownloadRoute', e);
      console.log(buildData);
      this.body = null;
    }
  } else {
    console.log('getProjectBuildDownloadRoute params error');       
    this.body = null;
  }
};

app.get('/',          getProjectsRoute);
app.get('/projects',  getProjectsRoute);

app.get('/types', function *(next) {
  this.body = consts.TYPE_LABELS;
});

app.get('/projects/:projectId/builds',  getProjectBuildsRoute);
app.get('/projects/:projectId',         getProjectBuildsRoute);

app.get('/projects/:projectId/builds/:buildId', getProjectBuildDataRoute);
app.get('/projects/:projectId/builds/:buildId/installer', getProjectBuildInstallerRoute);

app.register('/projects/:projectId/builds/:buildId/file', ['get', 'head'], getProjectBuildFileRoute);
app.register('/projects/:projectId/builds/:buildId/file/:name', ['get', 'head'], getProjectBuildFileRoute);
app.register('/projects/:projectId/builds/:buildId/download', ['get', 'head'], getProjectBuildDownloadRoute);

app.listen(argv.port);