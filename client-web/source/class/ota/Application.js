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

    // http://stackoverflow.com/questions/10420352/converting-file-size-in-bytes-to-human-readable
    _fileSizeIEC : function(a) {
      return (b=Math,c=b.log,d=1024,e=c(a)/c(d)|0,a/b.pow(d,e)).toFixed(2)+' '+(e?'KMGTPEZY'[--e]+'iB':'Bytes')
    },
    
    _applyProjectId : function(value, old) {
      //console.log('_applyProjectId ', value);
      //console.log('_applyProjectId ', this.getProjectId());
      var project = this.getBuildService().findProjectById(value);
      this.setProject(project);
      //console.log('_applyProjectId ', qx.dev.Debug.debugProperties(project));
      //console.log(this.getProject().getName());
    },

    _applyBuildId : function(value, old) {
      //console.log('_applyBuildId ', value);
      //console.log('_applyBuildId ', this.getBuildId());      
      //this.setBuild(this.getBuildService().findBuildById(value).item);
      var build = this.getBuildService().findBuildById(value);
      this.setBuild(build);
    },

    __showHome : function() {
      this.__homePage.show({reverse:true});
    },

    __appReadyPromise : null,

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

    __appInitDataPromise : null,

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

      var buildService = new ota.service.BuildService();
      this.setBuildService(buildService);

      // Create a manager in mobile device context >> "false"
      var manager = new qx.ui.mobile.page.Manager(false);

      // Create an instance of the Projects class and establish data bindings
      var projectsPage = this.__homePage = new ota.page.ProjectList();
      var buildsPage = new ota.page.BuildList();
      var buildDetailPage = new ota.page.Build();
      //var buildViewIOS = new ota.page.BuildViewIOS();
      //var buildViewAND = new ota.page.BuildViewAND();

      buildsPage.addListener('action', this.__showHome, this);
      buildDetailPage.addListener('action', this.__showHome, this);

      // Add page to manager
      manager.addDetail(projectsPage);
      manager.addDetail(buildsPage);
      manager.addDetail(buildDetailPage);
      //manager.addDetail(buildViewIOS);
      //manager.addDetail(buildViewAND);

      this.__initBusy();

      //this.__appInitData().then(function(value) {
     //   console.log('done ');
      // });


/*

      this.__initBusy();
      var h=0;
      //var initRunning = false;
      // lazy callback - turn this into a promise chain
      var initData = function(cb) {
        //initRunning = true;
        /*
        return new Promise(function (resolve, reject) {
          setTimeout(function () {
            if (something)
              resolve(something);
            else
              reject(new Error("nothing"));
          }, 1000);
        });


*/
        //console.log(this.__init);
        //if (initRunning || this.__init) {
        //  console.log('already initialised');
       //   cb();
       //   return;
       // }
       /*
       console.log('running', ++h);
        this.__showBusy();
        Promise.all([
          buildService.loadTypes(),
          buildService.loadProjects(),
          appReady()
        ]).then(function () { 
            this.debug('all events finished successfully');
            this.__init = true;
            qx.lang.Function.delay(function() {            
              
              // ugly hack
              console.log('running', ++h);
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
           */ 

      projectsPage.addListener("projectSelected", function(evt) {
        routing.executeGet("/projects/" + evt.getData());
      }, this);

      buildsPage.addListener("buildSelected", function(evt) {
        routing.executeGet("/builds/" + evt.getData());
      }, this);

      routing.onGet("/", function() {
        this.__appInitData().then(function(value) {
          routing.executeGet("/projects");
        }.bind(this));
      }, this);
      routing.onGet("/projects", function() {
        this.__appInitData().then(function(value) {
          projectsPage.show();
        }.bind(this));
      }, this);
      routing.onGet("/projects/{projectId}", function(data) {
        this.__appInitData().then(function(value) {
          this.setProjectId(data.params.projectId);
          buildService.loadBuilds(this.getProjectId()).then(function() {
            this.debug('showing builds list detail');
            buildsPage.show();
          }.bind(this));
        }.bind(this));
      }, this);
      routing.onGet("/builds/{buildId}", function(data) {
        this.__appInitData().then(function(value) {
          this.setBuildId(data.params.buildId);
          buildService.loadBuildInstance(this.getProjectId(), this.getBuildId()).then(function() {
            //console.log(buildService.getBuildData());
            this.debug('showing build detail');
            buildDetailPage.show();
          }.bind(this));
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
