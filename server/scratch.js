
var meta_template = {
  buildProjects : [
    {
      name : null,
      type : null,
      list : [
        {
          name : null,
          file : null,
          type : null
        }
      ]
    }
  ]
};



/*
function findAppType(dirPath, _) {

  var files = getFiles(dirPath, null, _);
  var i,a,w, error, found = false;
  var data = null;

  for (var k=0; k<files.length; k++) {
    if (iOS_FILE.test(files[k])) {
      data = {
        type : TYPE_IOS,
        name : path.basename(files[k]).replace(iOS_FILE, ""),
        path : files[k]
      };
      break;
    }
    else if (AND_FILE.test(files[k])) {
      data = {
        type : TYPE_AND,
        name : path.basename(files[k]).replace(AND_FILE, ""),
        path : files[k]
      };
      break;
    }
    else if (WIN_FILE.test(files[k])) {
      data = {
        type : TYPE_WIN,
        name : path.basename(files[k]).replace(WIN_FILE, ""),
        path : files[k]
      };
      break;
    }
  }
  return data;
}
*/


/*
  var buildProjects   = getBuildProjects(p, _);
  meta.buildProjects  = buildProjects.map(function(data) {
    return {
      name  : path.basename(data),
      _id   : data,
      path  : data,

    };
  });
  meta.timeStamp = Date.now();

  var list, files, dirPath, fullFile, buildInfo;
  for (var i=0; i<meta.buildProjects.length; i++) {
    list = getBuildProjectList(meta.buildProjects[i].path, _);
    if (list.length > 0) {
      meta.buildProjects[i].list = [];
      meta.buildProjects[i].list[0] = {
        name : path.basename(list[0]),
        path : list[0]
      }
    }
    for (var j=0; j<meta.buildProjects[i].list.length; j++) {
      dirPath = meta.buildProjects[i].list[j].path;
      buildInfo = findBuildFile(dirPath, _);
      if (buildInfo) {
        meta.buildProjects[i].list[j].buildInfo = buildInfo;
        meta.buildProjects[i].type = buildInfo.type; // pretty ugly but will do for now
      }
    }
*/
    /*
    meta.buildProjects[i].list = list.map(function(data) {
      return {
        name : path.basename(data),
        path : data
      };
    });
    */    
  /*
  }
  */

//console.log(JSON.stringify(meta));

  //console.log(getBuildProjectList(buildProjects[0], _));
  //console.log(buildProjects);
  //console.log("length : " + buildProjects.length);
