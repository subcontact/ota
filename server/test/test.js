var assert    = require("assert");
var util      = require("util");
var os        = require("os");
var co        = require('co');
var fs        = require('co-fs');
var q         = require('q');
var path      = require('path');
var parseArgs = require('minimist');
var ota       = require('../ota-fs.js');
var otaconsts = require('../ota-consts');
var tree      = require('../tree');
var unglob    = require('unglob');

var argv;

(function() {
  var defaults = { 
    debug   : false,
    nocache : false,
    maxage  : (60 * 60 * 24 * 5), // http cache maxage setting in seconds - 432,000 is 5 days (for static assets - should make this far dated in the future)
//    mcache  : (1000 * 60 * 5), // internal memory cache in millseconds - 300,000 is 5 minutes
    mcache  : (1500), // internal memory cache in millseconds - 1.5 sec
    builds  : ".",
    port    : 8181,
    host    : "http://localhost",
  };
  defaults.host += ":" + defaults.port;
  argv = parseArgs((process.argv.slice(2)), { default : defaults });
})();


var f = '/Users/tyronne/code/jobs/';
ota.setBuildFolderRoot(f);
otaconsts.HOST_SVR = argv.host;
otaconsts.M_CACHE = argv.mcache;

var baseDir = "." ;// os.tmpdir() +  "xxxxFSTestsX";
var folderWithFolders = baseDir + "/folderWithFolders";
var emptyFolder = baseDir + "/emptyFolder";
var nonFolder = baseDir + "/ZXBC987QQQHSGD34567FFF3452F";

function sleep(ms) {
  return function (cb) {
    setTimeout(cb, ms);
  };
}

describe('Basic Config', function () {

  it('getBuildFolderRoot', function* () {
    var bf = ota.getBuildFolderRoot();
    assert.strictEqual(bf, f, 'not equal');
  });

  it('resolveRootPath', function* () {
    
    var bf = ota.getBuildFolderRoot();
    var relPath = "one/two/three";
    assert.strictEqual(ota.resolveRootPath(relPath), path.normalize(bf + "/" + relPath), 'not equal 1');
    assert.strictEqual(ota.resolveRootPath(bf + "/" + relPath), path.normalize(bf + "/" + relPath), 'not equal 2');
    assert.strictEqual(ota.resolveRootPath(bf + "//" + relPath), path.normalize(bf + "/" + relPath), 'not equal 3');
  });

  it('removeRootPath', function* () {
    
    var bf = ota.getBuildFolderRoot();
    var relPath = "one/two/three";
    assert.strictEqual(ota.removeRootPath(relPath), relPath, 'not equal 1');
    assert.strictEqual(ota.removeRootPath(bf + "/" + relPath), relPath, 'not equal 2');
    assert.strictEqual(ota.removeRootPath(bf + "//" + relPath), relPath, 'not equal 3');
    relPath = "/one/two/three";
    var removeSlash = new RegExp("^/");
    var actualPath = relPath.replace(removeSlash,"");
    assert.strictEqual(ota.removeRootPath(relPath), actualPath, 'not equal 4');
    assert.strictEqual(ota.removeRootPath(bf + "/" + relPath), actualPath, 'not equal 5');
    assert.strictEqual(ota.removeRootPath(bf + "//" + relPath), actualPath, 'not equal 6');
  });
});

describe('Basic FS', function () {

  it('should find folders', function* () {
    var folders = yield ota.getFolders(folderWithFolders);
    assert.strictEqual(util.isArray(folders), true, 'not an array');
    assert(folders.length > 0, 'no items found');
  });

  it('should find folders 2', function* () {
    
    assert(yield fs.exists(f), 'path should exist');
    var folders = yield ota.getFolders(f);
    assert.strictEqual(util.isArray(folders), true, 'not an array');
    assert(folders.length > 0, 'no items found');
  });

  it('should find no folders', function* () {
    var folders = yield ota.getFolders(emptyFolder);
    assert.strictEqual(util.isArray(folders), true, 'not an array');
    assert(folders.length === 0, 'items found');
  });

  it('should work with an invalid folder', function* () {
    var folders = yield ota.getFolders(nonFolder);
    assert.strictEqual(util.isArray(folders), true, 'not an array');
    assert(folders.length === 0, 'items found');
  });
});

describe('Top Level Services - getProjectService', function () {

  it('getProjectsService valid folder', function* () {
    var projectList   = yield ota.getProjectsService();
    //console.log(projectList);
    assert.strictEqual(util.isArray(projectList), true, 'not an array');
    assert(projectList.length > 0, 'no items found');
    assert.strictEqual(projectList[0].name,'Android_WBC_OTP1.0x_PROD_PROD', 'wrong first entry')
  });

  it('getProjectsServiceCached valid folder', function* () {
    var data   = yield ota.getProjectsServiceCached();
    assert.strictEqual(util.isObject(data), true, 'not an object');
    assert.strictEqual(data.cacheHit, false, 'cant be in cache yet');
    assert.strictEqual(util.isObject(data.data), true, 'not an object');
    //console.log(data);
    //assert.strictEqual(util.isArray(projectList), true, 'not an array');
    //assert(projectList.length > 0, 'no items found');
    //assert.strictEqual(projectList[0].name,'Android_WBC_OTP1.0x_PROD_PROD', 'wrong first entry')
  });

  it('getProjectsServiceCached valid folder repeat', function* () {
    var data   = yield ota.getProjectsServiceCached();
    assert.strictEqual(util.isObject(data), true, 'not an object');
    assert.strictEqual(data.cacheHit, true, 'must be in cache now');
    assert.strictEqual(util.isObject(data.data), true, 'not an object');
    //assert.strictEqual(util.isArray(projectList), true, 'not an array');
    //assert(projectList.length > 0, 'no items found');
    //assert.strictEqual(projectList[0].name,'Android_WBC_OTP1.0x_PROD_PROD', 'wrong first entry')
  });

  it('getProjectsServiceCached valid folder repeat time expiry', function* () {

      yield sleep(1800);
      var data   = yield ota.getProjectsServiceCached();
      assert.strictEqual(util.isObject(data), true, 'not an object');
      assert.strictEqual(data.cacheHit, false, 'cant be in cache yet');
      assert.strictEqual(util.isObject(data.data), true, 'not an object');
  });

  it('getProjectsService invalid folder', function* () {
    ota.setBuildFolderRoot(nonFolder);
    var projectList   = yield ota.getProjectsService();
    //console.log(projectList);
    assert.strictEqual(util.isArray(projectList), true, 'not an array');
    assert.strictEqual(projectList.length, 0, 'items found');
  });
});

describe('Top Level Services - getProjectBuildListService', function () {

  it('getProjectBuildListService valid folder', function* () {
    ota.setBuildFolderRoot(f);
    var project = "/Users/tyronne/code/jobs/Android_WBC_OTP1.0x_PROD_PROD";
    var buildList = yield ota.getProjectBuildListService(project);
    assert.strictEqual(util.isArray(buildList), true, 'not an array');
    assert(buildList.length > 0, 'no items found');
    assert.strictEqual(buildList[0].buildFile,'Android_WBC_OTP1.0x_PROD_PROD/builds/2013-11-19_12-38-49/archive/Android_WBC_OTP1.0x_PROD_PROD_2013_11_19_12_40.apk', 'wrong first entry');
  });

  it('getProjectBuildListServiceCached valid folder', function* () {

    var project = "/Users/tyronne/code/jobs/Android_WBC_OTP1.0x_PROD_PROD";
    var buildList = yield ota.getProjectBuildListServiceCached(project);
    
    assert.strictEqual(util.isObject(buildList), true, 'not an object');
    assert.strictEqual(buildList.cacheHit, false, 'cant be in cache yet');
    assert.strictEqual(util.isObject(buildList.data), true, 'not an object');
    assert.strictEqual(buildList.data[0].buildFile,'Android_WBC_OTP1.0x_PROD_PROD/builds/2013-11-19_12-38-49/archive/Android_WBC_OTP1.0x_PROD_PROD_2013_11_19_12_40.apk', 'wrong first entry')
  });

  it('getProjectBuildListServiceCached valid folder repeat', function* () {

    var project = "/Users/tyronne/code/jobs/Android_WBC_OTP1.0x_PROD_PROD";
    var buildList = yield ota.getProjectBuildListServiceCached(project);
    
    assert.strictEqual(util.isObject(buildList), true, 'not an object');
    assert.strictEqual(buildList.cacheHit, true, 'must be in cache now');
    assert.strictEqual(util.isObject(buildList.data), true, 'not an object');
    assert.strictEqual(buildList.data[0].buildFile,'Android_WBC_OTP1.0x_PROD_PROD/builds/2013-11-19_12-38-49/archive/Android_WBC_OTP1.0x_PROD_PROD_2013_11_19_12_40.apk', 'wrong first entry')
  });

  it('getProjectBuildListServiceCached valid folder repeat time expiry', function* () {

    yield sleep(1800);
    var project = "/Users/tyronne/code/jobs/Android_WBC_OTP1.0x_PROD_PROD";
    var buildList = yield ota.getProjectBuildListServiceCached(project);
    
    assert.strictEqual(util.isObject(buildList), true, 'not an object');
    assert.strictEqual(buildList.cacheHit, false, 'cant be in cache yet');
    assert.strictEqual(util.isObject(buildList.data), true, 'not an object');
    assert.strictEqual(buildList.data[0].buildFile,'Android_WBC_OTP1.0x_PROD_PROD/builds/2013-11-19_12-38-49/archive/Android_WBC_OTP1.0x_PROD_PROD_2013_11_19_12_40.apk', 'wrong first entry')
  });

  it('getProjectBuildListService invalid folder', function* () {

    ota.setBuildFolderRoot(f);
    var project = "/Users/tyronne/code/jobs/Anasfdsadfsdfdroid_WBC_OTP1asdfasf.0x_PRODasfdasdf_PROD";
    var buildList = yield ota.getProjectBuildListService(project);
    assert.strictEqual(util.isArray(buildList), true, 'not an array');
    assert.strictEqual(buildList.length, 0, 'items found');
  });
});

describe('2nd Level Functions', function() {

  it('getBuildProjectList valid folder', function* () {
    // TODO get setup/teardown working
    ota.setBuildFolderRoot(f);
    var location  = "/Users/tyronne/code/jobs/ios7 Westpac iPhone V5.1 OTP1.1 Test Enterprise Release";
    filePath      = ota.resolveRootPath(location);
    assert.strictEqual(location, filePath);  // probably should be in the basic config tests
    var list      = yield ota.getBuildProjectList(filePath);
    assert.strictEqual(util.isArray(list), true, 'not an array');
    assert.strictEqual(list.length, 15, 'list length not correct');
    assert.strictEqual(list[1], "/Users/tyronne/code/jobs/ios7 Westpac iPhone V5.1 OTP1.1 Test Enterprise Release/builds/2014-02-05_09-39-13", "failed string match on 2nd element");
  });

  it('getBuildProjectList invalid folder', function* () {
    // TODO get setup/teardown working
    ota.setBuildFolderRoot(f);
    var location  = "/Users/tyronne/code/jobs/iossssssssssssease";
    filePath      = ota.resolveRootPath(location);
    assert.strictEqual(location, filePath);  // probably should be in the basic config tests
    var list      = yield ota.getBuildProjectList(filePath);
    assert.strictEqual(util.isArray(list), true, 'not an array');
    assert.strictEqual(list.length, 0, 'items found');
  });

  it('findBuildFile Windows', function* () {
    // TODO get setup/teardown working
    ota.setBuildFolderRoot(f);
    var location  = "/Users/tyronne/code/jobs/Westpac Windows Phone OTP/builds/2014-02-03_09-36-45";
    filePath      = ota.resolveRootPath(location);
    assert.strictEqual(location, filePath);  // probably should be in the basic config tests
    var data = yield ota.findBuildFile(filePath);
    //console.log(data);
    assert.strictEqual(util.isObject(data), true, 'not an array');
    assert.strictEqual(data.buildFile, "Westpac Windows Phone OTP/builds/2014-02-03_09-36-45/archive/AppPackages/Westpac.WP7_Release_ARM.xap");
  });

  it('findBuildFile iOS', function* () {
    // TODO get setup/teardown working
    ota.setBuildFolderRoot(f);
    var location  = "/Users/tyronne/code/jobs/ios7 Westpac iPhone V5.1 OTP1.1 Test Enterprise Release/builds/2014-02-05_17-42-33";
    filePath      = ota.resolveRootPath(location);
    assert.strictEqual(location, filePath);  // probably should be in the basic config tests
    var data = yield ota.findBuildFile(filePath);
    //console.log(data);
    assert.strictEqual(util.isObject(data), true, 'not an array');
    assert.strictEqual(data.buildFile, "ios7 Westpac iPhone V5.1 OTP1.1 Test Enterprise Release/builds/2014-02-05_17-42-33/archive/build/EnterpriseRelease-iphoneos/ConsultWPCTest-EnterpriseRelease-5.1.ipa");
  });

  it('findBuildFile invalid', function* () {
    // TODO get setup/teardown working
    ota.setBuildFolderRoot(f);
    var location  = "/Users/tyronne/code/jobs/WestererTP/builds/2014-0erer-45";
    filePath      = ota.resolveRootPath(location);
    assert.strictEqual(location, filePath);  // probably should be in the basic config tests
    //ry {
      var data = yield ota.findBuildFile(filePath);
      //console.log(data);
    //} catch (e) {console.log('ERROR',e)}
    assert.strictEqual(data, null, 'must be null');
    //assert.strictEqual(data.buildFile, "Westpac Windows Phone OTP/builds/2014-02-03_09-36-45/archive/AppPackages/Westpac.WP7_Release_ARM.xap");
  });
/*
  it('tree test', function* () {
    // TODO get setup/teardown working
    ota.setBuildFolderRoot(f);
    var location  = "/Users/tyronne/code/jobs/Westpac Windows Phone OTP/builds/2014-02-03_09-36-45";
    var data = yield ota.findBuildFile(filePath);
    console.log(data);
  });
*/
});