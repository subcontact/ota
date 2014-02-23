/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2011 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Tino Butz (tbtz)

************************************************************************ */

/**
 * This page displays a single tweet.
 */
qx.Class.define("ota.page.BuildDetail",
{
  extend : qx.ui.mobile.page.NavigationPage,

  construct : function() {
    this.base(arguments);
    this.set({
      title : "Details",
      showBackButton : true,
      backButtonText : "Back"
    });
  },


  properties:
  {
    /** Holds the current shown tweet */
    buildData :
    {
      check : "Object",
      nullable : true,
      init : null,
      event : "changeBuildData",
      apply : "_applyBuildData"
    },

    /** currently selected Project */
    projectId :
    {
      check : "String",
      nullable : true,
      init : null,
      event : "changeProjectId"
    },

    /** currently selected Build for the Project */
    buildId :
    {
      check : "String",
      nullable : true,
      init : null,
      event : "changeBuildId"
    } 
  },

  members :
  {

   __form : null,
   ATTACH_TST : /attachment;/i,

    // checking that the url is valid first before throwing it in front of document.location
    // TODO - load this inside an iframe to remove any other risk of error which would unload the app.
    __isFileDownloadable : function(url)
    {
      var self = this;
      var req = new qx.io.request.Xhr(url);
      req.setMethod("HEAD");
      return new Promise(function (resolve, reject) {
        req.addListener("success", function(e) {
          var req = e.getTarget();
          if ((req.getResponseContentType() === "application/octet-stream") && 
              (self.ATTACH_TST.test(req.getResponseHeader('Content-Disposition'))))
          {
            resolve(url);
          } else {
            reject(new Error('file is not downloadable or not binary'));
          }
        }, self);
        req.addListener("fail", function(e) {
          reject(new Error('network error'));
        }, self);
        req.send();
      });
    },
    // checking that the url is valid first before throwing it in front of document.location
    // TODO - load this inside an iframe to remove any other risk of error which would unload the app.
    __isFileReachable : function(url)
    {
      var self = this;
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
        }, self);
        req.addListener("fail", function(e) {
          reject(new Error('network error'));
        }, self);
        req.send();
      });
    },

    // overridden
    _initialize : function()
    {
      this.base(arguments);

      //this.debug(qx.dev.Debug.debugProperties(this.getBuildData()));

      this.__form = this.__createForm();

      this.getContent().add(new qx.ui.mobile.form.renderer.Single(this.__form));

      this.__installerButton = new qx.ui.mobile.form.Button("Install");
      this.__installerButton.addListener("tap", function() {
        var url = "itms-services://?action=download-manifest&url=" + "http://192.168.0.3:8080/projects/" + this.getProjectId() + '/builds/' + this.getBuildId() + '/installer';
        this.debug(url);
        document.location = url;
      }, this);
      this.getContent().add(this.__installerButton);

      this.__downloadButton = new qx.ui.mobile.form.Button("Download");
      this.__downloadButton.addListener("tap", function() {
        var url = "/projects/" + this.getProjectId() + '/builds/' + this.getBuildId() + '/download';
        var self = this;
        this.__isFileDownloadable(url).then(function() {
          self.debug('file is downloadable');
          document.location = url;
        }, function() {
          self.debug('file not downloadable');
        });
      }, this);
      this.getContent().add(this.__downloadButton);


      this.__fileButton = new qx.ui.mobile.form.Button("File");
      this.__fileButton.addListener("tap", function() {
        var url = "/projects/" + this.getProjectId() + '/builds/' + this.getBuildId() + '/file';
        var self = this;
        this.__isFileReachable(url).then(function() {
          self.debug('file is reachable');
          document.location = url;
        }, function() {
          self.debug('file not reachable');
        });
      }, this);
      this.getContent().add(this.__fileButton);


/*      
      // Create a new label instance
      var label = new qx.ui.mobile.basic.Label("test");
      this.bind("buildData.version", label, "value");
      this.getContent().add(label); 

      
      label = new qx.ui.mobile.basic.Label();
      this.getContent().add(label);
      this.bind("buildData.commitHash", label, "value");

      label = new qx.ui.mobile.basic.Label();
      this.getContent().add(label);
      this.bind("buildData.displayName", label, "value");
 */     
/*
      label = new qx.ui.mobile.basic.Label();
      this.getContent().add(label);
      this.bind("BuildDetail.CFBundleVersion", label, "value");

      label = new qx.ui.mobile.basic.Label();
      this.getContent().add(label);
      this.bind("BuildDetail.CFBundleIdentifier", label, "value");

      label = new qx.ui.mobile.basic.Label();
      this.getContent().add(label);
      this.bind("BuildDetail.CFBundleIconFile", label, "value");

      label = new qx.ui.mobile.basic.Label();
      this.getContent().add(label);
      this.bind("BuildDetail.url", label, "value");

      label = new qx.ui.mobile.basic.Label();
      this.getContent().add(label);
      this.bind("BuildDetail.installerSource", label, "value");
*/
/*
      var button = new qx.ui.mobile.form.Button("Download IPA Direct");
      this.getContent().add(button);

      button.addListener("tap", function() {
        document.location = this.getBuildData().getUrl();
      }, this);

      button = new qx.ui.mobile.form.Button("Download IPA Installer");
      this.getContent().add(button);

      button.addListener("tap", function() {
        var url = "itms-services://?action=download-manifest&url=" + "http://192.168.0.3:8080/projects/" + this.getProjectId() + '/builds/' + this.getBuildId() + '/installer';
        console.log(url);
        document.location = url;
      }, this);
*/
    },

    /**
     * Creates the form for this showcase.
     *
     * @return {qx.ui.mobile.form.Form} the created form.
     */
    __createForm : function()
    {
      var form = new qx.ui.mobile.form.Form();
      form.addGroupHeader("Info");

      this.__name = new qx.ui.mobile.form.TextField();
      this.__name.setReadOnly(true);
      this.bind("buildData.displayName", this.__name, "value")
      form.add(this.__name, "Name");

      this.__version = new qx.ui.mobile.form.TextField();
      this.__name.setReadOnly(true);
      this.bind("buildData.version", this.__version, "value");
      form.add(this.__version, "Version");

      return form;
    },


    _applyBuildData : function(value, old) {

      //this.debug("Build Data: " + qx.dev.Debug.debugProperties(value)); // just display the data
     // if (value) {
      //  this.debug(this.getBuildData().getVersion());
      //  this.debug(value.getVersion());
      //}
    }
  }
});