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


************************************************************************ */

/**
 * This is the main application class of your custom application "ota"
 *
 * @asset(ota/css/styles.css)
 */
qx.Class.define("ota.Application",
{
  extend : qx.application.Mobile,


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

    /** The current username */
    username :
    {
      check : "String",
      nullable : false,
      init : "",
      event : "changeUsername",
      apply : "_applyUsername" // this method will be called when the property is set
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

      qx.util.AliasManager.getInstance().add('wbg', 'http://www.westpac.com.au');

      // Create a manager in mobile device context >> "false"
      var manager = new qx.ui.mobile.page.Manager(false);

      // Create an instance of the Input class and initial show it
      //var inputPage = this.__inputPage = new ota.page.Input();

      // Add page to manager
      // manager.addDetail(inputPage);

      // Display inputPage on start
      //inputPage.show();

      // Create an instance of the Projects class and establish data bindings
      var projectsPage = this.__startPage = new ota.page.Projects();
      this.bind("projects", projectsPage, "projects");

      var buildsPage = new ota.page.ProjectBuilds();
      this.bind("builds", buildsPage, "builds");
      this.bind("projectId", buildsPage, "projectId");
      this.bind("buildId", buildsPage, "buildId");

      // Add page to manager
      manager.addDetail(projectsPage);
      manager.addDetail(buildsPage);
      this.__loadProjects();
      projectsPage.show();

      // Create an instance of the Tweet class
      //var tweetPage = new ota.page.TweetDetail();

      // Add page to manager
      //manager.addDetail(tweetPage);

      // Load the tweets and show the tweets page
      //inputPage.addListener("requestProject", function(evt) {
      //  this.setUsername(evt.getData());
      //  projectsPage.show();
      //}, this);

      // Show the selected tweet
      projectsPage.addListener("showProjectBuilds", function(evt) {
        var index = evt.getData();
        this.debug('showProjectBuilds');
        this.debug(index);
        this.debug(this.getProjects().getItem(index).get_id());

        this.setProjectId(this.getProjects().getItem(index).get_id());
        this.__loadProjectBuilds(this.getProjectId());
        buildsPage.show();
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
    },


    // property apply
    _applyUsername : function(value, old) {
      this.__loadProjects();
    },

    // property apply
    _applyProjects : function(value, old) {
      // print the loaded data in the console
      this.debug("Projects: ", qx.lang.Json.stringify(value)); // just display the data
    },


    // property apply
    _applyBuilds : function(value, old) {
      // print the loaded data in the console
      this.debug("Builds: ", qx.lang.Json.stringify(value)); // just display the data
    },


    /**
     * Loads all tweets of the currently set user.
     */
    __loadProjects : function()
    {
      // Mocked Identica Tweets API
      // Create a new JSONP store instance with the given url
      // var url = "http://demo.qooxdoo.org/" + qx.core.Environment.get("qx.version") + "/tweets_step4.5/resource/tweets/service.js";
      var url = "/projects";

      var store = new qx.data.store.Json();
      //store.setCallbackName("callback");
      store.setUrl(url);

      // Use data binding to bind the "model" property of the store to the "tweets" property
      store.bind("model", this, "projects");
    },

    /**
     * Loads all tweets of the currently set user.
     */
    __loadProjectBuilds : function(projectId)
    {
      // Mocked Identica Tweets API
      // Create a new JSONP store instance with the given url
      // var url = "http://demo.qooxdoo.org/" + qx.core.Environment.get("qx.version") + "/tweets_step4.5/resource/tweets/service.js";
      var url = "/projects/" + projectId;

      var store = new qx.data.store.Json();
      //store.setCallbackName("callback");
      store.setUrl(url);

      // Use data binding to bind the "model" property of the store to the "tweets" property
      store.bind("model", this, "builds");
    },


    /**
     * Shows the input page of the application.
     */
    __showStartPage : function() {
      this.__startPage.show({reverse:true});
    }
  }
});
