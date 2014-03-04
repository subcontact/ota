/* ************************************************************************

************************************************************************ */
/**
 * This is the main application class of your custom application "ota"
 *
 * @asset(ota/css/styles.css)
 * 
 * @ignore(moment)
 * @ignore(Promise)
 * @ignore(Promise.all)
 */
qx.Class.define("ota.Application",
{
  extend : qx.application.Mobile,

  statics : {
  },

  properties :
  {
    routing : {
      init: null
    },
    buildService : {
      init: null
    },
    // TODO
    // These Id's represent state for the application and dont really belong here.
    // Rather not pass around any more global objects... I haven't figured out a decent way to use DI in qx.
    // Quick and simple app like this shouldn't need to over complicate it.
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

  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */
  members :
  {
    __busyPopup : null,
    __init      : false,
    __homePage  : null,

    __showHome : function() {
      this.__homePage.show({reverse:true});
    },

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
        qx.log.appender.Native; // support native logging capabilities, e.g. Firebug for Firefox
        qx.log.appender.Console; // support additional cross-browser console. Press and hold header on mobile devices
      }

      var routing = new qx.application.Routing();
      this.setRouting(routing);

      var buildService = new ota.service.BuildService();
      this.setBuildService(buildService);

      // Create a manager in mobile device context >> "false"
      var manager = new qx.ui.mobile.page.Manager();

      // Create an instance of the Projects class and establish data bindings
      var projectsPage = this.__homePage = new ota.page.Projects();
      var buildsPage = new ota.page.ProjectBuilds();
      var buildDetailPage = new ota.page.BuildDetail();

      buildsPage.addListener('action', this.__showHome, this);
      buildDetailPage.addListener('action', this.__showHome, this);
      
      // Add page to manager
      manager.addDetail(projectsPage);
      manager.addDetail(buildsPage);
      manager.addDetail(buildDetailPage);

      this.__initBusy();
      
      // lazy callback - turn this into a promise chain
      var initData = function(cb) {
        this.__showBusy();
        Promise.all([
          buildService.loadTypes(),
          buildService.loadProjects()
        ]).then(function () { 
            this.debug('all events finished successfully');
            qx.lang.Function.delay(function() {            
              this.__init = true;
      var elem = document.getElementById("spinner");
      elem.parentNode.removeChild(elem);

              this.__hideBusy();
              cb();
            }, 3000, this);
          }.bind(this), function(values) {
            this.error('some or all events failed');
            this.error(values);
          }.bind(this));
      }.bind(this);
            
      projectsPage.addListener("projectSelected", function(evt) {
        routing.executeGet("/projects/" + evt.getData());
      }, this);

      buildsPage.addListener("buildSelected", function(evt) {
        routing.executeGet("/builds/" + evt.getData());
      }, this);

      routing.onGet("/", function() {
        if (!this.__init) {
          initData(function() {
            routing.executeGet("/projects");
          });
        } else {
          routing.executeGet("/projects");
        }
      }, this);
      routing.onGet("/projects", function() {
        if (!this.__init) {
          initData(function() {
            projectsPage.show();
          });
        } else {
          projectsPage.show();
        }
      }, this);
      routing.onGet("/projects/{projectId}", function(data) {
        if (!this.__init) {
          initData(function() {
            this.setProjectId(data.params.projectId);
            buildService.loadBuilds(this.getProjectId()).then(function() {
              this.debug('showing builds list detail');
              buildsPage.show();
            }.bind(this));
          }.bind(this));
        } else {
          this.setProjectId(data.params.projectId);
          buildService.loadBuilds(this.getProjectId()).then(function() {
            this.debug('showing builds list detail');
            buildsPage.show();
          }.bind(this));
        }
      }, this);
      routing.onGet("/builds/{buildId}", function(data) {
        if (!this.__init) {
          initData(function() {
            this.setBuildId(data.params.buildId);
            buildService.loadBuildInstance(this.getProjectId(), this.getBuildId()).then(function() {
              this.debug('showing build detail');
              buildDetailPage.show();
            }.bind(this));
          }.bind(this));
        } else {
          this.setBuildId(data.params.buildId);
          buildService.loadBuildInstance(this.getProjectId(), this.getBuildId()).then(function() {
            this.debug('showing build detail');
            buildDetailPage.show();
          }.bind(this));
        }
      }, this);
      routing.init();
    },

    __initPages : function() {

    },

    __initRouting : function() {

    },

    __initBusy : function() {
      // EXAMPLE WIDGETS
      var busyIndicator = new qx.ui.mobile.dialog.BusyIndicator("Please wait...");
      this.__busyPopup = new qx.ui.mobile.dialog.Popup(busyIndicator);
    },

    __showBusy : function() {
      this.__busyPopup.show();
    },
    __hideBusy : function() {
      this.__busyPopup.hide();
    },

    __toggleBusy : function () {
      this.__busyPopup.toggleVisibility();
    }
  }
});
