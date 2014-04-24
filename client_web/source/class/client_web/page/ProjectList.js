/* ************************************************************************

************************************************************************ */

/**
 * 
 * @ignore(moment)
 * @ignore(Promise)
 * @ignore(Promise.all)
 */
qx.Class.define("client_web.page.ProjectList",
{
  extend : qx.ui.mobile.page.NavigationPage,

  construct : function() {
    this.base(arguments);
    this.set({
      title : "Projects"
    });
  },

  events : {
    /** Fired when the user selects a Project */
    projectSelected : "qx.event.type.Data"
  },

  properties :
  {
  },

  members :
  {
    __list : null,
    __buildService : null,
    __app : null,

    // overridden
    _initialize : function()
    {
      this.base(arguments);
      this.__app = qx.core.Init.getApplication();
      this.__buildService = this.__app.getBuildService();      
      var types = this.__buildService.getTypes();
      var dateFormat = new qx.util.format.DateFormat();
      this.__list = new qx.ui.mobile.list.List();
      this.__list.setDelegate({
        configureItem : function(item, value, row) {
          item.setTitle(value.getName());
          item.setImage("resource/client_web/internet.png");        
          item.setSubtitle(types.getItem(value.getType()));
          item.setShowArrow(true);
        }
      });
      this.__buildService.bind("projects", this.__list, "model");
      this.__list.addListener("changeSelection", this.__onChangeSelection, this);
      this.getContent().add(this.__list);
    },

    /**
     * Event handler. Called when the selection of the list is changed.
     *
     * @param evt {qx.event.type.Data} the causing event.
     */
    __onChangeSelection : function(evt)
    {
      // retrieve the index of the selected row
      this.fireDataEvent("projectSelected", this.__buildService.getProjects().getItem(evt.getData()).get_id());
    }
  },


  destruct : function()
  {
    this._disposeObjects("__list");
    this.__buildService = null;
    this.__app = null;
  }
});