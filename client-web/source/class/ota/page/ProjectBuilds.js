/* ************************************************************************

************************************************************************ */

/**
 * 
 * @ignore(moment)
 * @ignore(Promise)
 * @ignore(Promise.all)
 */
qx.Class.define("ota.page.ProjectBuilds",
{
  extend : qx.ui.mobile.page.NavigationPage,

  construct : function() {
    this.base(arguments);
    this.set({
      title : "Builds",
      showBackButton : true,
      backButtonText : "Back"      
    });
  },

  events : {
    /** Fired when the user selects a build */
    buildSelected : "qx.event.type.Data"
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
      var date, data;
      this.__list = new qx.ui.mobile.list.List();
      this.__list.setDelegate({
        configureItem : function(item, value, row) {
          date = moment(value.getInstanceLabel());
          data = date.format("ddd, Do MMM YYYY, h:mm:ss a") + " (" + date.fromNow() + ")";
          item.setTitle(data);
          item.setShowArrow(true);
        }
      });
      this.__buildService.bind("builds", this.__list, "model");
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
      this.fireDataEvent("buildSelected", this.__buildService.getBuilds().getItem(evt.getData()).get_id());
    },

     // overridden
    _back : function()
    {
      this.__app.getRouting().back();
    }    
  },

  destruct : function()
  {
    this._disposeObjects("__list");
    this.__buildService = null;
    this.__app = null;  
  }
});