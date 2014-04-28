/* ************************************************************************

************************************************************************ */

/**
 * 
 * @ignore(moment)
 * @ignore(Promise)
 * @ignore(Promise.all)
 */
qx.Class.define("client_web.service.BuildService",
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

    __findItemById : function(list, id)
    {
        //console.log('looking for id', id);
        //console.log('list', list);
        try
        {
            var length = list.getLength();
            for (var i=0; i<length; i++)
            {
                //console.log('index', i);
                //console.log('id', list.getItem(i).get_id());
                if (list.getItem(i).get_id() === id) { return list.getItem(i); }
            }
            return null;
        }
        catch(e) {qx.log.Logger.error(arguments.callee.displayName + ' : ' + e)}
        return null;
    },

    findProjectById : function(id) {

      return this.__findItemById(this.getProjects(), id);
    },

    findBuildById : function(id) {

      return this.__findItemById(this.getBuilds(), id);
    },

    loadProjects : function()
    {
      if (this.__projectsStore.getUrl() === arguments.callee.self.PROJECTS_URI) {
        this.__projectsStore.reload();
      } else {
        this.__projectsStore.setUrl(arguments.callee.self.PROJECTS_URI);
      }
      this.debug('Projects store load requested');
      return new Promise(function (resolve, reject) {
        this.__projectsStore.addListenerOnce('loaded', function(evt) {
          this.debug('Projects store loaded OK');// + evt.getData());
          resolve();
        });
        this.__projectsStore.addListenerOnce('error', function(evt) {
          reject(new Error('Projects store load failed : ' + evt.getData()));
        });
      }.bind(this));
    },

    loadBuilds : function(projectId)
    {
      if (this.__buildsStore.getUrl() === arguments.callee.self.PROJECTS_URI + '/' + projectId) {
        this.__buildsStore.reload();
      } else {
        this.__buildsStore.setUrl(arguments.callee.self.PROJECTS_URI + '/' + projectId);
      }
      this.debug('Project Builds store load requested');
      return new Promise(function (resolve, reject) {
        this.__buildsStore.addListenerOnce('loaded', function(evt) {
          this.debug('Project Builds store loaded OK');// + evt.getData());
          resolve();
        });
        this.__buildsStore.addListenerOnce('error', function(evt) {
          reject(new Error('Project Builds store load failed : ' + evt.getData()));
        });
      }.bind(this));
    },

    loadBuildInstance : function(projectId, buildId)
    {
      var url = arguments.callee.self.PROJECTS_URI + '/' + projectId + arguments.callee.self.BUILDS_URI + '/' + buildId;
      if (this.__buildInstance.getUrl() === url) {
        this.__buildInstance.reload();
      } else {
        this.__buildInstance.setUrl(url);
      }
      this.debug('loadBuildInstance store load requested');
      return new Promise(function (resolve, reject) {
        this.__buildInstance.addListenerOnce('loaded', function(evt) {
          this.debug('Build Detail store loaded OK');// + evt.getData());
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
      this.debug('Types store load requested');
      return new Promise(function (resolve, reject) {
        this.__typesStore.addListenerOnce('loaded', function(evt) {
          this.debug('Types store loaded OK');// + evt.getData());
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