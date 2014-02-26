qx.Class.define("ota.service.BuildService",
{
  extend :  qx.core.Object,

  statics :
  {
    PROJECTS_URI : '/projects',
    TYPES_URI    : '/types',
    BUILDS_URI   : '/builds'
  },

  events : {
    /** Fired when the user selects a tweet */
    showProjectBuilds : "qx.event.type.Data"
  },

  properties :
  {
    /** Holds all projects */
    projects :
    {
      check : "qx.data.Array",
      nullable : true,
      init : null,
      event : "changeProjects"
    },

    /** Holds all builds for the current project */
    builds :
    {
      check : "qx.data.Array",
      nullable : true,
      init : null,
      event : "changeBuilds"
    },


    /** Holds selected build data */
    buildData :
    {
      check : "Object",
      nullable : true,
      init : null,
      event : "changeBuildData"
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
      event : "changeTypes"
    }
  },

  construct : function()
  {
    this.base(arguments);

    this.__projectsStore.bind("model", this, "projects");
    this.__buildsStore.bind("model", this, "builds");
    this.__buildInstance.bind("model", this, "buildData");
    this.__typesStore.bind("model", this, "types");
  },

  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    __projectsStore : new qx.data.store.Json(),
    __buildsStore   : new qx.data.store.Json(),
    __buildInstance : new qx.data.store.Json(),
    __typesStore    : new qx.data.store.Json(),


    loadProjects : function()
    {
      this.__projectsStore.setUrl(arguments.callee.self.PROJECTS_URI);
      console.log('Projects store load requested');
      return new Promise(function (resolve, reject) {
        this.__projectsStore.addListenerOnce('loaded', function(evt) {
          console.log('Projects store loaded OK');// + evt.getData());
          resolve();
        });
        this.__projectsStore.addListenerOnce('error', function(evt) {
          reject(new Error('Projects store load failed : ' + evt.getData()));
        });
      }.bind(this));
    },

    loadBuilds : function()
    {
      this.__buildsStore.setUrl(arguments.callee.self.PROJECTS_URI + '/' + this.getProjectId());
      console.log('Project Builds store load requested');
      return new Promise(function (resolve, reject) {
        this.__buildsStore.addListenerOnce('loaded', function(evt) {
          console.log('Project Builds store loaded OK');// + evt.getData());
          resolve();
        });
        this.__buildsStore.addListenerOnce('error', function(evt) {
          reject(new Error('Project Builds store load failed : ' + evt.getData()));
        });
      }.bind(this));
    },

    loadBuildInstance : function()
    {
      var url = arguments.callee.self.PROJECTS_URI + '/' + this.getProjectId() + arguments.callee.self.PROJECTS_URI + '/' + this.getBuildId();
      this.__buildInstance.setUrl(url);
      return new Promise(function (resolve, reject) {
        this.__buildInstance.addListenerOnce('loaded', function(evt) {
          console.log('Build Detail store loaded OK');// + evt.getData());
          resolve();
        });
        this.__buildInstance.addListenerOnce('error', function(evt) {
          reject(new Error('Build Detail store load failed : ' + evt.getData()));
        });
      }.bind(this));
    },

    loadTypes : function()
    {
      this.__typesStore.setUrl(arguments.callee.self.TYPES_URI);
      console.log('Types store load requested');
      return new Promise(function (resolve, reject) {
        this.__typesStore.addListenerOnce('loaded', function(evt) {
          console.log('Types store loaded OK');// + evt.getData());
          resolve();
        });
        this.__typesStore.addListenerOnce('error', function(evt) {
          reject(new Error('Types store load failed : ' + evt.getData()));
        });
      }.bind(this));
    },

    destruct : function()
    {
      this._disposeObjects("__projectsStore");
      this._disposeObjects("__buildsStore");
      this._disposeObjects("__buildInstance");
      this._disposeObjects("__typesStore");
    }    
  }
});