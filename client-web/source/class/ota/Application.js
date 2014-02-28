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

/* ************************************************************************

@

************************************************************************ */

/**
 * This is the main application class of your custom application "ota"
 *
 * @asset(ota/css/styles.css)
 * 
 * @ignore(moment)
 * @ignore(Promise)
 */
qx.Class.define("ota.Application",
{
  extend : qx.application.Mobile,

  statics : {

    BUILD_SERVICE : "BUILD_SERVICE"
  },

  properties :
  {
    /** Holds all projects */
    projects :
    {
      check : "qx.data.Array",
      nullable : true,
      init : null,
      event : "changeProjects",
      apply : "_applyProjects" // just for logging the data
    },

    /** Holds all projects */
    builds :
    {
      check : "qx.data.Array",
      nullable : true,
      init : null,
      event : "changeBuilds",
      apply : "_applyBuilds" // just for logging the data
    },


    /** Holds all projects */
    buildData :
    {
      check : "Object",
      nullable : true,
      init : null,
      event : "changeBuildData",
      apply : "_applyBuildData" // just for logging the data
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
    },

    types : 
    {
      check : "qx.data.Array",
      nullable : true,
      init : null,
      event : "changeTypes",
      apply : "_applyTypes"
    }
  },


  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    __startPage : null,
    __buildService : new ota.service.BuildService(),

    /**
     * This method contains the initial application code and gets called
     * during startup of the application
     */
    main : function()
    {
      // Call super class
      this.base(arguments);

      // Enable logging in debug variant
      if (qx.core.Environment.get("qx.debug"))
      {
        // support native logging capabilities, e.g. Firebug for Firefox
        qx.log.appender.Native;
        // support additional cross-browser console. Press F7 to toggle visibility
        qx.log.appender.Console;
      }

      /*
      -------------------------------------------------------------------------
        Below is your actual application code...
        Remove or edit the following code to create your application.
      -------------------------------------------------------------------------
      */

      window.oManager = new ota.OManager();
      window.oManager.add(ota.Application.BUILD_SERVICE, this.__buildService);   

      //qx.util.AliasManager.getInstance().add('wbg', 'http://www.westpac.com.au');

      // Create a manager in mobile device context >> "false"
      var manager = new qx.ui.mobile.page.Manager(false);

      // Create an instance of the Projects class and establish data bindings
      var projectsPage = this.__startPage = new ota.page.Projects();
      //this.bind("projects", projectsPage, "projects");

      var buildsPage = new ota.page.ProjectBuilds();
      //this.bind("builds", buildsPage, "builds");
      //this.bind("projectId", buildsPage, "projectId");
      //this.bind("buildId", buildsPage, "buildId");

      var buildDetailPage = new ota.page.BuildDetail();
      //this.bind("buildData", buildDetailPage, "buildData");
      //this.bind("projectId", buildDetailPage, "projectId");
      //this.bind("buildId", buildDetailPage, "buildId");

      // Add page to manager
      manager.addDetail(projectsPage);
      manager.addDetail(buildsPage);
      manager.addDetail(buildDetailPage);
      
      Promise.all([
        this.__buildService.loadTypes(),
        this.__buildService.loadProjects()
      ]).then(function () { 
          console.log('all events finished successfully');
          projectsPage.show(); 
        }, function(values) {
          console.log('some or all events failed');
          console.log(values);
        });

      projectsPage.addListener("showProjectBuilds", function(evt) {
        var index = evt.getData();
        /*
        this.debug('showProjectBuilds');
        this.debug(index);
        this.debug(this.getProjects().getItem(index).get_id());
        */
        //this.setProjectId(this.getProjects().getItem(index).get_id());
        //this.__loadProjectBuilds(this.getProjectId()).then(function() {
       //   console.log('showing builds list detail');
       //   buildsPage.show();
       // });
      }, this);

      buildsPage.addListener("showBuild", function(evt) {
        var index = evt.getData();
        /*
        this.debug('showBuild');
        this.debug(index);
        this.debug(this.getProjectId());
        */
        ///this.setBuildId(this.getBuilds().getItem(index).get_id());
        //this.__loadBuild(this.getBuildId()).then(function() {
        //  console.log('showing build detail');
        //  buildDetailPage.show();
        //});
        

        //this.debug(this.getProjects().getItem(index).get_id());

        //this.setProjectId(this.getProjects().getItem(index).get_id());
        ////this.__loadProjectBuilds(this.getProjectId());
        //buildsPage.show();
        //tweetPage.setTweet(this.getTweets().getItem(index));
        //tweetPage.show();//{animation : "cube"});
      }, this);
/*
      // Return to the Input page
      tweetsPage.addListener("back", function(evt) {
        inputPage.show({
          reverse: true
        });
      }, this);
*/
      // Return to the Tweets Page.
      buildsPage.addListener("back", function(evt) {
        projectsPage.show({
          reverse: true
        });
      }, this);
      
      buildDetailPage.addListener("back", function(evt) {
        buildsPage.show({
          reverse: true
        });
      }, this);
    },


    _applyTypes : function(value, old) {

      //this.debug("Types arrived");
    },

    // property apply
    _applyProjects : function(value, old) {
      // print the loaded data in the console
      //this.debug("Projects: ");//, qx.lang.Json.stringify(value)); // just display the data
    },


    // property apply
    _applyBuilds : function(value, old) {
      // print the loaded data in the console
      //this.debug("Builds: ");//, qx.lang.Json.stringify(value)); // just display the data
    },

    // property apply
    _applyBuildData : function(value, old) {
      // print the loaded data in the console
      //this.debug("Build Detail: ");//, qx.lang.Json.stringify(value)); // just display the data
    },

    __loadProjects : function()
    {
      var url = "/projects";
      var store = new qx.data.store.Json();
      store.setUrl(url);
      store.bind("model", this, "projects");
      console.log('Projects store load requested');
      return new Promise(function (resolve, reject) {
        store.addListener('loaded', function(evt) {
          console.log('Projects store loaded OK');// + evt.getData());
          resolve();
        });
        store.addListener('error', function(evt) {
          reject(new Error('Projects store load failed : ' + evt.getData()));
        });
      });
    },

   __loadTypes : function()
    {
      var url = "/types";
      var store = new qx.data.store.Json();
      store.setUrl(url);
      store.bind("model", this, "types");
      console.log('Types store load requested');
      return new Promise(function (resolve, reject) {
        store.addListener('loaded', function(evt) {
          console.log('Types store loaded OK');// + evt.getData());
          resolve();
        });
        store.addListener('error', function(evt) {
          reject(new Error('Types store load failed : ' + evt.getData()));
        });
      });
    },

    __loadProjectBuilds : function(projectId)
    {
      var url = "/projects/" + projectId;
      var store = new qx.data.store.Json();
      store.setUrl(url);
      store.bind("model", this, "builds");
      console.log('Project Builds store load requested');
      return new Promise(function (resolve, reject) {
        store.addListener('loaded', function(evt) {
          console.log('Project Builds store loaded OK');// + evt.getData());
          resolve();
        });
        store.addListener('error', function(evt) {
          reject(new Error('Project Builds store load failed : ' + evt.getData()));
        });
      });
    },

    __loadBuild : function(buildId)
    {
      var url = "/projects/" + this.getProjectId() + '/builds/' + this.getBuildId();
      var store = new qx.data.store.Json();
      store.setUrl(url);
      store.bind("model", this, "buildData");
      return new Promise(function (resolve, reject) {
        store.addListener('loaded', function(evt) {
          console.log('Build Detail store loaded OK');// + evt.getData());
          resolve();
        });
        store.addListener('error', function(evt) {
          reject(new Error('Build Detail store load failed : ' + evt.getData()));
        });
      });
    },

    __showStartPage : function() {
      this.__startPage.show({reverse:true});
    }
  }
});
