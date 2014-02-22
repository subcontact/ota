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

    // overridden
    _initialize : function()
    {
      this.base(arguments);

      this.debug(qx.dev.Debug.debugProperties(this.getBuildData()));

      this.__form = this.__createForm();

      this.getContent().add(new qx.ui.mobile.form.renderer.Single(this.__form));

      this.__installerButton = new qx.ui.mobile.form.Button("Install");
      this.__installerButton.addListener("tap", function() {
        var url = "itms-services://?action=download-manifest&url=" + "http://192.168.0.3:8080/projects/" + this.getProjectId() + '/builds/' + this.getBuildId() + '/installer';
        console.log(url);
        document.location = url;
      }, this);
      this.getContent().add(this.__installerButton);

      this.__downloadButton = new qx.ui.mobile.form.Button("Download");
      this.__downloadButton.addListener("tap", function() {
        var req = new qx.io.request.Xhr("/projects/" + this.getProjectId() + '/builds/' + this.getBuildId() + '/download');

        req.addListener("success", function(e) {
          var req = e.getTarget();

          // Response parsed according to the server's
          // response content type, e.g. JSON
          var type = req.getResponseContentType();
          console.log(type);
        }, this);

        // Send request
        req.send();
      }, this);
      this.getContent().add(this.__downloadButton);


      this.__fileButton = new qx.ui.mobile.form.Button("File");
      this.__fileButton.addListener("tap", function() {
        var req = new qx.io.request.Xhr("/projects/" + this.getProjectId() + '/builds/' + this.getBuildId() + '/file');

        req.addListener("success", function(e) {
          var req = e.getTarget();

          // Response parsed according to the server's
          // response content type, e.g. JSON
          var type = req.getResponseContentType();
          console.log(type);
        }, this);

        // Send request
        req.send();
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