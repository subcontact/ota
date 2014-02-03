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
    buildDetail :
    {
      check : "Object",
      nullable : true,
      init : null,
      event : "changeBuildDetail"
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
    // overridden
    _initialize : function()
    {
      this.base(arguments);
      // Create a new label instance
      var label = new qx.ui.mobile.basic.Label();
      this.getContent().add(label);      
      // bind the "tweet.getText" property to the "value" of the label
      this.bind("BuildDetail.version", label, "value");

      label = new qx.ui.mobile.basic.Label();
      this.getContent().add(label);
      this.bind("BuildDetail.commitHash", label, "value");

      label = new qx.ui.mobile.basic.Label();
      this.getContent().add(label);
      this.bind("BuildDetail.displayName", label, "value");
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


      var button = new qx.ui.mobile.form.Button("Download IPA Direct");
      this.getContent().add(button);

      button.addListener("tap", function() {
        document.location = this.getBuildDetail().getUrl();
      }, this);

      button = new qx.ui.mobile.form.Button("Download IPA Installer");
      this.getContent().add(button);

      button.addListener("tap", function() {
        document.location = this.getBuildDetail().getInstallerUrl();
      }, this);
*/
    }
  }
});