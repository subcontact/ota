/* ************************************************************************

************************************************************************ */

/**
 * 
 * @ignore(moment)
 * @ignore(Promise)
 * @ignore(Promise.all)
 */
qx.Class.define("client_web.page.BuildList",
{
  extend : qx.ui.mobile.page.NavigationPage,

  construct : function() {
    this.base(arguments);
    this.set({
      title : "Builds",
      showBackButton : true,
      backButtonText : "Back",      
      showButton : true,
      buttonText : "Home" 
    });

    this.addListener("start", function() {

      this.debug('buildList start called');
      this.debug('list length ', this.__list.getModel().getLength());
      if (this.__list.getModel().getLength() === 0) {
        this.debug('list is empty');
        qx.ui.mobile.dialog.Manager.getInstance().error("No Builds", "<p>No valid builds found</p>", this._back, this, ["OK"]);
        this.debug('list is empty 2');
      }
    }, this);
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
          //date = moment(value.getInstanceLabel());
          //data = date.format("ddd, Do MMM YYYY, h:mm:ss a") + " (" + date.fromNow() + ")";
          item.setTitle(value.getLabels().getInstance5() + ", " + value.getLabels().getInstance3());
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