/* ************************************************************************

************************************************************************ */

/**
 * 
 * @ignore(moment)
 * @ignore(Promise)
 * @ignore(Promise.all)
 */
qx.Class.define("ota.page.BuildViewIOS",
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
  },

  properties:
  {
  },

  members :
  {

   __form : null,
   __version : null,
   __name : null,
   __installerButton : null,
   __fileButton : null,
   __downloadButton : null,
   __buildService : null,
   __app : null,

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
          if ((req.getResponseContentType() === "application/octet-stream") && 
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
          if (req.getResponseContentType() === "application/octet-stream") 
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
        document.location = url;
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
      form.addGroupHeader("Info");

      this.__name = new qx.ui.mobile.form.TextField();
      this.__name.setReadOnly(true);
      this.__buildService.bind("buildData.displayName", this.__name, "value")
      form.add(this.__name, "Name");

      this.__version = new qx.ui.mobile.form.TextField();
      this.__name.setReadOnly(true);
      this.__buildService.bind("buildData.version", this.__version, "value");
      form.add(this.__version, "Version");

      return form;
    },

     // overridden
    _back : function()
    {
      this.__app.getRouting().back();
    }    
  }
});