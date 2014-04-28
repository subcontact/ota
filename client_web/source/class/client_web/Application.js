/* ************************************************************************

************************************************************************ */
/**
 * This is the main application class of your custom application "client_web"
 *
 * 
 * @asset(client_web/*)
 * @ignore(moment)
 * @ignore(Promise)
 * @ignore(Promise.all)
 */
qx.Class.define("client_web.Application",
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
    // Rather not pass around any more global objects... I haven't seen a decent way to use DI in qx.
    // Quick and simple app like this shouldn't need to over complicate it.
     /** currently selected Project */
    projectId :
    {
      check : "String",
      nullable : true,
      init : null,
      event : "changeProjectId",
      apply : "_applyProjectId"
    },

    /** currently selected Build for the Project */
    buildId :
    {
      check : "String",
      nullable : true,
      init : null,
      event : "changeBuildId",
      apply : "_applyBuildId"
    },

    project :
    {
      check : "Object",
      nullable : true,
      init : null,
      event : "changeProject"
    },

    build :
    {
      check : "Object",
      nullable : true,
      init : null,
      event : "changeBuild"
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
    platforms :  {
      IOS             : 0,
      AND             : 1,
      WIN             : 2,
      IPHONE          : 3,
      IPAD            : 4,
      ANDROID_PHONE   : 5,
      ANDROID_TABLET  : 6,
      WINDOWS_PHONE   : 7,
      WINDOWS_TABLET  : 8,
      UNKNOWN         : 9
    },
    __appReadyPromise : null,
    __appInitDataPromise : null,

    // http://stackoverflow.com/questions/10420352/converting-file-size-in-bytes-to-human-readable
    _fileSizeIEC : function(a,b,c,d,e) {
      return (b=Math,c=b.log,d=1024,e=c(a)/c(d)|0,a/b.pow(d,e)).toFixed(2)+' '+(e?'KMGTPEZY'[--e]+'iB':'Bytes')
    },
    
    _applyProjectId : function(value, old) {
      var project = this.getBuildService().findProjectById(value);
      this.setProject(project);
    },

    _applyBuildId : function(value, old) {
      var build = this.getBuildService().findBuildById(value);
      this.setBuild(build);
    },

    __showHome : function() {
      this.__homePage.show({reverse:true});
    },

    __appReady : function() {
      if (this.__appReadyPromise) return this.__appReadyPromise;

      this.__appReadyPromise = new Promise(function (resolve, reject) {
        setTimeout(function() {
          var elem = document.getElementById("spinner");
          if (elem) { elem.parentNode.removeChild(elem) }
          resolve();
        }.bind(this), 900);
      });
      return this.__appReadyPromise;
    },

    __appInitData : function() {
      if (this.__appInitDataPromise) return this.__appInitDataPromise;

      this.__appInitDataPromise = new Promise(function (resolve, reject) {
        this.debug('appInitData running');
        this.__showBusy();
        var buildService = this.getBuildService();
        Promise.all([
          buildService.loadTypes(),
          buildService.loadProjects(),
          this.__appReady()
        ]).then(function () { 
            this.debug('all events finished successfully');
            this.__init = true;
            this.__hideBusy();
            this.debug('appInitData finished');
            resolve();
          }.bind(this), function(values) {
            this.error('some or all events failed');
            this.error(values);
            this.debug('appInitData finished');
            reject();
          }.bind(this));
      }.bind(this));
      return this.__appInitDataPromise;
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

      var buildService = new client_web.service.BuildService();
      this.setBuildService(buildService);

      // Create a manager in mobile device context >> "false"
      var manager = new qx.ui.mobile.page.Manager(false);

      // Create an instance of the Projects class and establish data bindings
      var projectsPage = this.__homePage = new client_web.page.ProjectList();
      var buildsPage = new client_web.page.BuildList();
      var buildDetailPage = new client_web.page.Build();

      buildsPage.addListener('action', this.__showHome, this);
      buildDetailPage.addListener('action', this.__showHome, this);

      // Add page to manager
      manager.addDetail(projectsPage);
      manager.addDetail(buildsPage);
      manager.addDetail(buildDetailPage);

      this.__initBusy();

      projectsPage.addListener("projectSelected", function(evt) {
        routing.executeGet("/projects/" + evt.getData());
      }, this);

      buildsPage.addListener("buildSelected", function(evt) {
        routing.executeGet("/builds/" + evt.getData());
      }, this);

      routing.onGet("/", function() {
        this.__appInitData().then(function(value) {
          routing.executeGet("/projects");
        }.bind(this), function() {
          this.debug('__appInitData failed');
          this.__hideBusy();
          qx.ui.mobile.dialog.Manager.getInstance().error("Ooops", "<p>__appInitData failed</p>", function() {}, this, ["OK"]);
        }.bind(this));
      }, this);
      routing.onGet("/projects", function() {
        this.__appInitData().then(function(value) {
          projectsPage.show();
        }.bind(this), function() {
          this.debug('__appInitData failed');
          this.__hideBusy();
          qx.ui.mobile.dialog.Manager.getInstance().error("Ooops", "<p>__appInitData failed</p>", function() {}, this, ["OK"]);
        }.bind(this));
      }, this);
      routing.onGet("/projects/{projectId}", function(data) {
        this.__appInitData().then(function(value) {
          this.setProjectId(data.params.projectId);
          this.__showBusy();
          buildService.loadBuilds(this.getProjectId()).then(function() {
            this.debug('showing builds list detail');
            buildsPage.show();
            this.__hideBusy();
          }.bind(this), function(err) {
            this.debug('buildService.loadBuilds failed');
            this.__hideBusy();
            qx.ui.mobile.dialog.Manager.getInstance().error("Ooops", "<p>buildService.loadBuilds failed</p>" + err, function() {}, this, ["OK"]);
          }.bind(this));
        }.bind(this), function() {
          this.debug('__appInitData failed');
          this.__hideBusy();
          qx.ui.mobile.dialog.Manager.getInstance().error("Ooops", "<p>__appInitData failed</p>", function() {}, this, ["OK"]);
        }.bind(this));
      }, this);
      routing.onGet("/builds/{buildId}", function(data) {
        this.__appInitData().then(function(value) {
          this.setBuildId(data.params.buildId);
          this.__showBusy();
          buildService.loadBuildInstance(this.getProjectId(), this.getBuildId()).then(function() {
            this.debug('showing build detail');
            buildDetailPage.show();
            this.__hideBusy();
          }.bind(this), function(err) {
            this.debug('buildService.loadBuildInstance failed');
            this.__hideBusy();
            qx.ui.mobile.dialog.Manager.getInstance().error("Ooops", "<p>buildService.loadBuildInstance failed</p>" + err, function() {}, this, ["OK"]);
          }.bind(this));
        }.bind(this), function() {
          this.debug('__appInitData failed');
          this.__hideBusy();
          qx.ui.mobile.dialog.Manager.getInstance().error("Ooops", "<p>__appInitData failed</p>", function() {}, this, ["OK"]);
        }.bind(this));
      }, this);

      routing.executeGet("/");
      routing.init();
    },

    __initPages : function() {

    },

    __initRouting : function() {

    },

    __initBusy : function() {
      // 
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
