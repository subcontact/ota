/* ************************************************************************

************************************************************************ */

/**
 * 
 * @ignore(moment)
 * @ignore(Promise)
 * @ignore(Promise.all)
 */
qx.Class.define("client_web.page.Build",
{
  extend : qx.ui.mobile.page.NavigationPage,

  construct : function() {
    this.base(arguments);
    this.set({
      title : "Details",
      showBackButton : true,
      backButtonText : "Back",      
      showButton : true,
      buttonText : "Home" 
    });
    
    this.addListener("start", function() {

      this.debug('build start called');
      //this.debug(this.__buildService.getBuildData().getVersion());
      // this.debug(qx.dev.Debug.debugProperties(this.__buildService.getTypes()));      
      // this.debug(qx.dev.Debug.debugObjectToString(this.__buildService.getTypes()));
      //var project  = this.__buildService.findProjectById(this.__app.getProjectId()).item;
      //var build    = this.__buildService.findBuildById(this.__app.getBuildId()).item;

      var project = this.__app.getProject();
      var build = this.__app.getBuild();

      //console.log('project ', qx.dev.Debug.debugProperties(project));
      //console.log('build ', qx.dev.Debug.debugProperties(build));

      //this.debug(this.__buildService.findBuildById(this.__app.getBuildId()).item.getType());
      var platformType = build.getType();

      //this.setTitle(project.getName());

      switch (platformType) {
        case this.__app.platforms.IOS :
          console.log(" it's IOS!");
          this.__installerButton.setVisibility("visible");
          this.__fileButton.setVisibility("excluded");
          this.__downloadButton.setVisibility("visible");                    
          break;
        case this.__app.platforms.AND :
          console.log(" it's AND!");
          this.__installerButton.setVisibility("excluded");
          this.__fileButton.setVisibility("visible");
          this.__downloadButton.setVisibility("excluded");                    
          break;
        case this.__app.platforms.WIN :
          console.log(" it's WIN!");
          this.__installerButton.setVisibility("excluded");
          this.__fileButton.setVisibility("visible");
          this.__downloadButton.setVisibility("excluded");                    
          break;
        default :
          console.log(" I don't Know!!");
      }

      //this.debug(this.__app.getBuildId());
      //this.debug(this.__buildService.getBuilds());
      //try { 
       // this.debug(qx.dev.Debug.debugProperties(this.__buildService.findBuildById(this.__app.getBuildId()).item));
   // } catch (e) {qx.log.Logger.error(arguments.callee.displayName + ' : ' + e)}
    }, this);

  },

  properties:
  {
  },

  members :
  {

   __form : null,
   __fileSize : null,
   __project : null,
   __timeStamp : null,
   __commitHash : null,
   __build : null,
   __version : null,
   __name : null,
   __installerButton : null,
   __fileButton : null,
   __downloadButton : null,
   __buildService : null,
   __app : null,
   __contentTypes : {
      "application/octet-stream"                : true, // binary stream - used for .ipa
      "application/vnd.android.package-archive" : true, // android .apk
      "application/x-silverlight-app"           : true, // windows .xap
      "application/x-msdownload"                : true  // windows .msi
   },
   ATTACH_TST : /attachment;/i,

    // checking that the url is valid first before throwing it in front of document.location
    // TODO - load this inside an iframe to remove any other risk of error which would unload the app.
    __isFileDownloadable : function(url)
    {
      var req = new qx.io.request.Xhr(url);
      req.setMethod("HEAD");
      return new Promise(function (resolve, reject) {
        req.addListener("success", function(e) {
          var req = e.getTarget();
          if ((this.__contentTypes.hasOwnProperty(req.getResponseContentType())) && 
              (this.ATTACH_TST.test(req.getResponseHeader('Content-Disposition'))))
          {
            resolve(url);
          } else {
            reject(new Error('file is not downloadable or not binary'));
          }
        }, this);
        req.addListener("fail", function(e) {
          reject(new Error('network error'));
        }, this);
        req.send();
      }.bind(this));
    },
    // checking that the url is valid first before throwing it in front of document.location
    // TODO - load this inside an iframe to remove any other risk of error which would unload the app.
    __isFileReachable : function(url)
    {
      var req = new qx.io.request.Xhr(url);
      req.setMethod("HEAD");
      return new Promise(function (resolve, reject) {
        req.addListener("success", function(e) {
          var req = e.getTarget();
          if (this.__contentTypes.hasOwnProperty(req.getResponseContentType()))
          {
            resolve(url);
          } else {
            reject(new Error('file is not binary'));
          }
        }, this);
        req.addListener("fail", function(e) {
          reject(new Error('network error'));
        }, this);
        req.send();
      }.bind(this));
    },

    // overridden
    _initialize : function()
    {
      this.base(arguments);
      this.__app = qx.core.Init.getApplication();
      this.__buildService = this.__app.getBuildService();
      this.__form = this.__createForm();
      this.getContent().add(new qx.ui.mobile.form.renderer.Single(this.__form));

      this.__installerButton = new qx.ui.mobile.form.Button("Install");
      this.__installerButton.addListener("tap", function() {
        var url = "itms-services://?action=download-manifest&url=" + window.location.protocol + "//" + window.location.hostname + ":" + 
          window.location.port + "/projects/" + this.__app.getProjectId() + '/builds/' + this.__app.getBuildId() + '/installer';
        this.debug(url);
        this.__isFileReachable(url).then(function() {
          this.debug('file is reachable');
          document.location = url;
        }.bind(this), function() {
          this.debug('file not reachable');
        }.bind(this));
      }, this);
      this.getContent().add(this.__installerButton);

      this.__downloadButton = new qx.ui.mobile.form.Button("Download");
      this.__downloadButton.addListener("tap", function() {
        var url = "/projects/" + this.__app.getProjectId() + '/builds/' + this.__app.getBuildId() + '/download';
        this.__isFileDownloadable(url).then(function() {
          this.debug('file is downloadable');
          document.location = url;
        }.bind(this), function() {
          this.debug('file not downloadable');
        }.bind(this));
      }, this);
      this.getContent().add(this.__downloadButton);

      this.__fileButton = new qx.ui.mobile.form.Button("File");
      this.__fileButton.addListener("tap", function() {
        var url = "/projects/" + this.__app.getProjectId() + '/builds/' + this.__app.getBuildId() + '/file';
        this.__isFileReachable(url).then(function() {
          this.debug('file is reachable');
          document.location = url;
        }.bind(this), function() {
          this.debug('file not reachable');
        }.bind(this));
      }, this);
      this.getContent().add(this.__fileButton);
    },

    /**
     * Creates the form.
     *
     * @return {qx.ui.mobile.form.Form} the created form.
     */
    __createForm : function()
    {
      var form = new qx.ui.mobile.form.Form();

      this.__project = new qx.ui.mobile.form.TextField();
      this.__project.setReadOnly(true);
      this.__app.getProject().bind("name", this.__project, "value");
      form.add(this.__project, "Project");

      this.__build = new qx.ui.mobile.form.TextField();
      this.__build.setReadOnly(true);
      this.__app.getBuild().bind("instanceName", this.__build, "value");
      form.add(this.__build, "Build");


      this.__name = new qx.ui.mobile.form.TextField();
      this.__name.setReadOnly(true);
      this.__buildService.bind("buildData.displayName", this.__name, "value")
      form.add(this.__name, "Name");

      this.__version = new qx.ui.mobile.form.TextField();
      this.__version.setReadOnly(true);
      this.__buildService.bind("buildData.version", this.__version, "value");
      form.add(this.__version, "Version");

      this.__timeStamp = new qx.ui.mobile.form.TextField();
      this.__timeStamp.setReadOnly(true);
      this.__app.getBuild().bind("labels.timeStamp4", this.__timeStamp, "value");
      form.add(this.__timeStamp, "Date");

      this.__fileSize = new qx.ui.mobile.form.TextField();
      this.__fileSize.setReadOnly(true);
      this.__app.getBuild().bind("labels.size", this.__fileSize, "value");
      form.add(this.__fileSize, "Size");

      this.__commitHash = new qx.ui.mobile.form.TextField();
      this.__commitHash.setReadOnly(true);
      this.__buildService.bind("buildData.commitHash", this.__commitHash, "value");
      form.add(this.__commitHash, "Hash");

      return form;
    },

     // overridden
    _back : function()
    {
      this.__app.getRouting().back();
    }    
  }
});