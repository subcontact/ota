/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2012 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Tino Butz (tbtz)
     * Christopher Zuendorf (czuendorf)

************************************************************************ */

/**
 * The list widget displays the data of a model in a list.
 *
 * *Example*
 *
 * Here is a little example of how to use the widget.
 *
 * <pre class='javascript'>
 *
 *    // Data for the list
 *    var data = [
 *       {title : "Row1", subtitle : "Sub1"},
 *       {title : "Row2", subtitle : "Sub2"},
 *       {title : "Row3", subtitle : "Sub3"}
 *   ];
 *
 *   // Create the list with a delegate that
 *   // configures the list item.
 *   var list = new qx.ui.mobile.list.List({
 *     configureItem : function(item, data, row)
 *     {
 *       item.setTitle(data.title);
 *       item.setSubtitle(data.subtitle);
 *       item.setShowArrow(true);
 *     }
 *   });
 *
 *   // Set the model of the list
 *   list.setModel(new qx.data.Array(data));
 *
 *   // Add an changeSelection event
 *   list.addListener("changeSelection", function(evt) {
 *     alert("Index: " + evt.getData())
 *   }, this);
 *
 *   this.getRoot().add(list);
 * </pre>
 *
 * This example creates a list with a delegate that configures the list item with
 * the given data. A listener for the event {@link #changeSelection} is added.
 */
qx.Class.define("qx.ui.mobile.list.List",
{
  extend : qx.ui.mobile.core.Widget,


 /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * @param delegate {Object?null} The {@link #delegate} to use
   */
  construct : function(delegate)
  {
    this.base(arguments);
    this.addListener("tap", this._onTap, this);
    this.__provider = new qx.ui.mobile.list.provider.Provider(this);
    if (delegate) {
      this.setDelegate(delegate);
    }

    if (qx.core.Environment.get("qx.dynlocale")) {
      qx.locale.Manager.getInstance().addListener("changeLocale", this._onChangeLocale, this);
    }

    this._setLayout(new qx.ui.mobile.layout.VBox());
  },


 /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */

  events :
  {
    /**
     * Fired when the selection is changed.
     */
    changeSelection : "qx.event.type.Data"
  },


  properties :
  {
    // overridden
    defaultCssClass :
    {
      refine : true,
      init : "list"
    },


    /**
     * Delegation object which can have one or more functions defined by the
     * {@link qx.ui.mobile.list.IListDelegate} interface.
     */
    delegate :
    {
      apply: "_applyDelegate",
      event: "changeDelegate",
      init: null,
      nullable: true
    },


    /**
     * The model to use to render the list.
     */
    model :
    {
      check : "qx.data.Array",
      apply : "_applyModel",
      event: "changeModel",
      nullable : true,
      init : null
    },


    /**
     * Number of items to display. Auto set by model.
     * Reset to limit the amount of data that should be displayed.
     */
    itemCount : {
      check : "Integer",
      init : 0
    }
  },


 /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    __provider : null,


    // overridden
    _getTagName : function()
    {
      return "ul";
    },


    /**
     * Event handler for the "tap" event.
     *
     * @param evt {qx.event.type.Tap} The tap event
     */
    _onTap : function(evt)
    {
      var element = evt.getOriginalTarget();
      var index = -1;

      // Click on border: do nothing.
      if(element.tagName == "UL") {
        return;
      }

      while (element.tagName != "LI") {
        element = element.parentNode;
      }
      if (qx.bom.element.Attribute.get(element, "data-selectable") != "false"
          && qx.dom.Element.hasChild(this.getContainerElement(), element))
      {
        index = qx.dom.Hierarchy.getElementIndex(element);
      }
      if (index != -1) {
        this.fireDataEvent("changeSelection", index);
      }
    },


    // property apply
    _applyModel : function(value, old)
    {
      if (old != null) {
        old.removeListener("changeBubble", this.__onModelChangeBubble, this);
      }
      if (value != null) {
        value.addListener("changeBubble", this.__onModelChangeBubble, this);
      }

      if (old != null) {
        old.removeListener("change", this.__onModelChange, this);
      }
      if (value != null) {
        value.addListener("change", this.__onModelChange, this);
      }

      if (old != null) {
        old.removeListener("changeLength", this.__onModelChangeLength, this);
      }
      if (value != null) {
        value.addListener("changeLength", this.__onModelChangeLength, this);
      }


      this.__render();
    },


    // property apply
    _applyDelegate : function(value, old) {
      this.__provider.setDelegate(value);
    },


    /**
     * Listen on model 'changeLength' event.
     * @param evt {qx.event.type.Data} data event which contains model change data.
     */
    __onModelChangeLength : function(evt) {
      this.__render();
    },

    /**
     * Locale change event handler
     *
     * @signature function(e)
     * @param e {Event} the change event
     */
    _onChangeLocale : qx.core.Environment.select("qx.dynlocale",
    {
      "true" : function(e)
      {
        this.__render();
      },

      "false" : null
    }),


    /**
     * Reacts on model 'change' event.
     * @param evt {qx.event.type.Data} data event which contains model change data.
     */
    __onModelChange : function(evt) {
      if(evt && evt.getData() && evt.getData().type == "order") {
        this.__render();
      }
    },


    /**
     * Reacts on model 'changeBubble' event.
     * @param evt {qx.event.type.Data} data event which contains model changeBubble data.
     */
    __onModelChangeBubble : function(evt)
    {
      if(evt) {
        var data = evt.getData();
        var isArray = (qx.lang.Type.isArray(data.old) && qx.lang.Type.isArray(data.value));
        if(!isArray || (isArray && data.old.length == data.value.length)) {
          var rows = this._extractRowsToRender(data.name);

          for (var i=0; i < rows.length; i++) {
            this.__renderRow(rows[i]);
          }
        }
      }
    },


    /**
     * Extracts all rows, which should be rendered from "changeBubble" event's
     * data.name.
     * @param name {String} The 'data.name' String of the "changeBubble" event,
     *    which contains the rows that should be rendered.
     * @return {Integer[]} An array with integer values, representing the rows which should
     *  be rendered.
     */
    _extractRowsToRender : function(name) {
      var rows = [];

      if(!name) {
        return rows;
      }

      // "[0-2].propertyName" | "[0].propertyName" | "0"
      var containsPoint = (name.indexOf(".")!=-1);
      if(containsPoint) {
        // "[0-2].propertyName" | "[0].propertyName"
        var candidate = name.split(".")[0];

        // Normalize
        candidate = candidate.replace("[","");
        candidate = candidate.replace("]","");
        // "[0-2]" | "[0]"
        var isRange = (candidate.indexOf("-") != -1);

        if(isRange) {
          var rangeMembers = candidate.split("-");
          // 0
          var startRange = parseInt(rangeMembers[0],10);
          // 2
          var endRange = parseInt(rangeMembers[1],10);

          for(var i = startRange; i <= endRange; i++) {
            rows.push(i);
          }
        } else {
          // "[0]"
          rows.push(parseInt(candidate.match(/\d+/)[0], 10));
        }
      } else {
        // "0"
        var match = name.match(/\d+/);
        if(match.length == 1) {
          rows.push(parseInt(match[0], 10));
        }
      }

      return rows;
    },


    /**
     * Renders a specific row identified by its index.
     * @param index {Integer} index of the row which should be rendered.
     */
    __renderRow : function(index) {
      var model = this.getModel();
      var element = this.getContentElement();
      var itemElement = this.__provider.getItemElement(model.getItem(index), index);

      var oldNode = element.childNodes[index];

      element.replaceChild(itemElement, oldNode);

      this._domUpdated();
    },


    /**
    * @internal
    * Returns the height of one single list item.
    * @return {Integer} the height of a list item in px.
    */
    getListItemHeight : function() {
      var listItemHeight = 0;
      if (this.getModel() != null && this.getModel().length > 0) {
        var listHeight = qx.bom.element.Style.get(this.getContentElement(), "height");
        listItemHeight = parseInt(listHeight) / this.getModel().length;
      }
      return listItemHeight;
    },


    /**
     * Renders the list.
     */
    __render : function()
    {
      this._setHtml("");

      var model = this.getModel();
      this.setItemCount(model ? model.getLength() : 0);

      var itemCount = this.getItemCount();

      var element = this.getContentElement();
      for (var index = 0; index < itemCount; index++) {
        var itemElement = this.__provider.getItemElement(model.getItem(index), index);
        element.appendChild(itemElement);
      }
      this._domUpdated();
    }
  },


 /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function()
  {
    this._disposeObjects("__provider");
    if (qx.core.Environment.get("qx.dynlocale")) {
      qx.locale.Manager.getInstance().removeListener("changeLocale", this._onChangeLocale, this);
    }
  }
});
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

/**
 * Provides a list item element for a certain row and its data.
 * Uses the {@link qx.ui.mobile.list.renderer.Default} list item renderer as a
 * default renderer when no other renderer is given by the {@link qx.ui.mobile.list.List#delegate}.
 */
qx.Class.define("qx.ui.mobile.list.provider.Provider",
{
  extend : qx.core.Object,


 /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties:
  {
    /**
     * Delegation object which can have one or more functions defined by the
     * {@link qx.ui.mobile.list.IListDelegate} interface. Set by the list.
     *
     * @internal
     */
    delegate :
    {
      event: "changeDelegate",
      init: null,
      nullable: true,
      apply : "_applyDelegate"
    }
  },




 /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    __itemRenderer : null,


    /**
     * Sets the item renderer.
     *
     * @param renderer {qx.ui.mobile.list.renderer.Abstract} The used item renderer
     */
    _setItemRenderer : function(renderer) {
      this.__itemRenderer = renderer;
    },


    /**
     * Returns the set item renderer.
     *
     * @return {qx.ui.mobile.list.renderer.Abstract} The used item renderer
     */
    _getItemRenderer : function() {
      return this.__itemRenderer;
    },


    /**
     * Returns the list item element for a given row.
     *
     * @param data {var} The data of the row.
     * @param row {Integer} The row index.
     *
     * @return {Element} the list item element.
     */
    getItemElement : function(data, row)
    {
      this.__itemRenderer.reset();
      this._configureItem(data, row);
      // Clone the element and all it's events
      return qx.bom.Element.clone(this.__itemRenderer.getContainerElement(), true);
    },


    /**
     * Configure the list item renderer with the given data.
     *
     * @param data {var} The data of the row.
     * @param row {Integer} The row index.
     */
    _configureItem : function(data, row)
    {
      var delegate = this.getDelegate();

      if (delegate != null && delegate.configureItem != null) {
        delegate.configureItem(this.__itemRenderer, data, row);
      }
    },



    /**
     * Creates an instance of the item renderer to use. When no delegate method
     * is given the function will return an instance of {@link qx.ui.mobile.list.renderer.Default}.
     *
     * @return {qx.ui.mobile.list.renderer.Abstract} An instance of the item renderer.
     *
     */
    _createItemRenderer : function()
    {
      var createItemRenderer = qx.util.Delegate.getMethod(this.getDelegate(), "createItemRenderer");
      var itemRenderer = null;
      if (createItemRenderer == null)
      {
        itemRenderer = new qx.ui.mobile.list.renderer.Default();
      } else {
        itemRenderer = createItemRenderer();
      }

      return itemRenderer;
    },


    // property apply
    _applyDelegate : function(value, old)
    {
      this._setItemRenderer(this._createItemRenderer());
    }
  },

 /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function()
  {
    this._disposeObjects("__itemRenderer");
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2010 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Christian Hagendorn (chris_schmidt)
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * Methods to work with the delegate pattern.
 */
qx.Class.define("qx.util.Delegate",
{
  statics :
  {
    /**
     * Returns the delegate method given my its name.
     *
     * @param delegate {Object} The delegate object to check the method.
     * @param specificMethod {String} The name of the delegate method.
     * @return {Function|null} The requested method or null, if no method is set.
     */
    getMethod : function(delegate, specificMethod)
    {
      if (qx.util.Delegate.containsMethod(delegate, specificMethod)) {
        return qx.lang.Function.bind(delegate[specificMethod], delegate);
      }

      return null;
    },



    /**
     * Checks, if the given delegate is valid or if a specific method is given.
     *
     * @param delegate {Object} The delegate object.
     * @param specificMethod {String} The name of the method to search for.
     * @return {Boolean} True, if everything was ok.
     */
    containsMethod : function (delegate, specificMethod)
    {
      var Type = qx.lang.Type;

      if (Type.isObject(delegate)) {
        return Type.isFunction(delegate[specificMethod]);
      }

      return false;
    }
  }
});
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

/**
 * Base class for all list item renderer.
 */
qx.Class.define("qx.ui.mobile.list.renderer.Abstract",
{
  extend : qx.ui.mobile.container.Composite,
  type : "abstract",


 /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  construct : function(layout)
  {
    this.base(arguments, layout);
    this.initSelectable();
    this.initShowArrow();
  },


 /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    // overridden
    defaultCssClass :
    {
      refine : true,
      init : "list-item"
    },


    /**
     * Whether the row is selected.
     */
    selected :
    {
      check : "Boolean",
      init : false,
      apply : "_applySelected"
    },


    /**
     * Whether the row is selectable.
     */
    selectable :
    {
      check : "Boolean",
      init : true,
      apply : "_applyAttribute"
    },


    /**
     * Whether to show an arrow in the row.
     */
    showArrow :
    {
      check : "Boolean",
      init : false,
      apply : "_applyShowArrow"
    },


    //overridden
    activatable :
    {
      refine :true,
      init : true
    }
  },




 /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    // abstract method
    /**
     * Resets all defined child widgets. Override this method in your custom
     * list item renderer and reset all widgets displaying data. Needed as the
     * renderer is used for every row and otherwise data of a different row
     * might be displayed, when not all data displaying widgets are used for the row.
     * Gets called automatically by the {@link qx.ui.mobile.list.provider.Provider}.
     *
     */
    reset : function() {
      if (qx.core.Environment.get("qx.debug")) {
        throw new Error("Abstract method call");
      }
    },

    // overridden
    _getTagName : function()
    {
      return "li";
    },


    /**
     * Returns the row index of a certain DOM element in the list from the given event.
     *
     * @param evt {qx.event.type.Event} The causing event.
     * @return {Integer} the index of the row.
     */
    getRowIndexFromEvent : function(evt) {
      return this.getRowIndex(evt.getOriginalTarget());
    },


    /**
     * Returns the row index of a certain DOM element in the list.
     *
     * @param element {Element} DOM element to retrieve the index from.
     * @return {Integer} the index of the row.
     */
    getRowIndex : function(element)
    {
      while (element.tagName != "LI") {
        element = element.parentNode;
      }
      return qx.dom.Hierarchy.getElementIndex(element);
    },


    // property apply
    _applyShowArrow : function(value, old)
    {
      if (value) {
        this.addCssClass("arrow");
      } else {
        this.removeCssClass("arrow");
      }
    },


    // property apply
    _applySelected : function(value, old)
    {
      if (value) {
        this.addCssClass("selected");
      } else {
        this.removeCssClass("selected");
      }
    }
  }
});
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

/**
 * The default list item renderer. Used as the default renderer by the
 * {@link qx.ui.mobile.list.provider.Provider}. Configure the renderer
 * by setting the {@link qx.ui.mobile.list.List#delegate} property.
 *
 * *Example*
 *
 * Here is a little example of how to use the widget.
 *
 * <pre class='javascript'>
 *
 *   // Create the list with a delegate that
 *   // configures the list item.
 *   var list = new qx.ui.mobile.list.List({
 *     configureItem : function(item, data, row)
 *     {
 *       item.setImage("path/to/image.png");
 *       item.setTitle(data.title);
 *       item.setSubtitle(data.subtitle);
 *     }
 *   });
 * </pre>
 *
 * This example creates a list with a delegate that configures the list item with
 * the given data.
 */
qx.Class.define("qx.ui.mobile.list.renderer.Default",
{
  extend : qx.ui.mobile.list.renderer.Abstract,


 /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  construct : function(layout)
  {
    this.base(arguments, layout || new qx.ui.mobile.layout.HBox().set({
        alignY : "middle"
      }));
    this._init();
  },




 /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    __image : null,
    __title : null,
    __subtitle : null,
    __rightContainer : null,


    /**
     * Returns the image widget which is used for this renderer.
     *
     * @return {qx.ui.mobile.basic.Image} The image widget
     */
    getImageWidget : function() {
      return this.__image;
    },


    /**
     * Returns the title widget which is used for this renderer.
     *
     * @return {qx.ui.mobile.basic.Label} The title widget
     */
    getTitleWidget : function() {
      return this.__title;
    },


    /**
     * Returns the subtitle widget which is used for this renderer.
     *
     * @return {qx.ui.mobile.basic.Label} The subtitle widget
     */
    getSubtitleWidget : function()
    {
      return this.__subtitle;
    },


    /**
     * Sets the source of the image widget.
     *
     * @param source {String} The source to set
     */
    setImage : function(source)
    {
      this.__image.setSource(source);
    },


    /**
     * Sets the value of the title widget.
     *
     * @param title {String} The value to set
     */
    setTitle : function(title)
    {
      if (title && title.translate) {
        this.__title.setValue(title.translate());
      }
      else {
        this.__title.setValue(title);
      }
    },


    /**
     * Sets the value of the subtitle widget.
     *
     * @param subtitle {String} The value to set
     */
    setSubtitle : function(subtitle)
    {
      if (subtitle && subtitle.translate) {
        this.__subtitle.setValue(subtitle.translate());
      }
      else {
        this.__subtitle.setValue(subtitle);
      }
    },


    /**
     * Inits the widgets for the renderer.
     *
     */
    _init : function()
    {
      this.__image = this._createImage();
      this.add(this.__image);

      this.__rightContainer = this._createRightContainer();
      this.add(this.__rightContainer, {flex:1});

      this.__title = this._createTitle();
      this.__rightContainer.add(this.__title);

      this.__subtitle = this._createSubtitle();
      this.__rightContainer.add(this.__subtitle);
    },


    /**
     * Creates and returns the right container composite. Override this to adapt the widget code.
     *
     * @return {qx.ui.mobile.container.Composite} the right container.
     */
    _createRightContainer : function() {
      return new qx.ui.mobile.container.Composite(new qx.ui.mobile.layout.VBox());
    },


    /**
     * Creates and returns the image widget. Override this to adapt the widget code.
     *
     * @return {qx.ui.mobile.basic.Image} the image widget.
     */
    _createImage : function() {
      var image = new qx.ui.mobile.basic.Image();
      image.setAnonymous(true);
      image.addCssClass("list-itemimage");
      return image;
    },


    /**
     * Creates and returns the title widget. Override this to adapt the widget code.
     *
     * @return {qx.ui.mobile.basic.Label} the title widget.
     */
    _createTitle : function() {
      var title = new qx.ui.mobile.basic.Label();
      title.setWrap(false);
      title.addCssClass("list-itemlabel");
      return title;
    },


    /**
     * Creates and returns the subtitle widget. Override this to adapt the widget code.
     *
     * @return {qx.ui.mobile.basic.Label} the subtitle widget.
     */
    _createSubtitle : function() {
      var subtitle = new qx.ui.mobile.basic.Label();
      subtitle.setWrap(false);
      subtitle.addCssClass("subtitle");
      return subtitle;
    },


    // overridden
    reset : function()
    {
      this.__image.setSource(null);
      this.__title.setValue("");
      this.__subtitle.setValue("");
    }
  },

 /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function()
  {
    this._disposeObjects("__image", "__title", "__subtitle", "__rightContainer");
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2006 STZ-IDA, Germany, http://www.stz-ida.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Til Schneider (til132)

************************************************************************ */

/**
 * Superclass for formatters and parsers.
 */
qx.Interface.define("qx.util.format.IFormat",
{

  members :
  {
    /**
     * Formats an object.
     *
     * @abstract
     * @param obj {var} The object to format.
     * @return {String} the formatted object.
     * @throws {Error} the abstract function warning.
     */
    format : function(obj) {},


    /**
     * Parses an object.
     *
     * @abstract
     * @param str {String} the string to parse.
     * @return {var} the parsed object.
     * @throws {Error} the abstract function warning.
     */
    parse : function(str) {}
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2006 STZ-IDA, Germany, http://www.stz-ida.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Til Schneider (til132)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * A formatter and parser for dates, see
 * http://www.unicode.org/reports/tr35/#Date_Format_Patterns
 *
 * Here is a quick overview of the format pattern keys:
 * <table>
 * <tr><th>Key &nbsp;<th>Description
 * <tr><td><code> G </code><td> era, e.g. "AD"
 * <tr><td><code> y </code><td> year
 * <tr><td><code> Y </code><td> week year
 * <tr><td><code> u </code><td> extended year [Not supported yet]
 * <tr><td><code> Q </code><td> quarter
 * <tr><td><code> q </code><td> stand-alone quarter
 * <tr><td><code> M </code><td> month
 * <tr><td><code> L </code><td> stand-alone month
 * <tr><td><code> I </code><td> chinese leap month [Not supported yet]
 * <tr><td><code> w </code><td> week of year
 * <tr><td><code> W </code><td> week of month
 * <tr><td><code> d </code><td> day of month
 * <tr><td><code> D </code><td> day of year
 * <tr><td><code> F </code><td> day of week in month [Not supported yet]
 * <tr><td><code> g </code><td> modified Julian day [Not supported yet]
 * <tr><td><code> E </code><td> day of week
 * <tr><td><code> e </code><td> local day of week
 * <tr><td><code> c </code><td> stand-alone local day of week
 * <tr><td><code> a </code><td> period of day (am or pm)
 * <tr><td><code> h </code><td> 12-hour hour
 * <tr><td><code> H </code><td> 24-hour hour
 * <tr><td><code> K </code><td> hour [0-11]
 * <tr><td><code> k </code><td> hour [1-24]
 * <tr><td><code> j </code><td> special symbol [Not supported yet]
 * <tr><td><code> m </code><td> minute
 * <tr><td><code> s </code><td> second
 * <tr><td><code> S </code><td> fractional second
 * <tr><td><code> A </code><td> millisecond in day [Not supported yet]
 * <tr><td><code> z </code><td> time zone, specific non-location format
 * <tr><td><code> Z </code><td> time zone, rfc822/gmt format
 * <tr><td><code> v </code><td> time zone, generic non-location format [Not supported yet]
 * <tr><td><code> V </code><td> time zone, like z except metazone abbreviations [Not supported yet]
 * </table>
 *
 * (This list is preliminary, not all format keys might be implemented). Most
 * keys support repetitions that influence the meaning of the format. Parts of the
 * format string that should not be interpreted as format keys have to be
 * single-quoted.
 *
 * The same format patterns will be used for both parsing and output formatting.
 */
qx.Class.define("qx.util.format.DateFormat",
{
  extend : qx.core.Object,
  implement : qx.util.format.IFormat,



  /*
  *****************************************************************************
     CONSTRUCTOR
  *****************************************************************************
  */

  /**
   * @param format {String|null} The format to use. If null, the locale's default
   * format is used.
   * @param locale {String?} optional locale to be used. In case this is not present, the {@link #locale} property of DateFormat
   * will be following the {@link qx.locale.Manager#locale} property of qx.locale.Manager
   */
  construct : function(format, locale)
  {
    this.base(arguments);

    if (!locale)
    {
      this.__locale = qx.locale.Manager.getInstance().getLocale();
      this.__bindingId = qx.locale.Manager.getInstance().bind("locale", this, "locale");
    }
    else
    {
      this.__locale = locale;
      this.setLocale(locale);
    }

    this.__initialLocale = this.__locale;

    if (format != null)
    {
      this.__format = format.toString();
      if(this.__format in qx.util.format.DateFormat.ISO_MASKS)
      {
        if(this.__format === 'isoUtcDateTime') {
          this.__UTC = true;
        }
        this.__format = qx.util.format.DateFormat.ISO_MASKS[this.__format];
      }
    } else
    {
      this.__format = qx.locale.Date.getDateFormat("long", this.__locale) + " " + qx.locale.Date.getDateTimeFormat("HHmmss", "HH:mm:ss", this.__locale);
    }
  },


  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {

    /** The locale used in this DateFormat instance*/
    locale :
    {
      apply : "_applyLocale",
      nullable : true,
      check : "String"
    }
  },

  /*
  *****************************************************************************
     STATICS
  *****************************************************************************
  */

  statics :
  {
    /**
     * Convenience factory that returns a <code>DateFomat</code> instance that
     * uses a short date-only format. Beware that the overall layout of the
     * date/time format string is that of the locale in effect when the factory
     * function is called.
     *
     * Implemented as a quasi-singleton, so beware of side effects.
     *
     * @return {DateFormat} a DateFormat instance.
     */
    getDateInstance : function()
    {
      var DateFormat = qx.util.format.DateFormat;

      var format = qx.locale.Date.getDateFormat("short") + "";

      // Memoizing the instance, so caller doesn't have to dispose it.
      if (DateFormat._dateInstance == null || DateFormat._dateInstance.__format != format) {
        DateFormat._dateInstance = new DateFormat(format);
      }

      return DateFormat._dateInstance;
    },


    /**
     * Convenience factory that returns a <code>DateFomat</code> instance that
     * uses a long date/time format. Beware that the overall layout of the
     * date/time format string is that of the locale in effect when the factory
     * function is called.
     *
     * Implemented as a quasi-singleton, so beware of side effects.
     *
     * @return {DateFormat} a DateFormat instance.
     */
    getDateTimeInstance : function()
    {
      var DateFormat = qx.util.format.DateFormat;

      var format = qx.locale.Date.getDateFormat("long") + " " + qx.locale.Date.getDateTimeFormat("HHmmss", "HH:mm:ss");

      // Memoizing the instance, so caller doesn't have to dispose it.
      if (DateFormat._dateTimeInstance == null || DateFormat._dateTimeInstance.__format != format) {
        DateFormat._dateTimeInstance = new DateFormat(format);
      }

      return DateFormat._dateTimeInstance;
    },


    /**
     * @type {Integer} The threshold until when a year should be assumed to belong to the
     *   21st century (e.g. 12 -> 2012). Years over this threshold but below 100 will be
     *   assumed to belong to the 20th century (e.g. 88 -> 1988). Years over 100 will be
     *   used unchanged (e.g. 1792 -> 1792).
     */
    ASSUME_YEAR_2000_THRESHOLD : 30,

    /** @type {Map} Special masks of patterns that are used frequently*/
    ISO_MASKS : {
      isoDate :        "yyyy-MM-dd",
      isoTime :        "HH:mm:ss",
      isoDateTime :    "yyyy-MM-dd'T'HH:mm:ss",
      isoUtcDateTime : "yyyy-MM-dd'T'HH:mm:ss'Z'"
    },

    /** @type {String} The am marker. */
    AM_MARKER : "am",

    /** @type {String} The pm marker. */
    PM_MARKER : "pm"

  },




  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    __bindingId : null,
    __locale : null,
    __initialLocale : null,
    __format : null,
    __parseFeed : null,
    __parseRules : null,
    __formatTree : null,
    __UTC : null,

    /**
     * Fills a number with leading zeros ("25" -> "0025").
     *
     * @param number {Integer} the number to fill.
     * @param minSize {Integer} the minimum size the returned string should have.
     * @return {String} the filled number as string.
     */
    __fillNumber : function(number, minSize)
    {
      var str = "" + (number < 0 ? ((-1) * number) : number);

      while (str.length < minSize) {
        str = "0" + str;
      }

      return number < 0 ? "-" + str : str;
    },


    /**
     * Returns the day in year of a date.
     *
     * @param date {Date} the date.
     * @return {Integer} the day in year.
     */
    __getDayInYear : function(date)
    {
      var helpDate = new Date(date.getTime());
      var day = helpDate.getDate();

      while (helpDate.getMonth() != 0)
      {
        // Set the date to the last day of the previous month
        helpDate.setDate(-1);
        day += helpDate.getDate() + 1;
      }

      return day;
    },


    /**
     * Returns the thursday in the same week as the date.
     *
     * @param date {Date} the date to get the thursday of.
     * @return {Date} the thursday in the same week as the date.
     */
    __thursdayOfSameWeek : function(date) {
      return new Date(date.getTime() + (3 - ((date.getDay() + 6) % 7)) * 86400000);
    },


    /**
     * Returns the week in year of a date.
     *
     * @param date {Date} the date to get the week in year of.
     * @return {Integer} the week in year.
     */
    __getWeekInYear : function(date)
    {
      // The following algorithm comes from http://www.salesianer.de/util/kalwoch.html
      // Get the thursday of the week the date belongs to
      var thursdayDate = this.__thursdayOfSameWeek(date);

      // Get the year the thursday (and therefore the week) belongs to
      var weekYear = thursdayDate.getFullYear();

      // Get the thursday of the week january 4th belongs to
      // (which defines week 1 of a year)
      var thursdayWeek1 = this.__thursdayOfSameWeek(new Date(weekYear, 0, 4));

      // Calculate the calendar week
      return Math.floor(1.5 + (thursdayDate.getTime() - thursdayWeek1.getTime()) / 86400000 / 7);
    },

    /**
     * Returns the week in month of a date.
     *
     * @param date {Date} the date to get the week in year of.
     * @return {Integer} the week in month.
     */
    __getWeekInMonth : function(date)
    {
      var thursdayDate = this.__thursdayOfSameWeek(date);
      var thursdayWeek1 = this.__thursdayOfSameWeek(new Date(date.getFullYear(), date.getMonth(), 4));
      return Math.floor(1.5 + (thursdayDate.getTime() - thursdayWeek1.getTime()) / 86400000 / 7);
    },

    /**
     * Returns the week year of a date. (that is the year of the week where this date happens to be)
     * For a week in the middle of the summer, the year is easily obtained, but for a week
     * when New Year's Eve takes place, the year of that week is ambigous.
     * The thursday day of that week is used to determine the year.
     *
     * @param date {Date} the date to get the week in year of.
     * @return {Integer} the week year.
     */
    __getWeekYear : function(date)
    {
      var thursdayDate = this.__thursdayOfSameWeek(date);
      return thursdayDate.getFullYear();
    },

    /**
     * Returns true if the year is a leap one.
     *
     * @param year {Integer} the year to check.
     * @return {Boolean} true if it is a leap year.
     */
    __isLeapYear : function(year)
    {
      var februaryDate = new Date(year,2,1);
      februaryDate.setDate(-1);
      return februaryDate.getDate() + 1 === 29;
    },

    /**
     * Returns a json object with month and day as keys.
     *
     * @param dayOfYear {Integer} the day of year.
     * @param year {Integer} the year to check.
     * @return {Object} a json object {month: M, day: D}.
     */
    __getMonthAndDayFromDayOfYear : function(dayOfYear,year)
    {
      var month = 0;
      var day = 0;
      // if we don't know the year, we take a non-leap year'
      if(!year) {
        year = 1971;
      }
      var dayCounter = 0;
      for(var i=1; i <= 12; i++)
      {
        var tempDate = new Date(year,i,1);
        tempDate.setDate(-1);
        var days = tempDate.getDate() + 1;
        dayCounter += days;
        if(dayCounter < dayOfYear)
        {
          month++;
          day += days;
        }
        else
        {
          day = dayOfYear - (dayCounter-days);
          break;
        }
      }

      return {month: month,day: day};
    },

    /**
     * Returns the year of a date when we know the week year
     *
     * @param weekYear {Integer} the week year.
     * @param month {Integer} the month
     * @param dayOfMonth {Integer} the day in month
     * @return {Integer} the year.
     */
    __getYearFromWeekYearAndMonth : function(weekYear, month, dayOfMonth)
    {
      var year;
      switch(month){
        case 11 :
          year = weekYear - 1;
          if (weekYear != this.__getWeekYear(new Date(year,month,dayOfMonth))) {
            year = weekYear;
          }
        break;
        case 0 :
          year = weekYear + 1;
          if (weekYear != this.__getWeekYear(new Date(year,month,dayOfMonth))) {
            year = weekYear;
          }
        break;
        default :
          year = weekYear;
      }
      return year;
    },

    /**
     * Applies the new value for locale property
     * @param value {String} The new value.
     * @param old {String} The old value.
     *
     */
    _applyLocale : function(value, old)
    {
      this.__locale = value === null ? this.setLocale(this.__initialLocale) : value;
    },

    /**
     * Formats a date.
     *
     * @param date {Date} The date to format.
     * @return {String} the formatted date.
     */
    format : function(date)
    {
      // check for null dates
      if (date == null) {
        return null;
      }

      if(isNaN(date.getTime())) {
        if (qx.core.Environment.get("qx.debug")) {
          qx.log.Logger.error("Provided date is invalid");
        }
        return null;
      }

      if(this.__UTC) {
        date = new Date(date.getUTCFullYear(),date.getUTCMonth(),date.getUTCDate(),date.getUTCHours(),date.getUTCMinutes(),date.getUTCSeconds(),date.getUTCMilliseconds());
      }

      var locale = this.__locale;

      var fullYear = date.getFullYear();
      var month = date.getMonth();
      var dayOfMonth = date.getDate();
      var dayOfWeek = date.getDay();
      var hours = date.getHours();
      var minutes = date.getMinutes();
      var seconds = date.getSeconds();
      var ms = date.getMilliseconds();

      var timezoneOffset = date.getTimezoneOffset();
      var timezoneSign = timezoneOffset > 0 ? 1 : -1;
      var timezoneHours = Math.floor(Math.abs(timezoneOffset) / 60);
      var timezoneMinutes = Math.abs(timezoneOffset) % 60;

      // Create the output
      this.__initFormatTree();
      var output = "";

      for (var i=0; i<this.__formatTree.length; i++)
      {
        var currAtom = this.__formatTree[i];

        if (currAtom.type == "literal") {
          output += currAtom.text;
        }
        else
        {
          // This is a wildcard
          var wildcardChar = currAtom.character;
          var wildcardSize = currAtom.size;

          // Get its replacement
          var replacement = "?";

          switch(wildcardChar)
          {
            case 'y': // Year
              if (wildcardSize == 2) {
                replacement = this.__fillNumber(fullYear % 100, 2);
              } else {
                var year = Math.abs(fullYear);
                replacement = year + "";
                if (wildcardSize > replacement.length) {
                  for (var j = replacement.length; j < wildcardSize; j++) {
                    replacement = "0" + replacement;
                  }
                }
                if(fullYear < 0) {
                  replacement = "-" + replacement;
                }
              }

              break;

            case 'Y': // Year
              replacement = this.__getWeekYear(date) + "";
              var year = replacement.replace('-','');
              if (wildcardSize > replacement.length) {
                for (var j = year.length; j < wildcardSize; j++) {
                  year = "0" + year;
                }
              }
              replacement = replacement.indexOf("-") != -1 ? "-" + year : year;

              break;

            case 'G': // Era - there is no CLDR data for ERA yet
              if (wildcardSize >= 1 && wildcardSize <= 3) {
                replacement = fullYear > 0 ? 'AD' : 'BC';
              }
              else if(wildcardSize == 4) {
                replacement = fullYear > 0 ? 'Anno Domini' : 'Before Christ';
              }
              else if(wildcardSize == 5) {
                replacement = fullYear > 0 ? 'A' : 'B';
              }

              break;

            case 'Q': // quarter
              if (wildcardSize == 1 || wildcardSize == 2) {
                replacement = this.__fillNumber(parseInt(month/4) + 1, wildcardSize);
              }
              if(wildcardSize == 3) {
                replacement = 'Q' + (parseInt(month/4) + 1);
              }

              break;

            case 'q': // quarter stand alone
              if (wildcardSize == 1 || wildcardSize == 2) {
                replacement = this.__fillNumber(parseInt(month/4) + 1, wildcardSize);
              }
              if(wildcardSize == 3) {
                replacement = 'Q' + (parseInt(month/4) + 1);
              }

              break;

            case 'D': // Day in year (e.g. 189)
              replacement = this.__fillNumber(this.__getDayInYear(date), wildcardSize);
              break;

            case 'd': // Day in month
              replacement = this.__fillNumber(dayOfMonth, wildcardSize);
              break;

            case 'w': // Week in year (e.g. 27)
              replacement = this.__fillNumber(this.__getWeekInYear(date), wildcardSize);
              break;

            case 'W': // Week in year (e.g. 27)
              replacement = this.__getWeekInMonth(date);
              break;

            case 'E': // Day in week
              if (wildcardSize >= 1 && wildcardSize <= 3) {
                replacement = qx.locale.Date.getDayName("abbreviated", dayOfWeek, locale, "format", true);
              } else if (wildcardSize == 4) {
                replacement = qx.locale.Date.getDayName("wide", dayOfWeek, locale, "format", true);
              } else if (wildcardSize == 5) {
                replacement = qx.locale.Date.getDayName("narrow", dayOfWeek, locale, "format", true);
              }

              break;

            case 'e': // Day in week
              var startOfWeek = qx.locale.Date.getWeekStart(locale);
              // the index is 1 based
              var localeDayOfWeek = 1 + ((dayOfWeek - startOfWeek >=0) ? (dayOfWeek - startOfWeek) : 7 + (dayOfWeek-startOfWeek));
              if (wildcardSize >= 1 && wildcardSize <= 2) {
                replacement = this.__fillNumber(localeDayOfWeek, wildcardSize);
              } else if (wildcardSize == 3) {
                replacement = qx.locale.Date.getDayName("abbreviated", dayOfWeek, locale, "format", true);
              } else if (wildcardSize == 4) {
                replacement = qx.locale.Date.getDayName("wide", dayOfWeek, locale, "format", true);
              } else if (wildcardSize == 5) {
                replacement = qx.locale.Date.getDayName("narrow", dayOfWeek, locale, "format", true);
              }

              break;

            case 'c': // Stand-alone local day in week
              var startOfWeek = qx.locale.Date.getWeekStart(locale);
              // the index is 1 based
              var localeDayOfWeek = 1 + ((dayOfWeek - startOfWeek >=0) ? (dayOfWeek - startOfWeek) : 7 + (dayOfWeek-startOfWeek));
              if (wildcardSize == 1) {
                replacement = ''+localeDayOfWeek;
              } else if (wildcardSize == 3) {
                replacement = qx.locale.Date.getDayName("abbreviated", dayOfWeek, locale, "stand-alone", true);
              } else if (wildcardSize == 4) {
                replacement = qx.locale.Date.getDayName("wide", dayOfWeek, locale, "stand-alone", true);
              } else if (wildcardSize == 5) {
                replacement = qx.locale.Date.getDayName("narrow", dayOfWeek, locale, "stand-alone", true);
              }

              break;

            case 'M': // Month
              if (wildcardSize == 1 || wildcardSize == 2) {
                replacement = this.__fillNumber(month + 1, wildcardSize);
              } else if (wildcardSize == 3) {
                replacement = qx.locale.Date.getMonthName("abbreviated", month, locale, "format", true);
              } else if (wildcardSize == 4) {
                replacement = qx.locale.Date.getMonthName("wide", month, locale, "format", true);
              } else if (wildcardSize == 5) {
                replacement = qx.locale.Date.getMonthName("narrow", month, locale, "format", true);

              }

              break;

            case 'L': // Stand-alone month
              if (wildcardSize == 1 || wildcardSize == 2) {
                replacement = this.__fillNumber(month + 1, wildcardSize);
              } else if (wildcardSize == 3) {
                replacement = qx.locale.Date.getMonthName("abbreviated", month, locale, "stand-alone", true);
              } else if (wildcardSize == 4) {
                replacement = qx.locale.Date.getMonthName("wide", month, locale, "stand-alone", true);
              } else if (wildcardSize == 5) {
                replacement = qx.locale.Date.getMonthName("narrow", month, locale, "stand-alone", true);
              }

              break;

            case 'a': // am/pm marker
              // NOTE: 0:00 is am, 12:00 is pm
              replacement = (hours < 12) ? qx.locale.Date.getAmMarker(locale) : qx.locale.Date.getPmMarker(locale);
              break;

            case 'H': // Hour in day (0-23)
              replacement = this.__fillNumber(hours, wildcardSize);
              break;

            case 'k': // Hour in day (1-24)
              replacement = this.__fillNumber((hours == 0) ? 24 : hours, wildcardSize);
              break;

            case 'K': // Hour in am/pm (0-11)
              replacement = this.__fillNumber(hours % 12, wildcardSize);
              break;

            case 'h': // Hour in am/pm (1-12)
              replacement = this.__fillNumber(((hours % 12) == 0) ? 12 : (hours % 12), wildcardSize);
              break;

            case 'm': // Minute in hour
              replacement = this.__fillNumber(minutes, wildcardSize);
              break;

            case 's': // Second in minute
              replacement = this.__fillNumber(seconds, wildcardSize);
              break;

            case 'S': // Fractional second
              replacement = this.__fillNumber(ms, 3);
              if (wildcardSize < replacement.length) {
                replacement = replacement.substr(0, wildcardSize);
              } else {
                while (wildcardSize > replacement.length) {
                  // if needed, fill the remaining wildcard length with trailing zeros
                  replacement += "0";
                }
              }
              break;

            case 'z': // Time zone
              if (wildcardSize >= 1 && wildcardSize <= 4)
              {
                replacement =
                "GMT" +
                ((timezoneSign > 0) ? "-" : "+") +
                this.__fillNumber(Math.abs(timezoneHours), 2) +
                ":" + this.__fillNumber(timezoneMinutes, 2);
              }

              break;

            case 'Z': // RFC 822 time zone
              if (wildcardSize >= 1 && wildcardSize <= 3)
              {
              replacement =
                ((timezoneSign > 0) ? "-" : "+") +
                this.__fillNumber(Math.abs(timezoneHours), 2) +
                this.__fillNumber(timezoneMinutes, 2);
              }
              else
              {
                replacement =
                "GMT" +
                ((timezoneSign > 0) ? "-" : "+") +
                this.__fillNumber(Math.abs(timezoneHours), 2) +
                ":" + this.__fillNumber(timezoneMinutes, 2);
              }
              break;
          }

          output += replacement;
        }
      }

      return output;
    },


    /**
     * Parses a date.
     *
     * @param dateStr {String} the date to parse.
     * @return {Date} the parsed date.
     * @throws {Error} If the format is not well formed or if the date string does not
     *       match to the format.
     */
    parse : function(dateStr)
    {
      this.__initParseFeed();

      // Apply the regex
      var hit = this.__parseFeed.regex.exec(dateStr);

      if (hit == null) {
        throw new Error("Date string '" + dateStr + "' does not match the date format: " + this.__format);
      }

      // Apply the rules
      var dateValues =
      {
        era         : 1,
        year        : 1970,
        quarter     : 1,
        month       : 0,
        day         : 1,
        dayOfYear   : 1,
        hour        : 0,
        ispm        : false,
        weekDay     : 4,
        weekYear    : 1970,
        weekOfMonth : 1,
        weekOfYear  : 1,
        min         : 0,
        sec         : 0,
        ms          : 0
      };

      var currGroup = 1;
      var applyWeekYearAfterRule = false;
      var applyDayOfYearAfterRule = false;

      for (var i=0; i<this.__parseFeed.usedRules.length; i++)
      {
        var rule = this.__parseFeed.usedRules[i];

        var value = hit[currGroup];

        if (rule.field != null) {
          dateValues[rule.field] = parseInt(value, 10);
        } else {
          rule.manipulator(dateValues, value, rule.pattern);
        }

        if(rule.pattern == "Y+")
        {
          var yearRuleApplied = false;
          for(var k=0; k<this.__parseFeed.usedRules.length; k++) {
            if(this.__parseFeed.usedRules[k].pattern == 'y+'){
              yearRuleApplied = true;
              break;
            }
          }
          if(!yearRuleApplied) {
            applyWeekYearAfterRule = true;
          }
        }

        if(rule.pattern.indexOf("D") != -1)
        {
          var dayRuleApplied = false;
          for(var k=0; k<this.__parseFeed.usedRules.length; k++) {
            if(this.__parseFeed.usedRules[k].pattern.indexOf("d") != -1){
              dayRuleApplied = true;
              break;
            }
          }
          if(!dayRuleApplied) {
            applyDayOfYearAfterRule = true;
          }
        }

        currGroup += (rule.groups == null) ? 1 : rule.groups;
      }
      if(applyWeekYearAfterRule) {
        dateValues.year = this.__getYearFromWeekYearAndMonth(dateValues.weekYear,dateValues.month,dateValues.day);
      }

      if(applyDayOfYearAfterRule)
      {
        var dayAndMonth = this.__getMonthAndDayFromDayOfYear(dateValues.dayOfYear, dateValues.year);
        dateValues.month = dayAndMonth.month;
        dateValues.day = dayAndMonth.day;
      }

      if(dateValues.era < 0 && (dateValues.year * dateValues.era < 0)) {
        dateValues.year = dateValues.year * dateValues.era;
      }

      var date = new Date(dateValues.year, dateValues.month, dateValues.day, (dateValues.ispm) ? (dateValues.hour + 12) : dateValues.hour, dateValues.min, dateValues.sec, dateValues.ms);

      if(this.__UTC) {
        date = new Date(date.getUTCFullYear(),date.getUTCMonth(),date.getUTCDate(),date.getUTCHours(),date.getUTCMinutes(),date.getUTCSeconds(),date.getUTCMilliseconds());
      }

      if (dateValues.month != date.getMonth() || dateValues.year != date.getFullYear()) {
        throw new Error("Error parsing date '" + dateStr + "': the value for day or month is too large");
      }

      return date;
    },


    /**
     * Helper method for {@link #format()} and {@link #parse()}.
     * Parses the date format.
     *
     */
    __initFormatTree : function()
    {
      if (this.__formatTree != null) {
        return;
      }

      this.__formatTree = [];

      var currWildcardChar;
      var currWildcardSize = 0;
      var currLiteral = "";
      var format = this.__format;

      var state = "default";

      var i = 0;

      while (i < format.length)
      {
        var currChar = format.charAt(i);

        switch(state)
        {
          case "quoted_literal":
            // We are now inside a quoted literal
            // Check whether the current character is an escaped "'" character
            if (currChar == "'")
            {
              if (i + 1 >= format.length)
              {

                // this is the last character
                i++;

                break;
              }

              var lookAhead = format.charAt(i + 1);

              if (lookAhead == "'")
              {
                currLiteral += currChar;
                i++;
              }
              else
              {

                // quoted literal ends
                i++;

                state = "unkown";
              }
            }
            else
            {
              currLiteral += currChar;
              i++;
            }

            break;

          case "wildcard":
            // Check whether the currChar belongs to that wildcard
            if (currChar == currWildcardChar)
            {
              // It does -> Raise the size
              currWildcardSize++;

              i++;
            }
            else
            {
              // It does not -> The current wildcard is done
              this.__formatTree.push(
              {
                type      : "wildcard",
                character : currWildcardChar,
                size      : currWildcardSize
              });

              currWildcardChar = null;
              currWildcardSize = 0;
              state = "default";
            }

            break;

          default:
            // We are not (any more) in a wildcard or quoted literal -> Check what's starting here
            if ((currChar >= 'a' && currChar <= 'z') || (currChar >= 'A' && currChar <= 'Z'))
            {
              // This is a letter -> All letters are wildcards
              // Start a new wildcard
              currWildcardChar = currChar;
              state = "wildcard";
            }
            else if (currChar == "'")
            {
              if (i + 1 >= format.length)
              {
                // this is the last character
                currLiteral += currChar;
                i++;
                break;
              }

              var lookAhead = format.charAt(i + 1);

              if (lookAhead == "'")
              {
                currLiteral += currChar;
                i++;
              }

              i++;
              state = "quoted_literal";
            }
            else
            {
              state = "default";
            }

            if (state != "default")
            {
              // Add the literal
              if (currLiteral.length > 0)
              {
                this.__formatTree.push(
                {
                  type : "literal",
                  text : currLiteral
                });

                currLiteral = "";
              }
            }
            else
            {
              // This is an unquoted literal -> Add it to the current literal
              currLiteral += currChar;
              i++;
            }

            break;
        }
      }

      // Add the last wildcard or literal
      if (currWildcardChar != null)
      {
        this.__formatTree.push(
        {
          type      : "wildcard",
          character : currWildcardChar,
          size      : currWildcardSize
        });
      }
      else if (currLiteral.length > 0)
      {
        this.__formatTree.push(
        {
          type : "literal",
          text : currLiteral
        });
      }
    },


    /**
     * Initializes the parse feed.
     *
     * The parse contains everything needed for parsing: The regular expression
     * (in compiled and uncompiled form) and the used rules.
     *
     * @throws {Error} If the date format is malformed.
     */
    __initParseFeed : function()
    {
      if (this.__parseFeed != null)
      {
        // We already have the parse feed
        return;
      }

      var format = this.__format;

      // Initialize the rules
      this.__initParseRules();
      this.__initFormatTree();

      // Get the used rules and construct the regex pattern
      var usedRules = [];
      var pattern = "^";

      for (var atomIdx=0; atomIdx<this.__formatTree.length; atomIdx++)
      {
        var currAtom = this.__formatTree[atomIdx];

        if (currAtom.type == "literal") {
          pattern += qx.lang.String.escapeRegexpChars(currAtom.text);
        }
        else
        {
          // This is a wildcard
          var wildcardChar = currAtom.character;
          var wildcardSize = currAtom.size;

          // Get the rule for this wildcard
          var wildcardRule;

          for (var ruleIdx=0; ruleIdx<this.__parseRules.length; ruleIdx++)
          {
            var rule = this.__parseRules[ruleIdx];

            if ( this.__isRuleForWildcard(rule,wildcardChar,wildcardSize))
            {
              // We found the right rule for the wildcard
              wildcardRule = rule;
              break;
            }
          }

          // Check the rule
          if (wildcardRule == null)
          {
            // We have no rule for that wildcard -> Malformed date format
            var wildcardStr = "";

            for (var i=0; i<wildcardSize; i++) {
              wildcardStr += wildcardChar;
            }

            throw new Error("Malformed date format: " + format + ". Wildcard " + wildcardStr + " is not supported");
          }
          else
          {
            // Add the rule to the pattern
            usedRules.push(wildcardRule);
            pattern += wildcardRule.regex;
          }
        }
      }

      pattern += "$";

      // Create the regex
      var regex;

      try {
        regex = new RegExp(pattern);
      } catch(exc) {
        throw new Error("Malformed date format: " + format);
      }

      // Create the this.__parseFeed
      this.__parseFeed =
      {
        regex       : regex,
        "usedRules" : usedRules,
        pattern     : pattern
      };
    },

    /**
     * Checks wether the rule matches the wildcard or not.
     * @param rule {Object} the rule we try to match with the wildcard
     * @param wildcardChar {String} the character in the wildcard
     * @param wildcardSize {Integer} the number of  wildcardChar characters in the wildcard
     * @return {Boolean} if the rule matches or not
     */
    __isRuleForWildcard : function(rule, wildcardChar, wildcardSize)
    {
      if(wildcardChar==='y' && rule.pattern==='y+')
      {
        rule.regex = rule.regexFunc(wildcardSize);
        return true;
      }
      else if(wildcardChar==='Y' && rule.pattern==='Y+')
      {
        rule.regex = rule.regexFunc(wildcardSize);
        return true;
      }
      else
      {
        return wildcardChar == rule.pattern.charAt(0) && wildcardSize == rule.pattern.length;
      }
    },
    /**
     * Initializes the static parse rules.
     *
     */
    __initParseRules : function()
    {
      var DateFormat = qx.util.format.DateFormat;
      var LString = qx.lang.String;

      if (this.__parseRules != null)
      {
        // The parse rules are already initialized
        return ;
      }

      var rules = this.__parseRules = [];

      var amMarker = qx.locale.Date.getAmMarker(this.__locale).toString() || DateFormat.AM_MARKER;
      var pmMarker = qx.locale.Date.getPmMarker(this.__locale).toString() || DateFormat.PM_MARKER;
      var locale = this.__locale;

      var yearManipulator = function(dateValues, value)
      {
        value = parseInt(value, 10);

        if(value > 0)
        {
          if (value < DateFormat.ASSUME_YEAR_2000_THRESHOLD) {
            value += 2000;
          } else if (value < 100) {
            value += 1900;
          }
        }

        dateValues.year = value;
      };

      var weekYearManipulator = function(dateValues, value)
      {
        value = parseInt(value, 10);

        if(value > 0)
        {
          if (value < DateFormat.ASSUME_YEAR_2000_THRESHOLD) {
            value += 2000;
          } else if (value < 100) {
            value += 1900;
          }
        }

        dateValues.weekYear = value;
      };

      var monthManipulator = function(dateValues, value) {
        dateValues.month = parseInt(value, 10) - 1;
      };

      var localWeekDayManipulator = function(dateValues, value) {
        var startOfWeek = qx.locale.Date.getWeekStart(locale);
        var dayOfWeek =  (parseInt(value,10) - 1 + startOfWeek) <= 6 ? parseInt(value,10) - 1 + startOfWeek : (parseInt(value,10) - 1 + startOfWeek) -7;
        dateValues.weekDay = dayOfWeek;
      };

      var ampmManipulator = function(dateValues, value) {
        var pmMarker = qx.locale.Date.getPmMarker(locale).toString() || DateFormat.PM_MARKER;
        dateValues.ispm = (value == pmMarker);
      };

      var noZeroHourManipulator = function(dateValues, value) {
        dateValues.hour = parseInt(value, 10) % 24;
      };

      var noZeroAmPmHourManipulator = function(dateValues, value) {
        dateValues.hour = parseInt(value, 10) % 12;
      };

      var ignoreManipulator = function(dateValues, value) {
        return;
      };

      var narrowEraNames = ['A', 'B'];
      var narrowEraNameManipulator = function(dateValues, value) {
        dateValues.era = value == 'A' ? 1 : -1;
      };

      var abbrevEraNames = ['AD', 'BC'];
      var abbrevEraNameManipulator = function(dateValues, value) {
        dateValues.era = value == 'AD' ? 1 : -1;
      };

      var fullEraNames = ['Anno Domini', 'Before Christ'];
      var fullEraNameManipulator = function(dateValues, value) {
        dateValues.era = value == 'Anno Domini' ? 1 : -1;
      };

      var abbrevQuarterNames = ['Q1','Q2','Q3','Q4'];
      var abbrevQuarterManipulator = function(dateValues, value) {
        dateValues.quarter = abbrevQuarterNames.indexOf(value);
      };

      var fullQuarterNames = ['1st quarter','2nd quarter','3rd quarter','4th quarter'];
      var fullQuarterManipulator = function(dateValues, value) {
        dateValues.quarter = fullQuarterNames.indexOf(value);
      };

      var cache = {};

      var dateNamesManipulator = function(pattern){
        var monthPatternLetters = ['L','M'];
        var dayPatternLetters = ['c', 'e', 'E'];
        var firstLetterInPattern = pattern.charAt(0);
        var isMonth = monthPatternLetters.indexOf(firstLetterInPattern)>=0;

        var getContext = function() {
          var letters = isMonth ? monthPatternLetters : dayPatternLetters;
          var context = firstLetterInPattern === letters[0] ? "stand-alone" : "format" ;
          var patternLength = pattern.length;
          var lengthName = 'abbreviated';
          switch(patternLength)
          {
            case 4:
              lengthName = 'wide';
              break;
            case 5:
              lengthName = 'narrow';
              break;
            default:
              lengthName = 'abbreviated';
          }
          return [context, lengthName];
        };

        if(!cache[pattern])
        {
          cache[pattern] = {};
          var context = getContext();
          var func = isMonth ? qx.locale.Date.getMonthNames : qx.locale.Date.getDayNames;
          var names = func.call(qx.locale.Date, context[1], locale, context[0], true);
          for(var i=0, l=names.length; i<l; i++)
          {
            names[i] = LString.escapeRegexpChars(names[i].toString());
          }
          cache[pattern].data = names;
          cache[pattern].func = function(dateValues, value)
          {
            value = LString.escapeRegexpChars(value);
            dateValues[isMonth ? 'month' : 'weekDay'] = names.indexOf(value);
          }
        }

        return cache[pattern];
      };

      // Unsupported: F (Day of week in month)

      rules.push(
      {
        pattern     : "y+",
        regexFunc       : function(yNumber)
          {
            var regex = "(-*";
            for(var i=0;i<yNumber;i++)
            {
              regex += "\\d";
              if(i===yNumber-1 && i!==1) {
                regex += "+?";
              }
            }
            regex += ")";
            return regex;
          },
        manipulator : yearManipulator
      });

      rules.push(
      {
        pattern     : "Y+",
        regexFunc       : function(yNumber)
          {
            var regex = "(-*";
            for(var i=0;i<yNumber;i++)
            {
              regex += "\\d";
              if(i===yNumber-1) {
                regex += "+?";
              }
            }
            regex += ")";
            return regex;
          },
        manipulator : weekYearManipulator
      });

      rules.push(
      {
        pattern     : "G",
        regex       : "(" + abbrevEraNames.join("|") + ")",
        manipulator : abbrevEraNameManipulator
      });

      rules.push(
      {
        pattern     : "GG",
        regex       : "(" + abbrevEraNames.join("|") + ")",
        manipulator : abbrevEraNameManipulator
      });

      rules.push(
      {
        pattern     : "GGG",
        regex       : "(" + abbrevEraNames.join("|") + ")",
        manipulator : abbrevEraNameManipulator
      });

      rules.push(
      {
        pattern     : "GGGG",
        regex       : "(" + fullEraNames.join("|") + ")",
        manipulator : fullEraNameManipulator
      });

      rules.push(
      {
        pattern     : "GGGGG",
        regex       : "(" + narrowEraNames.join("|") + ")",
        manipulator : narrowEraNameManipulator
      });

      rules.push(
      {
        pattern     : "Q",
        regex       : "(\\d\\d*?)",
        field : "quarter"
      });

      rules.push(
      {
        pattern     : "QQ",
        regex       : "(\\d\\d?)",
        field : "quarter"
      });

      rules.push(
      {
        pattern     : "QQQ",
        regex       : "(" + abbrevQuarterNames.join("|") + ")",
        manipulator : abbrevQuarterManipulator
      });

      rules.push(
      {
        pattern     : "QQQQ",
        regex       : "(" + fullQuarterNames.join("|") + ")",
        manipulator : fullQuarterManipulator
      });

      rules.push(
      {
        pattern     : "q",
        regex       : "(\\d\\d*?)",
        field : "quarter"
      });

      rules.push(
      {
        pattern     : "qq",
        regex       : "(\\d\\d?)",
        field : "quarter"
      });

      rules.push(
      {
        pattern     : "qqq",
        regex       : "(" + abbrevQuarterNames.join("|") + ")",
        manipulator : abbrevQuarterManipulator
      });

      rules.push(
      {
        pattern     : "qqqq",
        regex       : "(" + fullQuarterNames.join("|") + ")",
        manipulator : fullQuarterManipulator
      });

      rules.push(
      {
        pattern     : "M",
        regex       : "(\\d\\d*?)",
        manipulator : monthManipulator
      });

      rules.push(
      {
        pattern     : "MM",
        regex       : "(\\d\\d?)",
        manipulator : monthManipulator
      });

      rules.push(
      {
        pattern     : "MMM",
        regex       : "(" + dateNamesManipulator("MMM").data.join("|") + ")",
        manipulator : dateNamesManipulator("MMM").func
      });

      rules.push(
      {
        pattern     : "MMMM",
        regex       : "(" + dateNamesManipulator("MMMM").data.join("|") + ")",
        manipulator : dateNamesManipulator("MMMM").func
      });

      rules.push(
      {
        pattern     : "MMMMM",
        regex       : "(" + dateNamesManipulator("MMMMM").data.join("|") + ")",
        manipulator : dateNamesManipulator("MMMMM").func
      });

      rules.push(
      {
        pattern     : "L",
        regex       : "(\\d\\d*?)",
        manipulator : monthManipulator
      });

      rules.push(
      {
        pattern     : "LL",
        regex       : "(\\d\\d?)",
        manipulator : monthManipulator
      });

      rules.push(
      {
        pattern     : "LLL",
        regex       : "(" + dateNamesManipulator("LLL").data.join("|") + ")",
        manipulator : dateNamesManipulator("LLL").func
      });

      rules.push(
      {
        pattern     : "LLLL",
        regex       : "(" + dateNamesManipulator("LLLL").data.join("|") + ")",
        manipulator : dateNamesManipulator("LLLL").func
      });

      rules.push(
      {
        pattern     : "LLLLL",
        regex       : "(" + dateNamesManipulator("LLLLL").data.join("|") + ")",
        manipulator : dateNamesManipulator("LLLLL").func
      });

      rules.push(
      {
        pattern : "dd",
        regex   : "(\\d\\d?)",
        field   : "day"
      });

      rules.push(
      {
        pattern : "d",
        regex   : "(\\d\\d*?)",
        field   : "day"
      });

      rules.push(
      {
        pattern : "D",
        regex   : "(\\d?)",
        field   : "dayOfYear"
      });

      rules.push(
      {
        pattern : "DD",
        regex   : "(\\d\\d?)",
        field   : "dayOfYear"
      });

      rules.push(
      {
        pattern : "DDD",
        regex   : "(\\d\\d\\d?)",
        field   : "dayOfYear"
      });

      rules.push(
      {
        pattern     : "E",
        regex       : "(" + dateNamesManipulator("E").data.join("|") + ")",
        manipulator : dateNamesManipulator("E").func
      });

      rules.push(
      {
        pattern     : "EE",
        regex       : "(" + dateNamesManipulator("EE").data.join("|") + ")",
        manipulator : dateNamesManipulator("EE").func
      });

      rules.push(
      {
        pattern     : "EEE",
        regex       : "(" + dateNamesManipulator("EEE").data.join("|") + ")",
        manipulator : dateNamesManipulator("EEE").func
      });

      rules.push(
      {
        pattern     : "EEEE",
        regex       : "(" + dateNamesManipulator("EEEE").data.join("|") + ")",
        manipulator : dateNamesManipulator("EEEE").func
      });

      rules.push(
      {
        pattern     : "EEEEE",
        regex       : "(" + dateNamesManipulator("EEEEE").data.join("|") + ")",
        manipulator : dateNamesManipulator("EEEEE").func
      });

      rules.push(
      {
        pattern     : "e",
        regex       : "(\\d?)",
        manipulator : localWeekDayManipulator
      });

      rules.push(
      {
        pattern     : "ee",
        regex       : "(\\d\\d?)",
        manipulator : localWeekDayManipulator
      });

      rules.push(
      {
        pattern     : "eee",
        regex       : "(" + dateNamesManipulator("eee").data.join("|") + ")",
        manipulator : dateNamesManipulator("eee").func
      });

      rules.push(
      {
        pattern     : "eeee",
        regex       : "(" + dateNamesManipulator("eeee").data.join("|") + ")",
        manipulator : dateNamesManipulator("eeee").func
      });

      rules.push(
      {
        pattern     : "eeeee",
        regex       : "(" + dateNamesManipulator("eeeee").data.join("|") + ")",
        manipulator : dateNamesManipulator("eeeee").func
      });

      rules.push(
      {
        pattern     : "c",
        regex       : "\\d?",
        manipulator : localWeekDayManipulator
      });

      rules.push(
      {
        pattern     : "ccc",
        regex       : "(" + dateNamesManipulator("ccc").data.join("|") + ")",
        manipulator : dateNamesManipulator("ccc").func
      });

      rules.push(
      {
        pattern     : "cccc",
        regex       : "(" + dateNamesManipulator("cccc").data.join("|") + ")",
        manipulator : dateNamesManipulator("cccc").func
      });

      rules.push(
      {
        pattern     : "ccccc",
        regex       : "(" + dateNamesManipulator("ccccc").data.join("|") + ")",
        manipulator : dateNamesManipulator("ccccc").func
      });

      rules.push(
      {
        pattern     : "a",
        regex       : "(" + amMarker + "|" + pmMarker + ")",
        manipulator : ampmManipulator
      });

      rules.push(
      {
        pattern : "W",
        regex   : "(\\d?)",
        field   : "weekOfMonth"
      });

      rules.push(
      {
        pattern : "w",
        regex   : "(\\d?)",
        field   : "weekOfYear"
      });

      rules.push(
      {
        pattern : "ww",
        regex   : "(\\d\\d?)",
        field   : "weekOfYear"
      });

      rules.push(
      {
        pattern : "HH",
        regex   : "(\\d\\d?)",
        field   : "hour"
      });

      rules.push(
      {
        pattern : "H",
        regex   : "(\\d\\d?)",
        field   : "hour"
      });

      rules.push(
      {
        pattern     : "kk",
        regex       : "(\\d\\d?)",
        manipulator : noZeroHourManipulator
      });

      rules.push(
      {
        pattern     : "k",
        regex       : "(\\d\\d?)",
        manipulator : noZeroHourManipulator
      });

      rules.push(
      {
        pattern : "KK",
        regex   : "(\\d\\d?)",
        field   : "hour"
      });

      rules.push(
      {
        pattern : "K",
        regex   : "(\\d\\d?)",
        field   : "hour"
      });

      rules.push(
      {
        pattern     : "hh",
        regex       : "(\\d\\d?)",
        manipulator : noZeroAmPmHourManipulator
      });

      rules.push(
      {
        pattern     : "h",
        regex       : "(\\d\\d?)",
        manipulator : noZeroAmPmHourManipulator
      });

      rules.push(
      {
        pattern : "mm",
        regex   : "(\\d\\d?)",
        field   : "min"
      });

      rules.push(
      {
        pattern : "m",
        regex   : "(\\d\\d?)",
        field   : "min"
      });

      rules.push(
      {
        pattern : "ss",
        regex   : "(\\d\\d?)",
        field   : "sec"
      });

      rules.push(
      {
        pattern : "s",
        regex   : "(\\d\\d?)",
        field   : "sec"
      });

      rules.push(
      {
        pattern : "SSS",
        regex   : "(\\d\\d?\\d?)",
        field   : "ms"
      });

      rules.push(
      {
        pattern : "SS",
        regex   : "(\\d\\d?\\d?)",
        field   : "ms"
      });

      rules.push(
      {
        pattern : "S",
        regex   : "(\\d\\d?\\d?)",
        field   : "ms"
      });

      rules.push(
      {
        pattern     : "Z",
        regex       : "([\\+\\-]\\d\\d\\d\\d)",
        manipulator : ignoreManipulator
      });

      rules.push(
      {
        pattern     : "z",
        regex       : "(GMT[\\+\\-]\\d\\d:\\d\\d)",
        manipulator : ignoreManipulator
      });
    }
  },




  /*
  *****************************************************************************
     DESTRUCTOR
  *****************************************************************************
  */

  destruct : function()
  {
    if (this.__bindingId != null) {
      qx.locale.Manager.getInstance().removeBinding(this.__bindingId);
    }
    this.__formatTree = this.__parseFeed = this.__parseRules = null;
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Sebastian Werner (wpbasti)
     * Andreas Ecker (ecker)
     * Fabian Jakobs (fjakobs)

************************************************************************ */

/**
 * Static class that provides localized date information (like names of week
 * days, AM/PM markers, start of week, etc.).
 *
 * @cldr()
 */
qx.Class.define("qx.locale.Date",
{
  statics :
  {
    /**
     * Reference to the locale manager.
     *
     * @internal
     */
    __mgr : qx.locale.Manager.getInstance(),


    /**
     * Get AM marker for time definitions
     *
     * @param locale {String} optional locale to be used
     * @return {String} translated AM marker.
     */
    getAmMarker : function(locale) {
      return this.__mgr.localize("cldr_am", [], locale);
    },


    /**
     * Get PM marker for time definitions
     *
     * @param locale {String} optional locale to be used
     * @return {String} translated PM marker.
     */
    getPmMarker : function(locale) {
      return this.__mgr.localize("cldr_pm", [], locale);
    },


    /**
     * Return localized names of day names
     *
     * @param length {String} format of the day names.
     *       Possible values: "abbreviated", "narrow", "wide"
     * @param locale {String} optional locale to be used
     * @param context {String} (default: "format") intended context.
     *       Possible values: "format", "stand-alone"
     * @param withFallback {Boolean?} if true, the previous parameter's other value is tried
     * in order to find a localized name for the day
     * @return {String[]} array of localized day names starting with sunday.
     */
    getDayNames : function(length, locale, context, withFallback)
    {
      var context = context ? context : "format";

      if (qx.core.Environment.get("qx.debug")) {
        qx.core.Assert.assertInArray(length, ["abbreviated", "narrow", "wide"]);
        qx.core.Assert.assertInArray(context, ["format", "stand-alone"]);
      }

      var days = [ "sun", "mon", "tue", "wed", "thu", "fri", "sat" ];

      var names = [];

      for (var i=0; i<days.length; i++)
      {
        var key = "cldr_day_" + context + "_" + length + "_" + days[i];
        names.push(withFallback ? this.__localizeWithFallback(context, context === 'format' ? 'stand-alone' : 'format', key, locale) : this.__mgr.localize(key, [], locale));
      }

      return names;
    },


    /**
     * Return localized name of a week day name
     *
     * @param length {String} format of the day name.
     *       Possible values: "abbreviated", "narrow", "wide"
     * @param day {Integer} day number. 0=sunday, 1=monday, ...
     * @param locale {String} optional locale to be used
     * @param context {String} (default: "format") intended context.
     *       Possible values: "format", "stand-alone"
     * @param withFallback {Boolean?} if true, the previous parameter's other value is tried
     * in order to find a localized name for the day
     * @return {String} localized day name
     */
    getDayName : function(length, day, locale, context, withFallback)
    {
      var context = context ? context : "format";

      if (qx.core.Environment.get("qx.debug"))
      {
        qx.core.Assert.assertInArray(length, ["abbreviated", "narrow", "wide"]);
        qx.core.Assert.assertInteger(day);
        qx.core.Assert.assertInRange(day, 0, 6);
        qx.core.Assert.assertInArray(context, ["format", "stand-alone"]);
      }

      var days = [ "sun", "mon", "tue", "wed", "thu", "fri", "sat" ];

      var key = "cldr_day_" + context + "_" + length + "_" + days[day];
      return withFallback ? this.__localizeWithFallback(context, context === 'format' ? 'stand-alone' : 'format', key, locale) : this.__mgr.localize(key, [], locale);
    },


    /**
     * Return localized names of month names
     *
     * @param length {String} format of the month names.
     *       Possible values: "abbreviated", "narrow", "wide"
     * @param locale {String} optional locale to be used
     * @param context {String} (default: "format") intended context.
     *       Possible values: "format", "stand-alone"
     * @param withFallback {Boolean?} if true, the previous parameter's other value is tried
     * in order to find a localized name for the month
     * @return {String[]} array of localized month names starting with january.
     */
    getMonthNames : function(length, locale, context, withFallback)
    {
      var context = context ? context : "format";

      if (qx.core.Environment.get("qx.debug")) {
        qx.core.Assert.assertInArray(length, ["abbreviated", "narrow", "wide"]);
        qx.core.Assert.assertInArray(context, ["format", "stand-alone"]);
      }

      var names = [];

      for (var i=0; i<12; i++)
      {
        var key = "cldr_month_" + context + "_" + length + "_" + (i + 1);
        names.push(withFallback ? this.__localizeWithFallback(context, context === 'format' ? 'stand-alone' : 'format', key, locale) : this.__mgr.localize(key, [], locale));
      }

      return names;
    },


    /**
     * Return localized name of a month
     *
     * @param length {String} format of the month names.
     *       Possible values: "abbreviated", "narrow", "wide"
     * @param month {Integer} index of the month. 0=january, 1=february, ...
     * @param locale {String} optional locale to be used
     * @param context {String} (default: "format") intended context.
     *       Possible values: "format", "stand-alone"
     * @param withFallback {Boolean?} if true, the previous parameter's other value is tried
     * in order to find a localized name for the month
     * @return {String} localized month name
     */
    getMonthName : function(length, month, locale, context, withFallback)
    {
      var context = context ? context : "format";

      if (qx.core.Environment.get("qx.debug")) {
        qx.core.Assert.assertInArray(length, ["abbreviated", "narrow", "wide"]);
        qx.core.Assert.assertInArray(context, ["format", "stand-alone"]);
      }

      var key = "cldr_month_" + context + "_" + length + "_" + (month + 1);
      return withFallback ? this.__localizeWithFallback(context, context === 'format' ? 'stand-alone' : 'format', key, locale) : this.__mgr.localize(key, [], locale);
    },


    /**
     * Return localized date format string to be used with {@link qx.util.format.DateFormat}.
     *
     * @param size {String} format of the date format.
     *      Possible values: "short", "medium", "long", "full"
     * @param locale {String?} optional locale to be used
     * @return {String} localized date format string
     */
    getDateFormat : function(size, locale)
    {
      if (qx.core.Environment.get("qx.debug")) {
        qx.core.Assert.assertInArray(size, ["short", "medium", "long", "full"]);
      }

      var key = "cldr_date_format_" + size;
      return this.__mgr.localize(key, [], locale)
    },


    /**
     * Try to localize a date/time format string. For format string possibillities see
     * <a href="http://cldr.unicode.org/translation/date-time">Date/Time Symbol reference</a>
     * at CLDR - Unicode Common Locale Data Repository.
     *
     * If no localization is available take the fallback format string.
     *
     * @param canonical {String} format string containing only field information, and in a canonical order.
     *       Examples are "yyyyMMMM" for year + full month, or "MMMd" for abbreviated month + day.
     * @param fallback {String} fallback format string if no localized version is found
     * @param locale {String} optional locale to be used
     * @return {String} best matching format string
     */
    getDateTimeFormat : function(canonical, fallback, locale)
    {
      var key = "cldr_date_time_format_" + canonical;
      var localizedFormat = this.__mgr.localize(key, [], locale);

      if (localizedFormat == key) {
        localizedFormat = fallback;
      }

      return localizedFormat;
    },


    /**
     * Return localized time format string to be used with {@link qx.util.format.DateFormat}.
     *
     * @param size {String} format of the time pattern.
     *      Possible values: "short", "medium", "long", "full"
     * @param locale {String} optional locale to be used
     * @return {String} localized time format string
     */
    getTimeFormat : function(size, locale)
    {
      if (qx.core.Environment.get("qx.debug")) {
        qx.core.Assert.assertInArray(size, ["short", "medium", "long", "full"]);
      }

      var key = "cldr_time_format_" + size;
      var localizedFormat = this.__mgr.localize(key, [], locale);

      if (localizedFormat != key) {
        return localizedFormat;
      }

      switch(size)
      {
        case "short":
        case "medium":
          return qx.locale.Date.getDateTimeFormat("HHmm", "HH:mm");

        case "long":
          return qx.locale.Date.getDateTimeFormat("HHmmss", "HH:mm:ss");

        case "full":
          return qx.locale.Date.getDateTimeFormat("HHmmsszz", "HH:mm:ss zz");

        default:
          throw new Error("This case should never happen.");
      }
    },


    /**
     * Return the day the week starts with
     *
     * Reference: Common Locale Data Repository (cldr) supplementalData.xml
     *
     * @param locale {String} optional locale to be used
     * @return {Integer} index of the first day of the week. 0=sunday, 1=monday, ...
     */
    getWeekStart : function(locale)
    {
      var weekStart =
      {
        // default is monday
        "MV" : 5, // friday
        "AE" : 6, // saturday
        "AF" : 6,
        "BH" : 6,
        "DJ" : 6,
        "DZ" : 6,
        "EG" : 6,
        "ER" : 6,
        "ET" : 6,
        "IQ" : 6,
        "IR" : 6,
        "JO" : 6,
        "KE" : 6,
        "KW" : 6,
        "LB" : 6,
        "LY" : 6,
        "MA" : 6,
        "OM" : 6,
        "QA" : 6,
        "SA" : 6,
        "SD" : 6,
        "SO" : 6,
        "TN" : 6,
        "YE" : 6,
        "AS" : 0, // sunday
        "AU" : 0,
        "AZ" : 0,
        "BW" : 0,
        "CA" : 0,
        "CN" : 0,
        "FO" : 0,
        "GE" : 0,
        "GL" : 0,
        "GU" : 0,
        "HK" : 0,
        "IE" : 0,
        "IL" : 0,
        "IS" : 0,
        "JM" : 0,
        "JP" : 0,
        "KG" : 0,
        "KR" : 0,
        "LA" : 0,
        "MH" : 0,
        "MN" : 0,
        "MO" : 0,
        "MP" : 0,
        "MT" : 0,
        "NZ" : 0,
        "PH" : 0,
        "PK" : 0,
        "SG" : 0,
        "TH" : 0,
        "TT" : 0,
        "TW" : 0,
        "UM" : 0,
        "US" : 0,
        "UZ" : 0,
        "VI" : 0,
        "ZA" : 0,
        "ZW" : 0,
        "MW" : 0,
        "NG" : 0,
        "TJ" : 0
      };

      var territory = qx.locale.Date._getTerritory(locale);

      // default is monday
      return weekStart[territory] != null ? weekStart[territory] : 1;
    },


    /**
     * Return the day the weekend starts with
     *
     * Reference: Common Locale Data Repository (cldr) supplementalData.xml
     *
     * @param locale {String} optional locale to be used
     * @return {Integer} index of the first day of the weekend. 0=sunday, 1=monday, ...
     */
    getWeekendStart : function(locale)
    {
      var weekendStart =
      {
        // default is saturday
        "EG" : 5, // friday
        "IL" : 5,
        "SY" : 5,
        "IN" : 0, // sunday
        "AE" : 4, // thursday
        "BH" : 4,
        "DZ" : 4,
        "IQ" : 4,
        "JO" : 4,
        "KW" : 4,
        "LB" : 4,
        "LY" : 4,
        "MA" : 4,
        "OM" : 4,
        "QA" : 4,
        "SA" : 4,
        "SD" : 4,
        "TN" : 4,
        "YE" : 4
      };

      var territory = qx.locale.Date._getTerritory(locale);

      // default is saturday
      return weekendStart[territory] != null ? weekendStart[territory] : 6;
    },


    /**
     * Return the day the weekend ends with
     *
     * Reference: Common Locale Data Repository (cldr) supplementalData.xml
     *
     * @param locale {String} optional locale to be used
     * @return {Integer} index of the last day of the weekend. 0=sunday, 1=monday, ...
     */
    getWeekendEnd : function(locale)
    {
      var weekendEnd =
      {
        // default is sunday
        "AE" : 5, // friday
        "BH" : 5,
        "DZ" : 5,
        "IQ" : 5,
        "JO" : 5,
        "KW" : 5,
        "LB" : 5,
        "LY" : 5,
        "MA" : 5,
        "OM" : 5,
        "QA" : 5,
        "SA" : 5,
        "SD" : 5,
        "TN" : 5,
        "YE" : 5,
        "AF" : 5,
        "IR" : 5,
        "EG" : 6, // saturday
        "IL" : 6,
        "SY" : 6
      };

      var territory = qx.locale.Date._getTerritory(locale);

      // default is sunday
      return weekendEnd[territory] != null ? weekendEnd[territory] : 0;
    },


    /**
     * Returns whether a certain day of week belongs to the week end.
     *
     * @param day {Integer} index of the day. 0=sunday, 1=monday, ...
     * @param locale {String} optional locale to be used
     * @return {Boolean} whether the given day is a weekend day
     */
    isWeekend : function(day, locale)
    {
      var weekendStart = qx.locale.Date.getWeekendStart(locale);
      var weekendEnd = qx.locale.Date.getWeekendEnd(locale);

      if (weekendEnd > weekendStart) {
        return ((day >= weekendStart) && (day <= weekendEnd));
      } else {
        return ((day >= weekendStart) || (day <= weekendEnd));
      }
    },


    /**
     * Extract the territory part from a locale
     *
     * @param locale {String} the locale
     * @return {String} territory
     */
    _getTerritory : function(locale)
    {
      if (locale) {
        var territory = locale.split("_")[1] || locale;
      } else {
        territory = this.__mgr.getTerritory() || this.__mgr.getLanguage();
      }

      return territory.toUpperCase();
    },

    /**
     * Provide localisation (CLDR) data with fallback between "format" and "stand-alone" contexts.
     * It is used in {@link #getDayName} and {@link #getMonthName} methods.
     *
     * @param context {String} intended context.
     *       Possible values: "format", "stand-alone".
     * @param fallbackContext {String} the context used in case no localisation is found for the key.
     * @param key {String} message id (may contain format strings)
     * @param locale {String} the locale
     * @return {String} localized name for the key
     *
     */
    __localizeWithFallback : function(context, fallbackContext, key, locale)
    {
      var localizedString = this.__mgr.localize(key, [], locale);
      if(localizedString == key)
      {
        var newKey = key.replace('_' + context + '_', '_' + fallbackContext + '_');
        return this.__mgr.localize(newKey, [], locale);
      }
      else
      {
        return localizedString;
      }
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)
     * Tristan Koch (tristankoch)

************************************************************************ */

/**
 * The JSON data store is responsible for fetching data from an url. The type
 * of the data has to be json.
 *
 * The loaded data will be parsed and saved in qooxdoo objects. Every value
 * of the loaded data will be stored in a qooxdoo property. The model classes
 * for the data will be created automatically.
 *
 * For the fetching itself it uses the {@link qx.io.request.Xhr} class and
 * for parsing the loaded javascript objects into qooxdoo objects, the
 * {@link qx.data.marshal.Json} class will be used.
 *
 * Please note that if you
 *
 * * upgrade from qooxdoo 1.4 or lower
 * * choose not to force the old transport
 * * use a delegate with qx.data.store.IStoreDelegate#configureRequest
 *
 * you probably need to change the implementation of your delegate to configure
 * the {@link qx.io.request.Xhr} request.
 *
 */
qx.Class.define("qx.data.store.Json",
{
  extend : qx.core.Object,


  /**
   * @param url {String|null} The url where to find the data. The store starts
   *   loading as soon as the URL is give. If you want to change some details
   *   concerning the request, add null here and set the URL as soon as
   *   everything is set up.
   * @param delegate {Object?null} The delegate containing one of the methods
   *   specified in {@link qx.data.store.IStoreDelegate}.
   */
  construct : function(url, delegate)
  {
    this.base(arguments);


    // store the marshaler and the delegate
    this._marshaler = new qx.data.marshal.Json(delegate);
    this._delegate = delegate;

    if (url != null) {
      this.setUrl(url);
    }
  },


  events :
  {
    /**
     * Data event fired after the model has been created. The data will be the
     * created model.
     */
    "loaded" : "qx.event.type.Data",

    /**
     * Fired when an error (aborted, timeout or failed) occurred
     * during the load. The data contains the respons of the request.
     * If you want more details, use the {@link #changeState} event.
     */
    "error" : "qx.event.type.Data"
  },


  properties :
  {
    /**
     * Property for holding the loaded model instance.
     */
    model : {
      nullable: true,
      event: "changeModel"
    },


    /**
     * The state of the request as an url. If you want to check if the request
     * did it’s job, use, the {@link #changeState} event and check for one of the
     * listed values.
     */
    state : {
      check : [
        "configured", "queued", "sending", "receiving",
        "completed", "aborted", "timeout", "failed"
      ],
      init : "configured",
      event : "changeState"
    },


    /**
     * The url where the request should go to.
     */
    url : {
      check: "String",
      apply: "_applyUrl",
      event: "changeUrl",
      nullable: true
    }
  },


  members :
  {
    _marshaler : null,
    _delegate : null,

    __request : null,

    // apply function
    _applyUrl: function(value, old) {
      if (value != null) {
        // take care of the resource management
        value = qx.util.AliasManager.getInstance().resolve(value);
        value = qx.util.ResourceManager.getInstance().toUri(value);

        this._createRequest(value);
      }
    },

    /**
     * Get request
     *
     * @return {Object} The request.
     */
    _getRequest: function() {
      return this.__request;
    },


    /**
     * Set request.
     *
     * @param request {Object} The request.
     */
    _setRequest: function(request) {
      this.__request = request;
    },


    /**
     * Creates and sends a GET request with the given url.
     *
     * Listeners will be added to respond to the request’s "success",
     * "changePhase" and "fail" event.
     *
     * @param url {String} The url for the request.
     */
    _createRequest: function(url) {
      // dispose old request
      if (this.__request) {
        this.__request.dispose();
        this.__request = null;
      }

      var req = new qx.io.request.Xhr(url);
      this._setRequest(req);

      // request json representation
      req.setAccept("application/json");

      // parse as json no matter what content type is returned
      req.setParser("json");

      // register the internal event before the user has the change to
      // register its own event in the delegate
      req.addListener("success", this._onSuccess, this);

      // check for the request configuration hook
      var del = this._delegate;
      if (del && qx.lang.Type.isFunction(del.configureRequest)) {
        this._delegate.configureRequest(req);
      }

      // map request phase to it’s own phase
      req.addListener("changePhase", this._onChangePhase, this);

      // add failed, aborted and timeout listeners
      req.addListener("fail", this._onFail, this);

      req.send();
    },


    /**
     * Handler called when request phase changes.
     *
     * Sets the store’s state.
     *
     * @param ev {qx.event.type.Data} The request’s changePhase event.
     */
    _onChangePhase : function(ev) {
      var requestPhase = ev.getData(),
          requestPhaseToStorePhase = {},
          state;

      requestPhaseToStorePhase = {
        "opened": "configured",
        "sent": "sending",
        "loading": "receiving",
        "success": "completed",
        "abort": "aborted",
        "timeout": "timeout",
        "statusError": "failed"
      };

      state = requestPhaseToStorePhase[requestPhase];
      if (state) {
        this.setState(state);
      }
    },


    /**
     * Handler called when not completing the request successfully.
     *
     * @param ev {qx.event.type.Event} The request’s fail event.
     */
    _onFail : function(ev) {
      var req = ev.getTarget();
      this.fireDataEvent("error", req);
    },


    /**
     * Handler for the completion of the requests. It invokes the creation of
     * the needed classes and instances for the fetched data using
     * {@link qx.data.marshal.Json}.
     *
     * @param ev {qx.event.type.Event} The request’s success event.
     */
    _onSuccess : function(ev)
    {
      if (this.isDisposed()) {
        return;
      }

       var req = ev.getTarget(),
           data = req.getResponse();

       // check for the data manipulation hook
       var del = this._delegate;
       if (del && qx.lang.Type.isFunction(del.manipulateData)) {
         data = this._delegate.manipulateData(data);
       }

       // create the class
       this._marshaler.toClass(data, true);

       var oldModel = this.getModel();

       // set the initial data
       this.setModel(this._marshaler.toModel(data));

       // get rid of the old model
       if (oldModel && oldModel.dispose) {
         oldModel.dispose();
       }

       // fire complete event
       this.fireDataEvent("loaded", this.getModel());

       // get rid of the request object
       if (this.__request) {
         this.__request.dispose();
         this.__request = null;
       }
    },


    /**
     * Reloads the data with the url set in the {@link #url} property.
     */
    reload: function() {
      var url = this.getUrl();
      if (url != null) {
        this._createRequest(url);
      }
    }
  },

  /*
   *****************************************************************************
      DESTRUCT
   *****************************************************************************
   */

  destruct : function()
  {
    if (this.__request != null) {
      this._disposeObjects("__request");
    }

    // The marshaler internally uses the singleton pattern
    // (constructor.$$instance.
    this._disposeSingletonObjects("_marshaler");
    this._delegate = null;
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */
/**
 * Defines the methods needed by every marshaler which should work with the
 * qooxdoo data stores.
 */
qx.Interface.define("qx.data.marshal.IMarshaler",
{
  members :
  {
    /**
     * Creates for the given data the needed classes. The classes contain for
     * every key in the data a property. The classname is always the prefix
     * <code>qx.data.model</code>. Two objects containing the same keys will not
     * create two different classes.
     *
     * @param data {Object} The object for which classes should be created.
     * @param includeBubbleEvents {Boolean} Whether the model should support
     *   the bubbling of change events or not.
     */
    toClass : function(data, includeBubbleEvents) {},


    /**
     * Creates for the given data the needed models. Be sure to have the classes
     * created with {@link #toClass} before calling this method.
     *
     * @param data {Object} The object for which models should be created.
     *
     * @return {qx.core.Object} The created model object.
     */
    toModel : function(data) {}
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * This class is responsible for converting json data to class instances
 * including the creation of the classes.
 */
qx.Class.define("qx.data.marshal.Json",
{
  extend : qx.core.Object,
  implement : [qx.data.marshal.IMarshaler],

  /**
   * @param delegate {Object} An object containing one of the methods described
   *   in {@link qx.data.marshal.IMarshalerDelegate}.
   */
  construct : function(delegate)
  {
    this.base(arguments);

    this.__delegate = delegate;
  },

  statics :
  {
    $$instance : null,

    /**
     * Creates a qooxdoo object based on the given json data. This function
     * is just a static wrapper. If you want to configure the creation
     * process of the class, use {@link qx.data.marshal.Json} directly.
     *
     * @param data {Object} The object for which classes should be created.
     * @param includeBubbleEvents {Boolean} Whether the model should support
     *   the bubbling of change events or not.
     *
     * @return {qx.core.Object} An instance of the corresponding class.
     */
    createModel : function(data, includeBubbleEvents) {
      // singleton for the json marshaler
      if (this.$$instance === null) {
        this.$$instance = new qx.data.marshal.Json();
      }
      // be sure to create the classes first
      this.$$instance.toClass(data, includeBubbleEvents);
      // return the model
      return this.$$instance.toModel(data);
    }
  },


  members :
  {
    __delegate : null,


    /**
     * Converts a given object into a hash which will be used to identify the
     * classes under the namespace <code>qx.data.model</code>.
     *
     * @param data {Object} The JavaScript object from which the hash is
     *   required.
     * @return {String} The hash representation of the given JavaScript object.
     */
    __jsonToHash: function(data) {
      return Object.keys(data).sort().join('"');
    },


    /**
     * Creates for the given data the needed classes. The classes contain for
     * every key in the data a property. The classname is always the prefix
     * <code>qx.data.model</code> and the hash of the data created by
     * {@link #__jsonToHash}. Two objects containing the same keys will not
     * create two different classes. The class creation process also supports
     * the functions provided by its delegate.
     *
     * Important, please keep in mind that only valid JavaScript identifiers
     * can be used as keys in the data map. For convenience '-' in keys will
     * be removed (a-b will be ab in the end).
     *
     * @see qx.data.store.IStoreDelegate
     *
     * @param data {Object} The object for which classes should be created.
     * @param includeBubbleEvents {Boolean} Whether the model should support
     *   the bubbling of change events or not.
     */
    toClass: function(data, includeBubbleEvents) {
      this.__toClass(data, includeBubbleEvents, null, 0);
    },


    /**
     * Implementation of {@link #toClass} used for recursion.
     *
     * @param data {Object} The object for which classes should be created.
     * @param includeBubbleEvents {Boolean} Whether the model should support
     *   the bubbling of change events or not.
     * @param parentProperty {String|null} The name of the property the
     *   data will be stored in.
     * @param depth {Number} The depth of the data relative to the data's root.
     */
    __toClass : function(data, includeBubbleEvents, parentProperty, depth) {
      // break on all primitive json types and qooxdoo objects
      if (
        !qx.lang.Type.isObject(data)
        || !!data.$$isString // check for localized strings
        || data instanceof qx.core.Object
      ) {
        // check for arrays
        if (data instanceof Array || qx.Bootstrap.getClass(data) == "Array") {
          for (var i = 0; i < data.length; i++) {
            this.__toClass(data[i], includeBubbleEvents, null, depth+1);
          }
        }

        // ignore arrays and primitive types
        return;
      }

      var hash = this.__jsonToHash(data);

      // ignore rules
      if (this.__ignore(hash, parentProperty, depth)) {
        return;
      }

      // check for the possible child classes
      for (var key in data) {
        this.__toClass(data[key], includeBubbleEvents, key, depth+1);
      }

      // class already exists
      if (qx.Class.isDefined("qx.data.model." + hash)) {
        return;
      }

      // class is defined by the delegate
      if (
        this.__delegate
        && this.__delegate.getModelClass
        && this.__delegate.getModelClass(hash, data) != null
      ) {
        return;
      }

      // create the properties map
      var properties = {};
      // include the disposeItem for the dispose process.
      var members = {__disposeItem : this.__disposeItem};
      for (var key in data) {
        // apply the property names mapping
        if (this.__delegate && this.__delegate.getPropertyMapping) {
          key = this.__delegate.getPropertyMapping(key, hash);
        }

        // stip the unwanted characters
        key = key.replace(/-|\.|\s+/g, "");
        // check for valid JavaScript identifier (leading numbers are ok)
        if (qx.core.Environment.get("qx.debug")) {
          this.assertTrue((/^[$0-9A-Za-z_]*$/).test(key),
          "The key '" + key + "' is not a valid JavaScript identifier.")
        }

        properties[key] = {};
        properties[key].nullable = true;
        properties[key].event = "change" + qx.lang.String.firstUp(key);
        // bubble events
        if (includeBubbleEvents) {
          properties[key].apply = "_applyEventPropagation";
        }
        // validation rules
        if (this.__delegate && this.__delegate.getValidationRule) {
          var rule = this.__delegate.getValidationRule(hash, key);
          if (rule) {
            properties[key].validate = "_validate" + key;
            members["_validate" + key] = rule;
          }
        }
      }

      // try to get the superclass, qx.core.Object as default
      if (this.__delegate && this.__delegate.getModelSuperClass) {
        var superClass =
          this.__delegate.getModelSuperClass(hash) || qx.core.Object;
      } else {
        var superClass = qx.core.Object;
      }

      // try to get the mixins
      var mixins = [];
      if (this.__delegate && this.__delegate.getModelMixins) {
        var delegateMixins = this.__delegate.getModelMixins(hash);
        // check if its an array
        if (!qx.lang.Type.isArray(delegateMixins)) {
          if (delegateMixins != null) {
            mixins = [delegateMixins];
          }
        } else {
          mixins = delegateMixins;
        }
      }

      // include the mixin for the event bubbling
      if (includeBubbleEvents) {
        mixins.push(qx.data.marshal.MEventBubbling);
      }

      // create the map for the class
      var newClass = {
        extend : superClass,
        include : mixins,
        properties : properties,
        members : members,
        destruct : this.__disposeProperties
      };

      qx.Class.define("qx.data.model." + hash, newClass);
    },


    /**
     * Destructor for all created classes which disposes all stuff stored in
     * the properties.
     */
    __disposeProperties : function() {
      var properties = qx.util.PropertyUtil.getAllProperties(this.constructor);
      for (var desc in properties) {
        this.__disposeItem(this.get(properties[desc].name));
      };
    },


    /**
     * Helper for disposing items of the created class.
     *
     * @param item {var} The item to dispose.
     */
    __disposeItem : function(item) {
      if (!(item instanceof qx.core.Object)) {
        // ignore all non objects
        return;
      }
      // ignore already disposed items (could happen during shutdown)
      if (item.isDisposed()) {
        return;
      }
      item.dispose();
    },


    /**
     * Creates an instance for the given data hash.
     *
     * @param hash {String} The hash of the data for which an instance should
     *   be created.
     * @param data {Map} The data for which an instance should be created.
     * @return {qx.core.Object} An instance of the corresponding class.
     */
    __createInstance: function(hash, data) {
      var delegateClass;
      // get the class from the delegate
      if (this.__delegate && this.__delegate.getModelClass) {
        delegateClass = this.__delegate.getModelClass(hash, data);
      }
      if (delegateClass != null) {
        return (new delegateClass());
      } else {
        var className = "qx.data.model." + hash;
        var clazz = qx.Class.getByName(className);
        if (!clazz) {
          throw new Error("Class '" + className + "' could not be found.");
        }
        return (new clazz());
      }
    },


    /**
     * Helper to decide if the delegate decides to ignore a data set.
     * @param hash {String} The property names.
     * @param parentProperty {String|null} The name of the property the data
     *   will be stored in.
     * @param depth {Number} The depth of the object relative to the data root.
     * @return {Boolean} <code>true</code> if the set should be ignored
     */
    __ignore : function(hash, parentProperty, depth) {
      var del = this.__delegate;
      return del && del.ignore && del.ignore(hash, parentProperty, depth);
    },


    /**
     * Creates for the given data the needed models. Be sure to have the classes
     * created with {@link #toClass} before calling this method. The creation
     * of the class itself is delegated to the {@link #__createInstance} method,
     * which could use the {@link qx.data.store.IStoreDelegate} methods, if
     * given.
     *
     * @param data {Object} The object for which models should be created.
     *
     * @return {qx.core.Object} The created model object.
     */
    toModel: function(data) {
      return this.__toModel(data, null, 0);
    },


    /**
     * Implementation of {@link #toModel} used for recursion.
     *
     * @param data {Object} The object for which models should be created.
     * @param parentProperty {String|null} The name of the property the
     *   data will be stored in.
     * @param depth {Number} The depth of the data relative to the data's root.
     * @return {qx.core.Object} The created model object.
     */
    __toModel: function(data, parentProperty, depth) {
      var isObject = qx.lang.Type.isObject(data);
      var isArray = data instanceof Array || qx.Bootstrap.getClass(data) == "Array";

      if (
        (!isObject && !isArray)
        || !!data.$$isString // check for localized strings
        || data instanceof qx.core.Object
      ) {
        return data;

      // ignore rules
      } else if (this.__ignore(this.__jsonToHash(data), parentProperty, depth)) {
        return data;

      } else if (isArray) {
        var array = new qx.data.Array();
        // set the auto dispose for the array
        array.setAutoDisposeItems(true);

        for (var i = 0; i < data.length; i++) {
          array.push(this.__toModel(data[i], null, depth+1));
        }
        return array;

      } else if (isObject) {
        // create an instance for the object
        var hash = this.__jsonToHash(data);
        var model = this.__createInstance(hash, data);

        // go threw all element in the data
        for (var key in data) {
          // apply the property names mapping
          var propertyName = key;
          if (this.__delegate && this.__delegate.getPropertyMapping) {
            propertyName = this.__delegate.getPropertyMapping(key, hash);
          }
          var propertyNameReplaced = propertyName.replace(/-|\.|\s+/g, "");
          // warn if there has been a replacement
          if (
            (qx.core.Environment.get("qx.debug")) &&
            qx.core.Environment.get("qx.debug.databinding")
          ) {
            if (propertyNameReplaced != propertyName) {
              this.warn(
                "The model contained an illegal name: '" + key +
                "'. Replaced it with '" + propertyName + "'."
              );
            }
          }
          propertyName = propertyNameReplaced;
          // only set the properties if they are available [BUG #5909]
          var setterName = "set" + qx.lang.String.firstUp(propertyName);
          if (model[setterName]) {
            model[setterName](this.__toModel(data[key], key, depth+1));
          }
        }
        return model;
      }

      throw new Error("Unsupported type!");
    }
  },

  /*
   *****************************************************************************
      DESTRUCT
   *****************************************************************************
   */

  destruct : function() {
    this.__delegate = null;
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * Mixin used for the bubbling events. If you want to use this in your own model
 * classes, be sure that every property will call the
 * {@link #_applyEventPropagation} function on every change.
 */
qx.Mixin.define("qx.data.marshal.MEventBubbling",
{

  events :
  {
    /**
     * The change event which will be fired on every change in the model no
     * matter what property changes. This event bubbles so the root model will
     * fire a change event on every change of its children properties too.
     *
     * Note that properties are required to call
     * {@link #_applyEventPropagation} on apply for changes to be tracked as
     * desired. It is already taken care of that properties created with the
     * {@link qx.data.marshal.Json} marshaler call this method.
     *
     * The data will contain a map with the following three keys
     *   <li>value: The new value of the property</li>
     *   <li>old: The old value of the property.</li>
     *   <li>name: The name of the property changed including its parent
     *     properties separated by dots.</li>
     *   <li>item: The item which has the changed property.</li>
     * Due to that, the <code>getOldData</code> method will always return null
     * because the old data is contained in the map.
     */
    "changeBubble": "qx.event.type.Data"
  },


  members :
  {
    /**
     * Apply function for every property created with the
     * {@link qx.data.marshal.Json} marshaler. It fires and
     * {@link #changeBubble} event on every change. It also adds the chaining
     * listener if possible which is necessary for the bubbling of the events.
     *
     * @param value {var} The new value of the property.
     * @param old {var} The old value of the property.
     * @param name {String} The name of the changed property.
     */
    _applyEventPropagation : function(value, old, name)
    {
      this.fireDataEvent("changeBubble", {
        value: value, name: name, old: old, item: this
      });

      this._registerEventChaining(value, old, name);
    },


    /**
     * Registers for the given parameters the changeBubble listener, if
     * possible. It also removes the old listener, if an old item with
     * a changeBubble event is given.
     *
     * @param value {var} The new value of the property.
     * @param old {var} The old value of the property.
     * @param name {String} The name of the changed property.
     */
    _registerEventChaining : function(value, old, name)
    {
      // if an old value is given, remove the old listener if possible
      if (old != null && old.getUserData && old.getUserData("idBubble-" + this.$$hash) != null) {
        var listeners = old.getUserData("idBubble-" + this.$$hash);
        for (var i = 0; i < listeners.length; i++) {
          old.removeListenerById(listeners[i]);
        }
        old.setUserData("idBubble-" + this.$$hash, null);
      }

      // if the child supports chaining
      if ((value instanceof qx.core.Object)
        && qx.Class.hasMixin(value.constructor, qx.data.marshal.MEventBubbling)
      ) {
        // create the listener
        var listener = qx.lang.Function.bind(
          this.__changePropertyListener, this, name
        );
        // add the listener
        var id = value.addListener("changeBubble", listener, this);
        var listeners = value.getUserData("idBubble-" + this.$$hash);
        if (listeners == null)
        {
          listeners = [];
          value.setUserData("idBubble-" + this.$$hash, listeners);
        }
        listeners.push(id);
      }
    },


    /**
     * Listener responsible for formating the name and firing the change event
     * for the changed property.
     *
     * @param name {String} The name of the former properties.
     * @param e {qx.event.type.Data} The date event fired by the property
     *   change.
     */
    __changePropertyListener : function(name, e)
    {
      var data = e.getData();
      var value = data.value;
      var old = data.old;

      // if the target is an array
      if (qx.Class.hasInterface(e.getTarget().constructor, qx.data.IListData)) {

        if (data.name.indexOf) {
          var dotIndex = data.name.indexOf(".") != -1 ? data.name.indexOf(".") : data.name.length;
          var bracketIndex = data.name.indexOf("[") != -1 ? data.name.indexOf("[") : data.name.length;

          // braktes in the first spot is ok [BUG #5985]
          if (bracketIndex == 0) {
            var newName = name + data.name;
          } else if (dotIndex < bracketIndex) {
            var index = data.name.substring(0, dotIndex);
            var rest = data.name.substring(dotIndex + 1, data.name.length);
            if (rest[0] != "[") {
              rest = "." + rest;
            }
            var newName =  name + "[" + index + "]" + rest;
          } else if (bracketIndex < dotIndex) {
            var index = data.name.substring(0, bracketIndex);
            var rest = data.name.substring(bracketIndex, data.name.length);
            var newName =  name + "[" + index + "]" + rest;
          } else {
            var newName =  name + "[" + data.name + "]";
          }
        } else {
          var newName =  name + "[" + data.name + "]";
        }

      // if the target is not an array
      } else {
        // special case for array as first element of the chain [BUG #5985]
        if (parseInt(name) == name && name !== "") {
          name = "[" + name + "]";
        }
        var newName =  name + "." + data.name;
      }

      this.fireDataEvent(
        "changeBubble",
        {
          value: value,
          name: newName,
          old: old,
          item: data.item || e.getTarget()
        }
      );
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2008 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * The data array is a special array used in the data binding context of
 * qooxdoo. It does not extend the native array of JavaScript but its a wrapper
 * for it. All the native methods are included in the implementation and it
 * also fires events if the content or the length of the array changes in
 * any way. Also the <code>.length</code> property is available on the array.
 */
qx.Class.define("qx.data.Array",
{
  extend : qx.core.Object,
  include : qx.data.marshal.MEventBubbling,
  implement : [qx.data.IListData],

  /**
   * Creates a new instance of an array.
   *
   * @param param {var} The parameter can be some types.<br/>
   *   Without a parameter a new blank array will be created.<br/>
   *   If there is more than one parameter is given, the parameter will be
   *   added directly to the new array.<br/>
   *   If the parameter is a number, a new Array with the given length will be
   *   created.<br/>
   *   If the parameter is a JavaScript array, a new array containing the given
   *   elements will be created.
   */
  construct : function(param)
  {
    this.base(arguments);
    // if no argument is given
    if (param == undefined) {
      this.__array = [];

    // check for elements (create the array)
    } else if (arguments.length > 1) {
      // create an empty array and go through every argument and push it
      this.__array = [];
      for (var i = 0; i < arguments.length; i++) {
        this.__array.push(arguments[i]);
      }

    // check for a number (length)
    } else if (typeof param == "number") {
      this.__array = new Array(param);
    // check for an array itself
    } else if (param instanceof Array) {
      this.__array = qx.lang.Array.clone(param);

    // error case
    } else {
      this.__array = [];
      this.dispose();
      throw new Error("Type of the parameter not supported!");
    }

    // propagate changes
    for (var i=0; i<this.__array.length; i++) {
      this._applyEventPropagation(this.__array[i], null, i);
    }

    // update the length at startup
    this.__updateLength();

    // work against the console printout of the array
    if (qx.core.Environment.get("qx.debug")) {
      this[0] = "Please use 'toArray()' to see the content.";
    }
  },


  /*
  *****************************************************************************
     PROPERTIES
  *****************************************************************************
  */

  properties :
  {
    /**
     * Flag to set the dispose behavior of the array. If the property is set to
     * <code>true</code>, the array will dispose its content on dispose, too.
     */
    autoDisposeItems : {
      check : "Boolean",
      init : false
    }
  },

  /*
  *****************************************************************************
     EVENTS
  *****************************************************************************
  */

  events :
  {
    /**
     * The change event which will be fired if there is a change in the array.
     * The data contains a map with three key value pairs:
     * <li>start: The start index of the change.</li>
     * <li>end: The end index of the change.</li>
     * <li>type: The type of the change as a String. This can be 'add',
     * 'remove', 'order' or 'add/remove'</li>
     * <li>added: The items which has been added (as a JavaScript array)</li>
     * <li>removed: The items which has been removed (as a JavaScript array)</li>
     */
    "change" : "qx.event.type.Data",


    /**
     * The changeLength event will be fired every time the length of the
     * array changes.
     */
    "changeLength": "qx.event.type.Data"
  },


  members :
  {
    // private members
    __array : null,


    /**
     * Concatenates the current and the given array into a new one.
     *
     * @param array {Array} The javaScript array which should be concatenated
     *   to the current array.
     *
     * @return {qx.data.Array} A new array containing the values of both former
     *   arrays.
     */
    concat: function(array) {
      if (array) {
        var newArray = this.__array.concat(array);
      } else {
        var newArray = this.__array.concat();
      }
      return new qx.data.Array(newArray);
    },


    /**
     * Returns the array as a string using the given connector string to
     * connect the values.
     *
     * @param connector {String} the string which should be used to past in
     *  between of the array values.
     *
     * @return {String} The array as a string.
     */
    join: function(connector) {
      return this.__array.join(connector);
    },


    /**
     * Removes and returns the last element of the array.
     * An change event will be fired.
     *
     * @return {var} The last element of the array.
     */
    pop: function() {
      var item = this.__array.pop();
      this.__updateLength();
      // remove the possible added event listener
      this._registerEventChaining(null, item, this.length - 1);
      // fire change bubble event
      this.fireDataEvent("changeBubble", {
        value: [],
        name: this.length + "",
        old: [item],
        item: this
      });

      this.fireDataEvent("change",
        {
          start: this.length - 1,
          end: this.length - 1,
          type: "remove",
          removed : [item],
          added : []
        }, null
      );
      return item;
    },


    /**
     * Adds an element at the end of the array.
     *
     * @param varargs {var} Multiple elements. Every element will be added to
     *   the end of the array. An change event will be fired.
     *
     * @return {Number} The new length of the array.
     */
    push: function(varargs) {
      for (var i = 0; i < arguments.length; i++) {
        this.__array.push(arguments[i]);
        this.__updateLength();
        // apply to every pushed item an event listener for the bubbling
        this._registerEventChaining(arguments[i], null, this.length - 1);

        // fire change bubbles event
        this.fireDataEvent("changeBubble", {
          value: [arguments[i]],
          name: (this.length - 1) + "",
          old: [],
          item: this
        });

        // fire change event
        this.fireDataEvent("change",
          {
            start: this.length - 1,
            end: this.length - 1,
            type: "add",
            added: [arguments[i]],
            removed : []
          }, null
        );
      }
      return this.length;
    },


    /**
     * Reverses the order of the array. An change event will be fired.
     */
    reverse: function() {
      // ignore on empty arrays
      if (this.length == 0) {
        return;
      }

      var oldArray = this.__array.concat();
      this.__array.reverse();

      this.__updateEventPropagation(0, this.length);

      this.fireDataEvent("change",
        {start: 0, end: this.length - 1, type: "order", added: [], removed: []}, null
      );

      // fire change bubbles event
      this.fireDataEvent("changeBubble", {
        value: this.__array,
        name: "0-" + (this.__array.length - 1),
        old: oldArray,
        item: this
      });
    },


    /**
     * Removes the first element of the array and returns it. An change event
     * will be fired.
     *
     * @return {var} the former first element.
     */
    shift: function() {
      // ignore on empty arrays
      if (this.length == 0) {
        return;
      }

      var item = this.__array.shift();
      this.__updateLength();
      // remove the possible added event listener
      this._registerEventChaining(null, item, this.length -1);
      // as every item has changed its position, we need to update the event bubbling
      this.__updateEventPropagation(0, this.length);

      // fire change bubbles event
      this.fireDataEvent("changeBubble", {
        value: [],
        name: "0",
        old: [item],
        item: this
      });

      // fire change event
      this.fireDataEvent("change",
        {
          start: 0,
          end: this.length -1,
          type: "remove",
          removed : [item],
          added : []
        }, null
      );
      return item;
    },


    /**
     * Returns a new array based on the range specified by the parameters.
     *
     * @param from {Number} The start index.
     * @param to {Number?null} The end index. If omitted, slice extracts to the
     *   end of the array.
     *
     * @return {qx.data.Array} A new array containing the given range of values.
     */
    slice: function(from, to) {
      return new qx.data.Array(this.__array.slice(from, to));
    },


    /**
     * Method to remove and add new elements to the array. For every remove or
     * add an event will be fired.
     *
     * @param startIndex {Integer} The index where the splice should start
     * @param amount {Integer} Defines number of elements which will be removed
     *   at the given position.
     * @param varargs {var} All following parameters will be added at the given
     *   position to the array.
     * @return {qx.data.Array} An data array containing the removed elements.
     *   Keep in to dispose this one, even if you don't use it!
     */
    splice: function(startIndex, amount, varargs) {
      // store the old length
      var oldLength = this.__array.length;

      // invoke the slice on the array
      var returnArray = this.__array.splice.apply(this.__array, arguments);

      // fire a change event for the length
      if (this.__array.length != oldLength) {
        this.__updateLength();
      } else if (amount == arguments.length - 2) {
        // if we added as much items as we removed
        var addedItems = qx.lang.Array.fromArguments(arguments, 2)
        // check if the array content equals the content before the operation
        for (var i = 0; i < addedItems.length; i++) {
          if (addedItems[i] !== returnArray[i]) {
            break;
          }
          // if all added and removed items are queal
          if (i == addedItems.length -1) {
            // prevent all events and return a new array
            return new qx.data.Array();
          }
        }
      }
      // fire an event for the change
      var removed = amount > 0;
      var added = arguments.length > 2;
      if (removed || added) {
        var addedItems = qx.lang.Array.fromArguments(arguments, 2);

        if (returnArray.length == 0) {
          var type = "add";
          var end = startIndex + addedItems.length;
        } else if (addedItems.length == 0) {
          var type = "remove";
          var end = this.length - 1;
        } else {
          var type = "add/remove";
          var end = startIndex + Math.abs(addedItems.length - returnArray.length);
        }
        this.fireDataEvent("change",
          {
            start: startIndex,
            end: end,
            type: type,
            added : addedItems,
            removed : returnArray
          }, null
        );
      }

      // remove the listeners first [BUG #7132]
      for (var i = 0; i < returnArray.length; i++) {
        this._registerEventChaining(null, returnArray[i], i);
      }

      // add listeners
      for (var i = 2; i < arguments.length; i++) {
        this._registerEventChaining(arguments[i], null, startIndex + (i - 2));
      }
      // apply event chaining for every item moved
      this.__updateEventPropagation(startIndex + (arguments.length - 2) - amount, this.length);

      // fire the changeBubble event
      var value = [];
      for (var i=2; i < arguments.length; i++) {
        value[i-2] = arguments[i];
      };
      var endIndex = (startIndex + Math.max(arguments.length - 3 , amount - 1));
      var name = startIndex == endIndex ? endIndex : startIndex + "-" + endIndex;
      this.fireDataEvent("changeBubble", {
        value: value, name: name + "", old: returnArray, item: this
      });

      return (new qx.data.Array(returnArray));
    },


    /**
     * Sorts the array. If a function is given, this will be used to
     * compare the items. <code>changeBubble</code> event will only be fired,
     * if sorting result differs from original array.
     *
     * @param func {Function} A compare function comparing two parameters and
     *   should return a number.
     */
    sort: function(func) {
      // ignore if the array is empty
      if (this.length == 0) {
        return;
      }
      var oldArray = this.__array.concat();

      this.__array.sort.apply(this.__array, arguments);

      // prevent changeBubble event if nothing has been changed
      if (qx.lang.Array.equals(this.__array, oldArray) === true){
        return;
      }

      this.__updateEventPropagation(0, this.length);

      this.fireDataEvent("change",
        {start: 0, end: this.length - 1, type: "order", added: [], removed: []}, null
      );

      // fire change bubbles event
      this.fireDataEvent("changeBubble", {
        value: this.__array,
        name: "0-" + (this.length - 1),
        old: oldArray,
        item: this
      });
    },


    /**
     * Adds the given items to the beginning of the array. For every element,
     * a change event will be fired.
     *
     * @param varargs {var} As many elements as you want to add to the beginning.
     * @return {Integer} The new length of the array
     */
    unshift: function(varargs) {
      for (var i = arguments.length - 1; i >= 0; i--) {
        this.__array.unshift(arguments[i]);
        this.__updateLength();
        // apply to every item an event listener for the bubbling
        this.__updateEventPropagation(0, this.length);

        // fire change bubbles event
        this.fireDataEvent("changeBubble", {
          value: [this.__array[0]],
          name: "0",
          old: [this.__array[1]],
          item: this
        });

        // fire change event
        this.fireDataEvent("change",
          {
            start: 0,
            end: this.length - 1,
            type: "add",
            added : [arguments[i]],
            removed : []
          }, null
        );
      }
      return this.length;
    },


    /**
     * Returns the list data as native array. Beware of the fact that the
     * internal representation will be returnd and any manipulation of that
     * can cause a misbehavior of the array. This method should only be used for
     * debugging purposes.
     *
     * @return {Array} The native array.
     */
    toArray: function() {
      return this.__array;
    },


    /**
     * Replacement function for the getting of the array value.
     * array[0] should be array.getItem(0).
     *
     * @param index {Number} The index requested of the array element.
     *
     * @return {var} The element at the given index.
     */
    getItem: function(index) {
      return this.__array[index];
    },


    /**
     * Replacement function for the setting of an array value.
     * array[0] = "a" should be array.setItem(0, "a").
     * A change event will be fired if the value changes. Setting the same
     * value again will not lead to a change event.
     *
     * @param index {Number} The index of the array element.
     * @param item {var} The new item to set.
     */
    setItem: function(index, item) {
      var oldItem = this.__array[index];
      // ignore settings of already set items [BUG #4106]
      if (oldItem === item) {
        return;
      }
      this.__array[index] = item;
      // set an event listener for the bubbling
      this._registerEventChaining(item, oldItem, index);
      // only update the length if its changed
      if (this.length != this.__array.length) {
        this.__updateLength();
      }

      // fire change bubbles event
      this.fireDataEvent("changeBubble", {
        value: [item],
        name: index + "",
        old: [oldItem],
        item: this
      });

      // fire change event
      this.fireDataEvent("change",
        {
          start: index,
          end: index,
          type: "add/remove",
          added: [item],
          removed: [oldItem]
        }, null
      );
    },


    /**
     * This method returns the current length stored under .length on each
     * array.
     *
     * @return {Number} The current length of the array.
     */
    getLength: function() {
      return this.length;
    },


    /**
     * Returns the index of the item in the array. If the item is not in the
     * array, -1 will be returned.
     *
     * @param item {var} The item of which the index should be returned.
     * @return {Number} The Index of the given item.
     */
    indexOf: function(item) {
      return this.__array.indexOf(item);
    },

    /**
     * Returns the last index of the item in the array. If the item is not in the
     * array, -1 will be returned.
     *
     * @param item {var} The item of which the index should be returned.
     * @return {Number} The Index of the given item.
     */
    lastIndexOf: function(item) {
      return this.__array.lastIndexOf(item);
    },


    /**
     * Returns the toString of the original Array
     * @return {String} The array as a string.
     */
    toString: function() {
      if (this.__array != null) {
        return this.__array.toString();
      }
      return "";
    },


    /*
    ---------------------------------------------------------------------------
       IMPLEMENTATION OF THE QX.LANG.ARRAY METHODS
    ---------------------------------------------------------------------------
    */
    /**
     * Check if the given item is in the current array.
     *
     * @param item {var} The item which is possibly in the array.
     * @return {Boolean} true, if the array contains the given item.
     */
    contains: function(item) {
      return this.__array.indexOf(item) !== -1;
    },


    /**
     * Return a copy of the given arr
     *
     * @return {qx.data.Array} copy of this
     */
    copy : function() {
      return this.concat();
    },


    /**
     * Insert an element at a given position.
     *
     * @param index {Integer} Position where to insert the item.
     * @param item {var} The element to insert.
     */
    insertAt : function(index, item)
    {
      this.splice(index, 0, item).dispose();
    },


    /**
     * Insert an item into the array before a given item.
     *
     * @param before {var} Insert item before this object.
     * @param item {var} The item to be inserted.
     */
    insertBefore : function(before, item)
    {
      var index = this.indexOf(before);

      if (index == -1) {
        this.push(item);
      } else {
        this.splice(index, 0, item).dispose();
      }
    },


    /**
     * Insert an element into the array after a given item.
     *
     * @param after {var} Insert item after this object.
     * @param item {var} Object to be inserted.
     */
    insertAfter : function(after, item)
    {
      var index = this.indexOf(after);

      if (index == -1 || index == (this.length - 1)) {
        this.push(item);
      } else {
        this.splice(index + 1, 0, item).dispose();
      }
    },


    /**
     * Remove an element from the array at the given index.
     *
     * @param index {Integer} Index of the item to be removed.
     * @return {var} The removed item.
     */
    removeAt : function(index) {
      var returnArray = this.splice(index, 1);
      var item = returnArray.getItem(0);
      returnArray.dispose();
      return item;
    },


    /**
     * Remove all elements from the array.
     *
     * @return {Array} A native array containing the removed elements.
     */
    removeAll : function() {
      // remove all possible added event listeners
      for (var i = 0; i < this.__array.length; i++) {
        this._registerEventChaining(null, this.__array[i], i);
      }

      // ignore if array is empty
      if (this.getLength() == 0) {
        return [];
      }

      // store the old data
      var oldLength = this.getLength();
      var items = this.__array.concat();

      // change the length
      this.__array.length = 0;
      this.__updateLength();

      // fire change bubbles event
      this.fireDataEvent("changeBubble", {
        value: [],
        name: "0-" + (oldLength - 1),
        old: items,
        item: this
      });

      // fire the change event
      this.fireDataEvent("change",
        {
          start: 0,
          end: oldLength - 1,
          type: "remove",
          removed : items,
          added : []
        }, null
      );
      return items;
    },


    /**
     * Append the items of the given array.
     *
     * @param array {Array|qx.data.IListData} The items of this array will
     * be appended.
     * @throws {Error} if the second argument is not an array.
     */
    append : function(array)
    {
      // qooxdoo array support
      if (array instanceof qx.data.Array) {
        array = array.toArray();
      }

      // this check is important because opera throws an uncatchable error if
      // apply is called without an array as argument.
      if (qx.core.Environment.get("qx.debug")) {
        qx.core.Assert.assertArray(array, "The parameter must be an array.");
      }

      Array.prototype.push.apply(this.__array, array);

      // add a listener to the new items
      for (var i = 0; i < array.length; i++) {
        this._registerEventChaining(array[i], null, this.__array.length + i);
      }

      var oldLength = this.length;
      this.__updateLength();

      // fire change bubbles
      var name =
        oldLength == (this.length-1) ?
        oldLength :
        oldLength + "-" + (this.length-1);
      this.fireDataEvent("changeBubble", {
        value: array,
        name: name + "",
        old: [],
        item: this
      });

      // fire the change event
      this.fireDataEvent("change",
        {
          start: oldLength,
          end: this.length - 1,
          type: "add",
          added : array,
          removed : []
        }, null
      );
    },


    /**
     * Remove the given item.
     *
     * @param item {var} Item to be removed from the array.
     * @return {var} The removed item.
     */
    remove : function(item)
    {
      var index = this.indexOf(item);

      if (index != -1)
      {
        this.splice(index, 1).dispose();
        return item;
      }
    },


    /**
     * Check whether the given array has the same content as this.
     * Checks only the equality of the arrays' content.
     *
     * @param array {qx.data.Array} The array to check.
     * @return {Boolean} Whether the two arrays are equal.
     */
    equals : function(array)
    {
      if (this.length !== array.length) {
        return false;
      }

      for (var i = 0; i < this.length; i++)
      {
        if (this.getItem(i) !== array.getItem(i)) {
          return false;
        }
      }

      return true;
    },


    /**
     * Returns the sum of all values in the array. Supports
     * numeric values only.
     *
     * @return {Number} The sum of all values.
     */
    sum : function()
    {
      var result = 0;
      for (var i = 0; i < this.length; i++) {
        result += this.getItem(i);
      }

      return result;
    },


    /**
     * Returns the highest value in the given array.
     * Supports numeric values only.
     *
     * @return {Number | null} The highest of all values or undefined if the
     *   array is empty.
     */
    max : function()
    {
      var result = this.getItem(0);

      for (var i = 1; i < this.length; i++)
      {
        if (this.getItem(i) > result) {
          result = this.getItem(i);
        }
      }

      return result === undefined ? null : result;
    },


    /**
     * Returns the lowest value in the array. Supports
     * numeric values only.
     *
     * @return {Number | null} The lowest of all values or undefined
     *   if the array is empty.
     */
    min : function()
    {
      var result = this.getItem(0);

      for (var i = 1; i < this.length; i++)
      {
        if (this.getItem(i) < result) {
          result = this.getItem(i);
        }
      }

      return result === undefined ? null : result;
    },


    /**
     * Invokes the given function for every item in the array.
     *
     * @param callback {Function} The function which will be call for every
     *   item in the array. It will be invoked with three parameters:
     *   the item, the index and the array itself.
     * @param context {var} The context in which the callback will be invoked.
     */
    forEach : function(callback, context)
    {
      for (var i = 0; i < this.__array.length; i++) {
        callback.call(context, this.__array[i], i, this);
      }
    },


    /*
    ---------------------------------------------------------------------------
      Additional JS1.6 methods
    ---------------------------------------------------------------------------
    */
    /**
     * Creates a new array with all elements that pass the test implemented by
     * the provided function. It returns a new data array instance so make sure
     * to think about disposing it.
     * @param callback {Function} The test function, which will be executed for every
     *   item in the array. The function will have three arguments.
     *   <li><code>item</code>: the current item in the array</li>
     *   <li><code>index</code>: the index of the current item</li>
     *   <li><code>array</code>: The native array instance, NOT the data array instance.</li>
     * @param self {var?undefined} The context of the callback.
     * @return {qx.data.Array} A new array instance containing only the items
     *  which passed the test.
     */
    filter : function(callback, self) {
      return new qx.data.Array(this.__array.filter(callback, self));
    },


    /**
     * Creates a new array with the results of calling a provided function on every
     * element in this array. It returns a new data array instance so make sure
     * to think about disposing it.
     * @param callback {Function} The mapping function, which will be executed for every
     *   item in the array. The function will have three arguments.
     *   <li><code>item</code>: the current item in the array</li>
     *   <li><code>index</code>: the index of the current item</li>
     *   <li><code>array</code>: The native array instance, NOT the data array instance.</li>
     * @param self {var?undefined} The context of the callback.
     * @return {qx.data.Array} A new array instance containing the new created items.
     */
    map : function(callback, self) {
      return new qx.data.Array(this.__array.map(callback, self));
    },


    /**
     * Tests whether any element in the array passes the test implemented by the
     * provided function.
     * @param callback {Function} The test function, which will be executed for every
     *   item in the array. The function will have three arguments.
     *   <li><code>item</code>: the current item in the array</li>
     *   <li><code>index</code>: the index of the current item</li>
     *   <li><code>array</code>: The native array instance, NOT the data array instance.</li>
     * @param self {var?undefined} The context of the callback.
     * @return {Boolean} <code>true</code>, if any element passed the test function.
     */
    some : function(callback, self) {
      return this.__array.some(callback, self);
    },


    /**
     * Tests whether every element in the array passes the test implemented by the
     * provided function.
     * @param callback {Function} The test function, which will be executed for every
     *   item in the array. The function will have three arguments.
     *   <li><code>item</code>: the current item in the array</li>
     *   <li><code>index</code>: the index of the current item</li>
     *   <li><code>array</code>: The native array instance, NOT the data array instance.</li>
     * @param self {var?undefined} The context of the callback.
     * @return {Boolean} <code>true</code>, if every element passed the test function.
     */
    every : function(callback, self) {
      return this.__array.every(callback, self);
    },


    /**
     * Apply a function against an accumulator and each value of the array
     * (from left-to-right) as to reduce it to a single value.
     * @param callback {Function} The accumulator function, which will be
     *   executed for every item in the array. The function will have four arguments.
     *   <li><code>previousItem</code>: the previous item</li>
     *   <li><code>currentItem</code>: the current item in the array</li>
     *   <li><code>index</code>: the index of the current item</li>
     *   <li><code>array</code>: The native array instance, NOT the data array instance.</li>
     * @param initValue {var?undefined} Object to use as the first argument to the first
     *   call of the callback.
     * @return {var} The returned value of the last accumulator call.
     */
    reduce : function(callback, initValue) {
      return this.__array.reduce(callback, initValue);
    },


    /**
     * Apply a function against an accumulator and each value of the array
     * (from right-to-left) as to reduce it to a single value.
     * @param callback {Function} The accumulator function, which will be
     *   executed for every item in the array. The function will have four arguments.
     *   <li><code>previousItem</code>: the previous item</li>
     *   <li><code>currentItem</code>: the current item in the array</li>
     *   <li><code>index</code>: the index of the current item</li>
     *   <li><code>array</code>: The native array instance, NOT the data array instance.</li>
     * @param initValue {var?undefined} Object to use as the first argument to the first
     *   call of the callback.
     * @return {var} The returned value of the last accumulator call.
     */
    reduceRight : function(callback, initValue) {
      return this.__array.reduceRight(callback, initValue);
    },


    /*
    ---------------------------------------------------------------------------
      INTERNAL HELPERS
    ---------------------------------------------------------------------------
    */
    /**
     * Internal function which updates the length property of the array.
     * Every time the length will be updated, a {@link #changeLength} data
     * event will be fired.
     */
    __updateLength: function() {
      var oldLength = this.length;
      this.length = this.__array.length;
      this.fireDataEvent("changeLength", this.length, oldLength);
    },


    /**
     * Helper to update the event propagation for a range of items.
     * @param from {Number} Start index.
     * @param to {Number} End index.
     */
    __updateEventPropagation : function(from, to) {
      for (var i=from; i < to; i++) {
        this._registerEventChaining(this.__array[i], this.__array[i], i);
      };
    }
  },



  /*
   *****************************************************************************
      DESTRUCTOR
   *****************************************************************************
  */

  destruct : function() {
    for (var i = 0; i < this.__array.length; i++) {
      var item = this.__array[i];
      this._applyEventPropagation(null, item, i);

      // dispose the items on auto dispose
      if (this.isAutoDisposeItems() && item && item instanceof qx.core.Object) {
        item.dispose();
      }
    }

    this.__array = null;
  }
});
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
     * Tristan Koch (tristankoch)

************************************************************************ */

/**
 * AbstractRequest serves as a base class for {@link qx.io.request.Xhr}
 * and {@link qx.io.request.Jsonp}. It contains methods to conveniently
 * communicate with transports found in {@link qx.bom.request}.
 *
 * The general procedure to derive a new request is to choose a
 * transport (override {@link #_createTransport}) and link
 * the transport’s response (override {@link #_getParsedResponse}).
 * The transport must implement {@link qx.bom.request.IRequest}.
 *
 * To adjust the behavior of {@link #send} override
 * {@link #_getConfiguredUrl} and {@link #_getConfiguredRequestHeaders}.
 */
qx.Class.define("qx.io.request.AbstractRequest",
{
  type : "abstract",

  extend : qx.core.Object,

  /**
   * @param url {String?} The URL of the resource to request.
   */
  construct : function(url)
  {
    this.base(arguments);

    if (url !== undefined) {
      this.setUrl(url);
    }

    this.__requestHeaders = {};

    var transport = this._transport = this._createTransport();
    this._setPhase("unsent");

    this.__onReadyStateChangeBound = qx.lang.Function.bind(this._onReadyStateChange, this);
    this.__onLoadBound = qx.lang.Function.bind(this._onLoad, this);
    this.__onLoadEndBound = qx.lang.Function.bind(this._onLoadEnd, this);
    this.__onAbortBound = qx.lang.Function.bind(this._onAbort, this);
    this.__onTimeoutBound = qx.lang.Function.bind(this._onTimeout, this);
    this.__onErrorBound = qx.lang.Function.bind(this._onError, this);

    transport.onreadystatechange = this.__onReadyStateChangeBound;
    transport.onload = this.__onLoadBound;
    transport.onloadend = this.__onLoadEndBound;
    transport.onabort = this.__onAbortBound;
    transport.ontimeout = this.__onTimeoutBound;
    transport.onerror = this.__onErrorBound;
  },

  events :
  {
    /**
     * Fired on every change of the transport’s readyState.
     */
    "readyStateChange": "qx.event.type.Event",

    /**
     * Fired when request completes without error and transport’s status
     * indicates success.
     */
    "success": "qx.event.type.Event",

    /**
     * Fired when request completes without error.
     */
    "load": "qx.event.type.Event",

    /**
     * Fired when request completes with or without error.
     */
    "loadEnd": "qx.event.type.Event",

    /**
     * Fired when request is aborted.
     */
    "abort": "qx.event.type.Event",

    /**
     * Fired when request reaches timeout limit.
     */
    "timeout": "qx.event.type.Event",

    /**
     * Fired when request completes with error.
     */
    "error": "qx.event.type.Event",

    /**
     * Fired when request completes without error but erroneous HTTP status.
     */
    "statusError": "qx.event.type.Event",

    /**
     * Fired on timeout, error or remote error.
     *
     * This event is fired for convenience. Usually, it is recommended
     * to handle error related events in a more granular approach.
     */
    "fail": "qx.event.type.Event",

    /**
    * Fired on change of the parsed response.
    *
    * This event allows to use data binding with the
    * parsed response as source.
    *
    * For example, to bind the response to the value of a label:
    *
    * <pre class="javascript">
    * // req is an instance of qx.io.request.*,
    * // label an instance of qx.ui.basic.Label
    * req.bind("response", label, "value");
    * </pre>
    *
    * The response is parsed (and therefore changed) only
    * after the request completes successfully. This means
    * that when a new request is made the initial emtpy value
    * is ignored, instead only the final value is bound.
    *
    */
    "changeResponse": "qx.event.type.Data",

    /**
     * Fired on change of the phase.
     */
    "changePhase": "qx.event.type.Data"
  },

  properties :
  {
    /**
     * The URL of the resource to request.
     *
     * Note: Depending on the configuration of the request
     * and/or the transport chosen, query params may be appended
     * automatically.
     */
    url: {
      check: "String"
    },


    /**
     * Timeout limit in milliseconds. Default (0) means no limit.
     */
    timeout: {
      check: "Number",
      nullable: true,
      init: 0
    },

    /**
     * Data to be send as part of the request.
     *
     * Supported types:
     *
     * * String
     * * Map
     * * qooxdoo Object
     *
     * For every supported type except strings, a URL encoded string
     * with unsafe characters escaped is internally generated and sent
     * as part of the request.
     *
     * Depending on the underlying transport and its configuration, the request
     * data is transparently included as URL query parameters or embedded in the
     * request body as form data.
     *
     * If a string is given the user must make sure it is properly formatted and
     * escaped. See {@link qx.util.Serializer#toUriParameter}.
     *
     */
    requestData: {
      check: function(value) {
        return qx.lang.Type.isString(value) ||
               qx.Class.isSubClassOf(value.constructor, qx.core.Object) ||
               qx.lang.Type.isObject(value);
      },
      nullable: true
    },

    /**
     * Authentication delegate.
     *
     * The delegate must implement {@link qx.io.request.authentication.IAuthentication}.
     */
    authentication: {
      check: "qx.io.request.authentication.IAuthentication",
      nullable: true
    }
  },

  members :
  {

    /**
     * Bound handlers.
     */
    __onReadyStateChangeBound: null,
    __onLoadBound: null,
    __onLoadEndBound: null,
    __onAbortBound: null,
    __onTimeoutBound: null,
    __onErrorBound: null,

    /**
     * Parsed response.
     */
    __response: null,

    /**
     * Abort flag.
     */
     __abort: null,

    /**
     * Current phase.
     */
    __phase: null,

    /**
     * Request headers.
     */
    __requestHeaders: null,

    /**
     * Request headers (deprecated).
     */
    __requestHeadersDeprecated: null,

    /**
     * Holds transport.
     */
    _transport: null,

    /*
    ---------------------------------------------------------------------------
      CONFIGURE TRANSPORT
    ---------------------------------------------------------------------------
    */

    /**
     * Create and return transport.
     *
     * This method MUST be overridden, unless the constructor is overridden as
     * well. It is called by the constructor and should return the transport that
     * is to be interfaced.
     *
     * @return {qx.bom.request} Transport.
     */
    _createTransport: function() {
      throw new Error("Abstract method call");
    },

    /**
     * Get configured URL.
     *
     * A configured URL typically includes a query string that
     * encapsulates transport specific settings such as request
     * data or no-cache settings.
     *
     * This method MAY be overridden. It is called in {@link #send}
     * before the request is initialized.
     *
     * @return {String} The configured URL.
     */
    _getConfiguredUrl: function() {},

    /**
     * Get configuration related request headers.
     *
     * This method MAY be overridden to add request headers for features limited
     * to a certain transport.
     *
     * @return {Map} Map of request headers.
     */
    _getConfiguredRequestHeaders: function() {},

    /**
     * Get parsed response.
     *
     * Is called in the {@link #_onReadyStateChange} event handler
     * to parse and store the transport’s response.
     *
     * This method MUST be overridden.
     *
     * @return {String} The parsed response of the request.
     */
    _getParsedResponse: function() {
      throw new Error("Abstract method call");
    },

    /**
     * Get method.
     *
     * This method MAY be overridden. It is called in {@link #send}
     * before the request is initialized.
     *
     * @return {String} The method.
     */
    _getMethod: function() {
      return "GET";
    },

    /**
     * Whether async.
     *
     * This method MAY be overridden. It is called in {@link #send}
     * before the request is initialized.
     *
     * @return {Boolean} Whether to process asynchronously.
     */
    _isAsync: function() {
      return true;
    },

    /*
    ---------------------------------------------------------------------------
      INTERACT WITH TRANSPORT
    ---------------------------------------------------------------------------
    */

    /**
     * Send request.
     */
    send: function() {
      var transport = this._transport,
          url, method, async, serializedData;

      //
      // Open request
      //

      url = this._getConfiguredUrl();

      // Drop fragment (anchor) from URL as per
      // http://www.w3.org/TR/XMLHttpRequest/#the-open-method
      if (/\#/.test(url)) {
        url = url.replace(/\#.*/, "");
      }

      transport.timeout = this.getTimeout();

      // Support transports with enhanced feature set
      method = this._getMethod();
      async = this._isAsync();

      // Open
      if (qx.core.Environment.get("qx.debug.io")) {
        this.debug("Open low-level request with method: " +
          method + ", url: " + url + ", async: " + async);
      }

      transport.open(method, url, async);
      this._setPhase("opened");

      //
      // Send request
      //

      serializedData = this._serializeData(this.getRequestData());

      this._setRequestHeaders();

      // Send
      if (qx.core.Environment.get("qx.debug.io")) {
        this.debug("Send low-level request");
      }
      method == "GET" ? transport.send() : transport.send(serializedData);
      this._setPhase("sent");
    },

    /**
     * Abort request.
     */
    abort: function() {
       if (qx.core.Environment.get("qx.debug.io")) {
         this.debug("Abort request");
       }
       this.__abort = true;

       // Update phase to "abort" before user handler are invoked [BUG #5485]
       this.__phase = "abort";

       this._transport.abort();
    },

    /*
    ---------------------------------------------------------------------------
     REQUEST HEADERS
    ---------------------------------------------------------------------------
    */

    /**
     * Apply configured request headers to transport.
     *
     * This method MAY be overridden to customize application of request headers
     * to transport.
     */
    _setRequestHeaders: function() {
      var transport = this._transport,
          requestHeaders = this._getAllRequestHeaders();

      for (var key in requestHeaders) {
        transport.setRequestHeader(key, requestHeaders[key]);
      }

    },

    /**
     * Get all request headers.
     *
     * @return {Map} All request headers.
     */
    _getAllRequestHeaders: function() {
      var requestHeaders = {};
      // Transport specific headers
      qx.lang.Object.mergeWith(requestHeaders, this._getConfiguredRequestHeaders());
      // Authentication delegate
      qx.lang.Object.mergeWith(requestHeaders, this.__getAuthRequestHeaders());
      // User-defined, requestHeaders property (deprecated)
      qx.lang.Object.mergeWith(requestHeaders, this.__requestHeadersDeprecated);
      // User-defined
      qx.lang.Object.mergeWith(requestHeaders, this.__requestHeaders);

      return requestHeaders;
    },

    /**
    * Retrieve authentication headers from auth delegate.
    *
    * @return {Map} Authentication related request headers.
    */
    __getAuthRequestHeaders: function() {
      var auth = this.getAuthentication(),
          headers = {};

      if (auth) {
        auth.getAuthHeaders().forEach(function(header) {
          headers[header.key] = header.value;
        });
        return headers;
      }
    },

    /**
     * Set a request header.
     *
     * Note: Setting request headers has no effect after the request was send.
     *
     * @param key {String} Key of the header.
     * @param value {String} Value of the header.
     */
    setRequestHeader: function(key, value) {
      this.__requestHeaders[key] = value;
    },

    /**
     * Get a request header.
     *
     * @param key {String} Key of the header.
     * @return {String} The value of the header.
     */
    getRequestHeader: function(key) {
       return this.__requestHeaders[key];
    },

    /**
     * Remove a request header.
     *
     * Note: Removing request headers has no effect after the request was send.
     *
     * @param key {String} Key of the header.
     */
    removeRequestHeader: function(key) {
      if (this.__requestHeaders[key]) {
       delete this.__requestHeaders[key];
      }
    },


    /*
    ---------------------------------------------------------------------------
     QUERY TRANSPORT
    ---------------------------------------------------------------------------
    */

    /**
     * Get low-level transport.
     *
     * Note: To be used with caution!
     *
     * This method can be used to query the transport directly,
     * but should be used with caution. Especially, it
     * is not advisable to call any destructive methods
     * such as <code>open</code> or <code>send</code>.
     *
     * @return {Object} An instance of a class found in
     *  <code>qx.bom.request.*</code>
     */

     // This method mainly exists so that some methods found in the
     // low-level transport can be deliberately omitted here,
     // but still be accessed should it be absolutely necessary.
     //
     // Valid use cases include to query the transport’s responseXML
     // property if performance is critical and any extra parsing
     // should be avoided at all costs.
     //
    getTransport: function() {
      return this._transport;
    },

    /**
     * Get current ready state.
     *
     * States can be:
     * UNSENT:           0,
     * OPENED:           1,
     * HEADERS_RECEIVED: 2,
     * LOADING:          3,
     * DONE:             4
     *
     * @return {Number} Ready state.
     */
    getReadyState: function() {
      return this._transport.readyState;
    },

    /**
     * Get current phase.
     *
     * A more elaborate version of {@link #getReadyState}, this method indicates
     * the current phase of the request. Maps to stateful (i.e. deterministic)
     * events (success, abort, timeout, statusError) and intermediate
     * readyStates (unsent, configured, loading, load).
     *
     * When the requests is successful, it progresses the states:<br>
     * 'unsent', 'opened', 'sent', 'loading', 'load', 'success'
     *
     * In case of failure, the final state is one of:<br>
     * 'abort', 'timeout', 'statusError'
     *
     * For each change of the phase, a {@link #changePhase} data event is fired.
     *
     * @return {String} Current phase.
     *
     */
    getPhase: function() {
      return this.__phase;
    },

    /**
     * Get status code.
     *
     * @return {Number} The transport’s status code.
     */
    getStatus: function() {
      return this._transport.status;
    },

    /**
     * Get status text.
     *
     * @return {String} The transport’s status text.
     */
    getStatusText: function() {
      return this._transport.statusText;
    },

    /**
     * Get raw (unprocessed) response.
     *
     * @return {String} The raw response of the request.
     */
    getResponseText: function() {
      return this._transport.responseText;
    },

    /**
     * Get all response headers from response.
     *
     * @return {String} All response headers.
     */
    getAllResponseHeaders: function() {
      return this._transport.getAllResponseHeaders();
    },

    /**
     * Get a single response header from response.
     *
     * @param key {String}
     *   Key of the header to get the value from.
     * @return {String}
     *   Response header.
     */
    getResponseHeader: function(key) {
      return this._transport.getResponseHeader(key);
    },

    /**
     * Override the content type response header from response.
     *
     * @param contentType {String}
     *   Content type for overriding.
     * @see qx.bom.request.Xhr#overrideMimeType
     */
    overrideResponseContentType: function(contentType) {
      return this._transport.overrideMimeType(contentType);
    },

    /**
     * Get the content type response header from response.
     *
     * @return {String}
     *   Content type response header.
     */
    getResponseContentType: function() {
      return this.getResponseHeader("Content-Type");
    },

    /**
     * Whether request completed (is done).
     */
    isDone: function() {
      return this.getReadyState() === 4;
    },

    /*
    ---------------------------------------------------------------------------
      RESPONSE
    ---------------------------------------------------------------------------
    */

    /**
     * Get parsed response.
     *
     * @return {String} The parsed response of the request.
     */
    getResponse: function() {
      return this.__response;
    },

    /**
     * Set response.
     *
     * @param response {String} The parsed response of the request.
     */
    _setResponse: function(response) {
      var oldResponse = response;

      if (this.__response !== response) {
        this.__response = response;
        this.fireEvent("changeResponse", qx.event.type.Data, [this.__response, oldResponse]);
      }
    },

    /*
    ---------------------------------------------------------------------------
      EVENT HANDLING
    ---------------------------------------------------------------------------
    */

    /**
     * Handle "readyStateChange" event.
     */
    _onReadyStateChange: function() {
      var readyState = this.getReadyState();

      if (qx.core.Environment.get("qx.debug.io")) {
        this.debug("Fire readyState: " + readyState);
      }

      this.fireEvent("readyStateChange");

      // Transport switches to readyState DONE on abort and may already
      // have successful HTTP status when response is served from cache.
      //
      // Not fire custom event "loading" (or "success", when cached).
      if (this.__abort) {
        return;
      }

      if (readyState === 3) {
        this._setPhase("loading");
      }

      if (this.isDone()) {
        this.__onReadyStateDone();
      }
    },

    /**
     * Called internally when readyState is DONE.
     */
    __onReadyStateDone: function() {
      if (qx.core.Environment.get("qx.debug.io")) {
        this.debug("Request completed with HTTP status: " + this.getStatus());
      }

      // Event "load" fired in onLoad
      this._setPhase("load");

      // Successful HTTP status
      if (qx.util.Request.isSuccessful(this.getStatus())) {

        // Parse response
        if (qx.core.Environment.get("qx.debug.io")) {
          this.debug("Response is of type: '" + this.getResponseContentType() + "'");
        }

        this._setResponse(this._getParsedResponse());

        this._fireStatefulEvent("success");

      // Erroneous HTTP status
      } else {

        try {
          this._setResponse(this._getParsedResponse());
        } catch (e) {
          // ignore if it does not work
        }

        // A remote error failure
        if (this.getStatus() !== 0) {
          this._fireStatefulEvent("statusError");
          this.fireEvent("fail");
        }
      }
    },

    /**
     * Handle "load" event.
     */
    _onLoad: function() {
      this.fireEvent("load");
    },

    /**
     * Handle "loadEnd" event.
     */
    _onLoadEnd: function() {
      this.fireEvent("loadEnd");
    },

    /**
     * Handle "abort" event.
     */
    _onAbort: function() {
      this._fireStatefulEvent("abort");
    },

    /**
     * Handle "timeout" event.
     */
    _onTimeout: function() {
      this._fireStatefulEvent("timeout");

      // A network error failure
      this.fireEvent("fail");
    },

    /**
     * Handle "error" event.
     */
    _onError: function() {
      this.fireEvent("error");

      // A network error failure
      this.fireEvent("fail");
    },

    /*
    ---------------------------------------------------------------------------
      INTERNAL / HELPERS
    ---------------------------------------------------------------------------
    */

    /**
     * Fire stateful event.
     *
     * Fires event and sets phase to name of event.
     *
     * @param evt {String} Name of the event to fire.
     */
    _fireStatefulEvent: function(evt) {
      if (qx.core.Environment.get("qx.debug")) {
        qx.core.Assert.assertString(evt);
      }
      this._setPhase(evt);
      this.fireEvent(evt);
    },

    /**
     * Set phase.
     *
     * @param phase {String} The phase to set.
     */
    _setPhase: function(phase) {
      var previousPhase = this.__phase;

      if (qx.core.Environment.get("qx.debug")) {
        qx.core.Assert.assertString(phase);
        qx.core.Assert.assertMatch(phase,
          /^(unsent)|(opened)|(sent)|(loading)|(load)|(success)|(abort)|(timeout)|(statusError)$/);
      }

      this.__phase = phase;
      this.fireDataEvent("changePhase", phase, previousPhase);
    },

    /**
     * Serialize data.
     *
     * @param data {String|Map|qx.core.Object} Data to serialize.
     * @return {String|null} Serialized data.
     */
    _serializeData: function(data) {
      var isPost = typeof this.getMethod !== "undefined" && this.getMethod() == "POST",
          isJson = (/application\/.*\+?json/).test(this.getRequestHeader("Content-Type"));

      if (!data) {
        return null;
      }

      if (qx.lang.Type.isString(data)) {
        return data;
      }

      if (qx.Class.isSubClassOf(data.constructor, qx.core.Object)) {
        return qx.util.Serializer.toUriParameter(data);
      }

      if (isJson && (qx.lang.Type.isObject(data) || qx.lang.Type.isArray(data))) {
        return qx.lang.Json.stringify(data);
      }

      if (qx.lang.Type.isObject(data)) {
        return qx.util.Uri.toParameter(data, isPost);
      }
    }
  },

  environment:
  {
    "qx.debug.io": false
  },

  destruct: function()
  {
    var transport = this._transport,
        noop = function() {};

    if (this._transport) {
      transport.onreadystatechange = transport.onload = transport.onloadend =
      transport.onabort = transport.ontimeout = transport.onerror = noop;

      transport.dispose();
    }
  }
});
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
     * Tristan Koch (tristankoch)
     * Richard Sternagel (rsternagel)

************************************************************************ */

/**
 * Static helpers for handling HTTP requests.
 */
qx.Bootstrap.define("qx.util.Request",
{
  statics:
  {
    /**
     * Whether URL given points to resource that is cross-domain,
     * i.e. not of same origin.
     *
     * @param url {String} URL.
     * @return {Boolean} Whether URL is cross domain.
     */
    isCrossDomain: function(url) {
      var result = qx.util.Uri.parseUri(url),
          location = window.location;

      if (!location) {
        return false;
      }

      var protocol = location.protocol;

      // URL is relative in the sence that it points to origin host
      if (!(url.indexOf("//") !== -1)) {
        return false;
      }

      if (protocol.substr(0, protocol.length-1) == result.protocol &&
          location.host === result.host &&
          location.port === result.port) {
        return false;
      }

      return true;
    },

    /**
     * Determine if given HTTP status is considered successful.
     *
     * @param status {Number} HTTP status.
     * @return {Boolean} Whether status is considered successful.
     */
    isSuccessful: function(status) {
      return (status >= 200 && status < 300 || status === 304);
    },

    /**
     * Determine if given HTTP method is valid.
     *
     * @param method {String} HTTP method.
     * @return {Boolean} Whether method is a valid HTTP method.
     */
    isMethod: function(method) {
      var knownMethods = ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS", "TRACE", "CONNECT", "PATCH"];
      return (knownMethods.indexOf(method) !== -1) ? true : false;
    },

    /**
     * Request body is ignored for HTTP method GET and HEAD.
     *
     * See http://www.w3.org/TR/XMLHttpRequest2/#the-send-method.
     *
     * @param method {String} The HTTP method.
     * @return {Boolean} Whether request may contain body.
     */
    methodAllowsRequestBody: function(method) {
      return !((/^(GET|HEAD)$/).test(method));
    }
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2004-2009 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Martin Wittemann (martinwittemann)

************************************************************************ */

/**
 * This is an util class responsible for serializing qooxdoo objects.
 *
 * @ignore(qx.data, qx.data.IListData)
 * @ignore(qx.locale, qx.locale.LocalizedString)
 */
qx.Class.define("qx.util.Serializer",
{
  statics :
  {

    /**
     * Serializes the properties of the given qooxdoo object. To get the
     * serialization working, every property needs to have a string
     * representation because the value of the property will be concatenated to the
     * serialized string.
     *
     * @param object {qx.core.Object} Any qooxdoo object
     * @param qxSerializer {Function} Function used for serializing qooxdoo
     *   objects stored in the propertys of the object. Check for the type of
     *   classes <ou want to serialize and return the serialized value. In all
     *   other cases, just return nothing.
     * @param dateFormat {qx.util.format.DateFormat} If a date formater is given,
     *   the format method of this given formater is used to convert date
     *   objects into strings.
     * @return {String} The serialized object.
     */
    toUriParameter : function(object, qxSerializer, dateFormat)
    {
      var result = "";
      var properties = qx.util.PropertyUtil.getAllProperties(object.constructor);

      for (var name in properties) {
        // ignore property groups
        if (properties[name].group != undefined) {
          continue;
        }
        var value = object["get" + qx.lang.String.firstUp(name)]();

        // handle arrays
        if (qx.lang.Type.isArray(value)) {
          var isdataArray = qx.data && qx.data.IListData &&
            qx.Class.hasInterface(value && value.constructor, qx.data.IListData);
          for (var i = 0; i < value.length; i++) {
            var valueAtI = isdataArray ? value.getItem(i) : value[i];
            result += this.__toUriParameter(name, valueAtI, qxSerializer);
          }
        } else if (qx.lang.Type.isDate(value) && dateFormat != null) {
          result += this.__toUriParameter(
            name, dateFormat.format(value), qxSerializer
          );
        } else {
          result += this.__toUriParameter(name, value, qxSerializer);
        }
      }
      return result.substring(0, result.length - 1);
    },


    /**
     * Helper method for {@link #toUriParameter}. Check for qooxdoo objects
     * and returns the serialized name value pair for the given parameter.
     *
     * @param name {String} The name of the value
     * @param value {var} The value itself
     * @param qxSerializer {Function} The serializer for qooxdoo objects.
     * @return {String} The serialized name value pair.
     */
    __toUriParameter : function(name, value, qxSerializer)
    {

      if (value && value.$$type == "Class") {
        value = value.classname;
      }

      if (value && (value.$$type == "Interface" || value.$$type == "Mixin")) {
        value = value.name;
      }

      if (value instanceof qx.core.Object && qxSerializer != null) {
        var encValue = encodeURIComponent(qxSerializer(value));
        if (encValue === undefined) {
          var encValue = encodeURIComponent(value);
        }
      } else {
        var encValue = encodeURIComponent(value);
      }
      return encodeURIComponent(name) + "=" + encValue + "&";
    },


    /**
     * Serializes the properties of the given qooxdoo object into a native
     * object.
     *
     * @param object {qx.core.Object}
     *   Any qooxdoo object
     *
     * @param qxSerializer {Function}
     *   Function used for serializing qooxdoo objects stored in the propertys
     *   of the object. Check for the type of classes you want to serialize
     *   and return the serialized value. In all other cases, just return
     *   nothing.
     * @param dateFormat {qx.util.format.DateFormat} If a date formater is given,
     *   the format method of this given formater is used to convert date
     *   objects into strings.
     * @return {String}
     *   The serialized object.
     */
    toNativeObject : function(object, qxSerializer, dateFormat)
    {
      var result;

      // null or undefined
      if (object == null)
      {
        return null;
      }

      // data array
      if (qx.data && qx.data.IListData && qx.Class.hasInterface(object.constructor, qx.data.IListData))
      {
        result = [];
        for (var i = 0; i < object.getLength(); i++)
        {
          result.push(qx.util.Serializer.toNativeObject(
            object.getItem(i), qxSerializer, dateFormat)
          );
        }

        return result;
      }

      // other arrays
      if (qx.lang.Type.isArray(object))
      {
        result = [];
        for (var i = 0; i < object.length; i++)
        {
          result.push(qx.util.Serializer.toNativeObject(
            object[i], qxSerializer, dateFormat)
          );
        }

        return result;
      }

      // return names for qooxdoo classes
      if (object.$$type == "Class") {
        return object.classname;
      }

      // return names for qooxdoo interfaces and mixins
      if (object.$$type == "Interface" || object.$$type == "Mixin") {
        return object.name;
      }

      // qooxdoo object
      if (object instanceof qx.core.Object)
      {
        if (qxSerializer != null)
        {
          var returnValue = qxSerializer(object);

          // if we have something returned, return that
          if (returnValue != undefined)
          {
            return returnValue;
          }

          // continue otherwise
        }

        result = {};

        var properties =
          qx.util.PropertyUtil.getAllProperties(object.constructor);

        for (var name in properties)
        {
          // ignore property groups
          if (properties[name].group != undefined)
          {
            continue;
          }

          var value = object["get" + qx.lang.String.firstUp(name)]();
          result[name] = qx.util.Serializer.toNativeObject(
            value, qxSerializer, dateFormat
          );
        }

        return result;
      }

      // date objects with date format
      if (qx.lang.Type.isDate(object) && dateFormat != null) {
        return dateFormat.format(object);
      }

      // localized strings
      if (qx.locale && qx.locale.LocalizedString && object instanceof qx.locale.LocalizedString) {
        return object.toString();
      }

      // JavaScript objects
      if (qx.lang.Type.isObject(object))
      {
        result = {};

        for (var key in object)
        {
          result[key] = qx.util.Serializer.toNativeObject(
            object[key], qxSerializer, dateFormat
          );
        }

        return result;
      }

      // all other stuff, including String, Date, RegExp
      return object;
    },


    /**
     * Serializes the properties of the given qooxdoo object into a json object.
     *
     * @param object {qx.core.Object} Any qooxdoo object
     * @param qxSerializer {Function?} Function used for serializing qooxdoo
     *   objects stored in the propertys of the object. Check for the type of
     *   classes <ou want to serialize and return the serialized value. In all
     *   other cases, just return nothing.
     * @param dateFormat {qx.util.format.DateFormat?} If a date formater is given,
     *   the format method of this given formater is used to convert date
     *   objects into strings.
     * @return {String} The serialized object.
     */
    toJson : function(object, qxSerializer, dateFormat) {
      var result = "";

      // null or undefined
      if (object == null) {
        return "null";
      }

      // data array
      if (qx.data && qx.data.IListData && qx.Class.hasInterface(object.constructor, qx.data.IListData)) {
        result += "[";
        for (var i = 0; i < object.getLength(); i++) {
          result += qx.util.Serializer.toJson(object.getItem(i), qxSerializer, dateFormat) + ",";
        }
        if (result != "[") {
          result = result.substring(0, result.length - 1);
        }
        return result + "]";
      }

      // other arrays
      if (qx.lang.Type.isArray(object)) {
        result += "[";
        for (var i = 0; i < object.length; i++) {
          result += qx.util.Serializer.toJson(object[i], qxSerializer, dateFormat) + ",";
        }
        if (result != "[") {
          result = result.substring(0, result.length - 1);
        }
        return result + "]";
      }

      // return names for qooxdoo classes
      if (object.$$type == "Class") {
        return '"' + object.classname + '"';
      }

      // return names for qooxdoo interfaces and mixins
      if (object.$$type == "Interface" || object.$$type == "Mixin") {
        return '"' + object.name + '"';
      }


      // qooxdoo object
      if (object instanceof qx.core.Object) {
        if (qxSerializer != null) {
          var returnValue = qxSerializer(object);
          // if we have something returned, ruturn that
          if (returnValue != undefined) {
            return '"' + returnValue + '"';
          }
          // continue otherwise
        }
        result += "{";
        var properties = qx.util.PropertyUtil.getAllProperties(object.constructor);
        for (var name in properties) {
          // ignore property groups
          if (properties[name].group != undefined) {
            continue;
          }
          var value = object["get" + qx.lang.String.firstUp(name)]();
          result += '"' + name + '":' + qx.util.Serializer.toJson(value, qxSerializer, dateFormat) + ",";
        }
        if (result != "{") {
          result = result.substring(0, result.length - 1);
        }
        return result + "}";
      }

      // localized strings
      if (qx.locale && qx.locale.LocalizedString && object instanceof qx.locale.LocalizedString) {
        object = object.toString();
        // no return here because we want to have the string checks as well!
      }

      // date objects with formater
      if (qx.lang.Type.isDate(object) && dateFormat != null) {
        return '"' + dateFormat.format(object) + '"';
      }

      // javascript objects
      if (qx.lang.Type.isObject(object)) {
        result += "{";
        for (var key in object) {
          result += '"' + key + '":' +
                    qx.util.Serializer.toJson(object[key], qxSerializer, dateFormat) + ",";
        }
        if (result != "{") {
          result = result.substring(0, result.length - 1);
        }
        return result + "}";
      }

      // strings
      if (qx.lang.Type.isString(object)) {
        // escape
        object = object.replace(/([\\])/g, '\\\\');
        object = object.replace(/(["])/g, '\\"');
        object = object.replace(/([\r])/g, '\\r');
        object = object.replace(/([\f])/g, '\\f');
        object = object.replace(/([\n])/g, '\\n');
        object = object.replace(/([\t])/g, '\\t');
        object = object.replace(/([\b])/g, '\\b');

        return '"' + object + '"';
      }

      // Date and RegExp
      if (qx.lang.Type.isDate(object) || qx.lang.Type.isRegExp(object)) {
        return '"' + object + '"';
      }

      // all other stuff
      return object + "";
    }
  }
});
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
     * Tristan Koch (tristankoch)

************************************************************************ */

/**
 * Send HTTP requests and handle responses using the HTTP client API.
 *
 * Configuration of the request is done with properties. Events are fired for
 * various states in the life cycle of a request, such as "success". Request
 * data is transparently processed.
 *
 * Here is how to request a JSON file and listen to the "success" event:
 *
 * <pre class="javascript">
 * var req = new qx.io.request.Xhr("/some/path/file.json");
 *
 * req.addListener("success", function(e) {
 *   var req = e.getTarget();
 *
 *   // Response parsed according to the server's
 *   // response content type, e.g. JSON
 *   req.getResponse();
 * }, this);
 *
 * // Send request
 * req.send();
 * </pre>
 *
 * Some noteable features:
 *
 * * Abstraction of low-level request
 * * Convenient setup using properties
 * * Fine-grained events
 * * Symbolic phases
 * * Transparent processing of request data
 * * Stream-lined authentication
 * * Automagic parsing of response based on content type
 *
 * Cross-origin requests are supported, but require browser support
 * (see <a href="http://caniuse.com/#search=CORS">caniuse.com</a>) and backend configuration
 * (see <a href="https://developer.mozilla.org/en-US/docs/docs/HTTP/Access_control_CORS>MDN</a>).
 * Note that IE's <code>XDomainRequest</code> is not currently supported.
 * For a cross-browser alternative, consider {@link qx.io.request.Jsonp}.
 *
 * In order to debug requests, set the environment flag
 * <code>qx.debug.io</code>.
 *
 * Internally uses {@link qx.bom.request.Xhr}.
 */
qx.Class.define("qx.io.request.Xhr",
{
  extend: qx.io.request.AbstractRequest,

  /**
   * @param url {String?} The URL of the resource to request.
   * @param method {String?} The HTTP method.
   */
  construct: function(url, method) {
    if (method !== undefined) {
      this.setMethod(method);
    }

    this.base(arguments, url);
    this._parser = this._createResponseParser();
  },

  // Only document events with transport specific details.
  // For a complete list of events, refer to AbstractRequest.

  events:
  {
    /**
     * Fired on every change of the transport’s readyState.
     *
     * See {@link qx.bom.request.Xhr} for available readyStates.
     */
    "readyStateChange": "qx.event.type.Event",

    /**
    * Fired when request completes without eror and transport’s status
    * indicates success.
     *
     * Refer to {@link qx.util.Request#isSuccessful} for a list of HTTP
     * status considered successful.
     */
    "success": "qx.event.type.Event",

    /**
     * Fired when request completes without error.
     *
     * Every request not canceled or aborted completes. This means that
     * even requests receiving a response with erroneous HTTP status
     * fire a "load" event. If you are only interested in successful
     * responses, listen to the {@link #success} event instead.
     */
    "load": "qx.event.type.Event",

    /**
     * Fired when request completes without error but erroneous HTTP status.
     *
     * Refer to {@link qx.util.Request#isSuccessful} for a list of HTTP
     * status considered successful.
     */
    "statusError": "qx.event.type.Event"
  },

  properties:
  {
    /**
     * The HTTP method.
     */
    method: {
      init: "GET"
    },

    /**
     * Whether the request should be executed asynchronously.
     */
    async: {
      check: "Boolean",
      init: true
    },

    /**
     * The content type to accept. By default, every content type
     * is accepted.
     *
     * Note: Some backends send distinct representations of the same
     * resource depending on the content type accepted. For instance,
     * a backend may respond with either a JSON (the accept header
     * indicates so) or a HTML representation (the default, no accept
     * header given).
     */
    accept: {
      check: "String",
      nullable: true
    },

    /**
     * Whether to allow request to be answered from cache.
     *
     * Allowed values:
     *
     * * <code>true</code>: Allow caching (Default)
     * * <code>false</code>: Prohibit caching. Appends nocache parameter to URL.
     * * <code>String</code>: Any Cache-Control request directive
     *
     * If a string is given, it is inserted in the request's Cache-Control
     * header. A request’s Cache-Control header may contain a number of directives
     * controlling the behavior of any caches in between client and origin
     * server.
     *
     * * <code>"no-cache"</code>: Force caches to submit request in order to
     *   validate the freshness of the representation. Note that the requested
     *   resource may still be served from cache if the representation is
     *   considered fresh. Use this directive to ensure freshness but save
     *   bandwidth when possible.
     * * <code>"no-store"</code>: Do not keep a copy of the representation under
     *   any conditions.
     *
     * See <a href="http://www.mnot.net/cache_docs/#CACHE-CONTROL">
     * Caching tutorial</a> for an excellent introduction to Caching in general.
     * Refer to the corresponding section in the
     * <a href="http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.9">
     * HTTP 1.1 specification</a> for more details and advanced directives.
     *
     * It is recommended to choose an appropriate Cache-Control directive rather
     * than prohibit caching using the nocache parameter.
     */
    cache: {
      check: function(value) {
        return qx.lang.Type.isBoolean(value) ||
          qx.lang.Type.isString(value);
      },
      init: true
    }
  },

  members:
  {

    /**
     * @type {Function} Parser.
     */
    _parser: null,

    /*
    ---------------------------------------------------------------------------
      CONFIGURE TRANSPORT
    ---------------------------------------------------------------------------
    */

    /**
     * Create XHR transport.
     *
     * @return {qx.bom.request.Xhr} Transport.
     */
    _createTransport: function() {
      return new qx.bom.request.Xhr();
    },

    /**
     * Get configured URL.
     *
     * Append request data to URL if HTTP method is GET. Append random
     * string to URL if required by value of {@link #cache}.
     *
     * @return {String} The configured URL.
     */
    _getConfiguredUrl: function() {
      var url = this.getUrl(),
          serializedData;

      if (this.getMethod() === "GET" && this.getRequestData()) {
        serializedData = this._serializeData(this.getRequestData());
        url = qx.util.Uri.appendParamsToUrl(url, serializedData);
      }

      if (this.getCache() === false) {
        // Make sure URL cannot be served from cache and new request is made
        url = qx.util.Uri.appendParamsToUrl(url, {nocache: new Date().valueOf()});
      }

      return url;
    },

    // overridden
    _getConfiguredRequestHeaders: function() {
      var headers = {},
          isAllowsBody = qx.util.Request.methodAllowsRequestBody(this.getMethod());

      // Follow convention to include X-Requested-With header when same origin
      if (!qx.util.Request.isCrossDomain(this.getUrl())) {
        headers["X-Requested-With"] = "XMLHttpRequest";
      }

      // Include Cache-Control header if configured
      if (qx.lang.Type.isString(this.getCache())) {
        headers["Cache-Control"] = this.getCache();
      }

      // By default, set content-type urlencoded for requests with body
      if (this.getRequestData() !== "null" && isAllowsBody) {
        headers["Content-Type"] = "application/x-www-form-urlencoded";
      }

      // What representations to accept
      if (this.getAccept()) {
        if (qx.core.Environment.get("qx.debug.io")) {
          this.debug("Accepting: '" + this.getAccept() + "'");
        }
        headers["Accept"] = this.getAccept();
      }

      return headers;
    },

    // overridden
    _getMethod: function() {
      return this.getMethod();
    },

    // overridden
    _isAsync: function() {
      return this.isAsync();
    },

    /*
    ---------------------------------------------------------------------------
      PARSING
    ---------------------------------------------------------------------------
    */

    /**
     * Create response parser.
     *
     * @return {qx.util.ResponseParser} parser.
     */
    _createResponseParser: function() {
        return new qx.util.ResponseParser();
    },

    /**
     * Returns response parsed with parser determined by content type.
     *
     * @return {String|Object} The parsed response of the request.
     */
    _getParsedResponse: function() {
      var response = this._transport.responseText,
          contentType = this.getResponseContentType() || "";

      return this._parser.parse(response, contentType);
    },

    /**
     * Set parser used to parse response once request has
     * completed successfully.
     *
     * @see qx.util.ResponseParser#setParser
     *
     * @param parser {String|Function}
     * @return {Function} The parser function
     */
    setParser: function(parser) {
      return this._parser.setParser(parser);
    }
  }
});
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
     * Tristan Koch (tristankoch)

************************************************************************ */

/**
 * A wrapper of the XMLHttpRequest host object (or equivalent). The interface is
 * similar to <a href="http://www.w3.org/TR/XMLHttpRequest/">XmlHttpRequest</a>.
 *
 * Hides browser inconsistencies and works around bugs found in popular
 * implementations.
 *
 * <div class="desktop">
 * Example:
 *
 * <pre class="javascript">
 *  var req = new qx.bom.request.Xhr();
 *  req.onload = function() {
 *    // Handle data received
 *    req.responseText;
 *  }
 *
 *  req.open("GET", url);
 *  req.send();
 * </pre>
 * </div>
 *
 * @ignore(XDomainRequest)
 * @ignore(qx.event, qx.event.GlobalError.*)
 *
 * @require(qx.bom.request.Xhr#open)
 * @require(qx.bom.request.Xhr#send)
 * @require(qx.bom.request.Xhr#on)
 * @require(qx.bom.request.Xhr#onreadystatechange)
 * @require(qx.bom.request.Xhr#onload)
 * @require(qx.bom.request.Xhr#onloadend)
 * @require(qx.bom.request.Xhr#onerror)
 * @require(qx.bom.request.Xhr#onabort)
 * @require(qx.bom.request.Xhr#ontimeout)
 * @require(qx.bom.request.Xhr#setRequestHeader)
 * @require(qx.bom.request.Xhr#getAllResponseHeaders)
 * @require(qx.bom.request.Xhr#getRequest)
 * @require(qx.bom.request.Xhr#overrideMimeType)
 * @require(qx.bom.request.Xhr#dispose)
 * @require(qx.bom.request.Xhr#isDisposed)
 *
 * @group (IO)
 */
qx.Bootstrap.define("qx.bom.request.Xhr",
{

  extend: Object,

  construct: function() {
    var boundFunc = qx.Bootstrap.bind(this.__onNativeReadyStateChange, this);

    // GlobalError shouldn't be included in qx.Website builds so use it
    // if it's available but otherwise ignore it (see ignore stated above).
    if (qx.event && qx.event.GlobalError && qx.event.GlobalError.observeMethod) {
      this.__onNativeReadyStateChangeBound = qx.event.GlobalError.observeMethod(boundFunc);
    } else {
      this.__onNativeReadyStateChangeBound = boundFunc;
    }

    this.__onNativeAbortBound = qx.Bootstrap.bind(this.__onNativeAbort, this);
    this.__onTimeoutBound = qx.Bootstrap.bind(this.__onTimeout, this);

    this.__initNativeXhr();
    this._emitter = new qx.event.Emitter();

    // BUGFIX: IE
    // IE keeps connections alive unless aborted on unload
    if (window.attachEvent) {
      this.__onUnloadBound = qx.Bootstrap.bind(this.__onUnload, this);
      window.attachEvent("onunload", this.__onUnloadBound);
    }
  },

  statics :
  {
    UNSENT: 0,
    OPENED: 1,
    HEADERS_RECEIVED: 2,
    LOADING: 3,
    DONE: 4
  },


  events : {
    /** Fired at ready state changes. */
    "readystatechange" : "qx.bom.request.Xhr",

    /** Fired on error. */
    "error" : "qx.bom.request.Xhr",

    /** Fired at loadend. */
    "loadend" : "qx.bom.request.Xhr",

    /** Fired on timeouts. */
    "timeout" : "qx.bom.request.Xhr",

    /** Fired when the request is aborted. */
    "abort" : "qx.bom.request.Xhr",

    /** Fired on successful retrieval. */
    "load" : "qx.bom.request.Xhr"
  },


  members :
  {
    /*
    ---------------------------------------------------------------------------
      PUBLIC
    ---------------------------------------------------------------------------
    */

    /**
     * @type {Number} Ready state.
     *
     * States can be:
     * UNSENT:           0,
     * OPENED:           1,
     * HEADERS_RECEIVED: 2,
     * LOADING:          3,
     * DONE:             4
     */
    readyState: 0,

    /**
     * @type {String} The response of the request as text.
     */
    responseText: "",

    /**
     * @type {Object} The response of the request as a Document object.
     */
    responseXML: null,

    /**
     * @type {Number} The HTTP status code.
     */
    status: 0,

    /**
     * @type {String} The HTTP status text.
     */
    statusText: "",

    /**
     * @type {Number} Timeout limit in milliseconds.
     *
     * 0 (default) means no timeout. Not supported for synchronous requests.
     */
    timeout: 0,

    /**
     * Initializes (prepares) request.
     *
     * @ignore(XDomainRequest)
     *
     * @param method {String?"GET"}
     *  The HTTP method to use.
     * @param url {String}
     *  The URL to which to send the request.
     * @param async {Boolean?true}
     *  Whether or not to perform the operation asynchronously.
     * @param user {String?null}
     *  Optional user name to use for authentication purposes.
     * @param password {String?null}
     *  Optional password to use for authentication purposes.
     */
    open: function(method, url, async, user, password) {
      this.__checkDisposed();

      // Mimick native behavior
      if (typeof url === "undefined") {
        throw new Error("Not enough arguments");
      } else if (typeof method === "undefined") {
        method = "GET";
      }

      // Reset flags that may have been set on previous request
      this.__abort = false;
      this.__send = false;
      this.__conditional = false;

      // Store URL for later checks
      this.__url = url;

      if (typeof async == "undefined") {
        async = true;
      }
      this.__async = async;

      // BUGFIX
      // IE < 9 and FF < 3.5 cannot reuse the native XHR to issue many requests
      if (!this.__supportsManyRequests() && this.readyState > qx.bom.request.Xhr.UNSENT) {
        // XmlHttpRequest Level 1 requires open() to abort any pending requests
        // associated to the object. Since we're dealing with a new object here,
        // we have to emulate this behavior. Moreover, allow old native XHR to be garbage collected
        //
        // Dispose and abort.
        //
        this.dispose();

        // Replace the underlying native XHR with a new one that can
        // be used to issue new requests.
        this.__initNativeXhr();
      }

      // Restore handler in case it was removed before
      this.__nativeXhr.onreadystatechange = this.__onNativeReadyStateChangeBound;

      try {
        if (qx.core.Environment.get("qx.debug.io")) {
          qx.Bootstrap.debug(qx.bom.request.Xhr, "Open native request with method: " +
            method + ", url: " + url + ", async: " + async);
        }

        this.__nativeXhr.open(method, url, async, user, password);

      // BUGFIX: IE, Firefox < 3.5
      // Some browsers do not support Cross-Origin Resource Sharing (CORS)
      // for XMLHttpRequest. Instead, an exception is thrown even for async requests
      // if URL is cross-origin (as per XHR level 1). Use the proprietary XDomainRequest
      // if available (supports CORS) and handle error (if there is one) this
      // way. Otherwise just assume network error.
      //
      // Basically, this allows to detect network errors.
      } catch(OpenError) {

        // Only work around exceptions caused by cross domain request attempts
        if (!qx.util.Request.isCrossDomain(url)) {
          // Is same origin
          throw OpenError;
        }

        if (!this.__async) {
          this.__openError = OpenError;
        }

        if (this.__async) {
          // Try again with XDomainRequest
          // (Success case not handled on purpose)
          // - IE 9
          if (window.XDomainRequest) {
            this.readyState = 4;
            this.__nativeXhr = new XDomainRequest();
            this.__nativeXhr.onerror = qx.Bootstrap.bind(function() {
              this._emit("readystatechange");
              this._emit("error");
              this._emit("loadend");
            }, this);

            if (qx.core.Environment.get("qx.debug.io")) {
              qx.Bootstrap.debug(qx.bom.request.Xhr, "Retry open native request with method: " +
                method + ", url: " + url + ", async: " + async);
            }
            this.__nativeXhr.open(method, url, async, user, password);
            return;
          }

          // Access denied
          // - IE 6: -2146828218
          // - IE 7: -2147024891
          // - Legacy Firefox
          window.setTimeout(qx.Bootstrap.bind(function() {
            if (this.__disposed) {
              return;
            }
            this.readyState = 4;
            this._emit("readystatechange");
            this._emit("error");
            this._emit("loadend");
          }, this));
        }

      }

      // BUGFIX: IE < 9
      // IE < 9 tends to cache overly agressive. This may result in stale
      // representations. Force validating freshness of cached representation.
      if (qx.core.Environment.get("engine.name") === "mshtml" &&
        qx.core.Environment.get("browser.documentmode") < 9 &&
        this.__nativeXhr.readyState > 0) {
          this.__nativeXhr.setRequestHeader("If-Modified-Since", "-1");
        }

      // BUGFIX: Firefox
      // Firefox < 4 fails to trigger onreadystatechange OPENED for sync requests
      if (qx.core.Environment.get("engine.name") === "gecko" &&
          parseInt(qx.core.Environment.get("engine.version"), 10) < 2 &&
          !this.__async) {
        // Native XHR is already set to readyState DONE. Fake readyState
        // and call onreadystatechange manually.
        this.readyState = qx.bom.request.Xhr.OPENED;
        this._emit("readystatechange");
      }

    },

    /**
     * Sets an HTTP request header to be used by the request.
     *
     * Note: The request must be initialized before using this method.
     *
     * @param key {String}
     *  The name of the header whose value is to be set.
     * @param value {String}
     *  The value to set as the body of the header.
     * @return {qx.bom.request.Xhr} Self for chaining.
     */
    setRequestHeader: function(key, value) {
      this.__checkDisposed();

      // Detect conditional requests
      if (key == "If-Match" || key == "If-Modified-Since" ||
        key == "If-None-Match" || key == "If-Range") {
        this.__conditional = true;
      }

      this.__nativeXhr.setRequestHeader(key, value);
      return this;
    },

    /**
     * Sends request.
     *
     * @param data {String|Document?null}
     *  Optional data to send.
     * @return {qx.bom.request.Xhr} Self for chaining.
     */
    send: function(data) {
      this.__checkDisposed();

      // BUGFIX: IE & Firefox < 3.5
      // For sync requests, some browsers throw error on open()
      // while it should be on send()
      //
      if (!this.__async && this.__openError) {
        throw this.__openError;
      }

      // BUGFIX: Opera
      // On network error, Opera stalls at readyState HEADERS_RECEIVED
      // This violates the spec. See here http://www.w3.org/TR/XMLHttpRequest2/#send
      // (Section: If there is a network error)
      //
      // To fix, assume a default timeout of 10 seconds. Note: The "error"
      // event will be fired correctly, because the error flag is inferred
      // from the statusText property. Of course, compared to other
      // browsers there is an additional call to ontimeout(), but this call
      // should not harm.
      //
      if (qx.core.Environment.get("engine.name") === "opera" &&
          this.timeout === 0) {
        this.timeout = 10000;
      }

      // Timeout
      if (this.timeout > 0) {
        this.__timerId = window.setTimeout(this.__onTimeoutBound, this.timeout);
      }

      // BUGFIX: Firefox 2
      // "NS_ERROR_XPC_NOT_ENOUGH_ARGS" when calling send() without arguments
      data = typeof data == "undefined" ? null : data;

      // Some browsers may throw an error when sending of async request fails.
      // This violates the spec which states only sync requests should.
      try {
        if (qx.core.Environment.get("qx.debug.io")) {
          qx.Bootstrap.debug(qx.bom.request.Xhr, "Send native request");
        }
        this.__nativeXhr.send(data);
      } catch(SendError) {
        if (!this.__async) {
          throw SendError;
        }

        // BUGFIX
        // Some browsers throws error when file not found via file:// protocol.
        // Synthesize readyState changes.
        if (this._getProtocol() === "file:") {
          this.readyState = 2;
          this.__readyStateChange();

          var that = this;
          window.setTimeout(function() {
            if (that.__disposed) {
              return;
            }
            that.readyState = 3;
            that.__readyStateChange();

            that.readyState = 4;
            that.__readyStateChange();
          });

        }

      }

      // BUGFIX: Firefox
      // Firefox fails to trigger onreadystatechange DONE for sync requests
      if (qx.core.Environment.get("engine.name") === "gecko" && !this.__async) {
        // Properties all set, only missing native readystatechange event
        this.__onNativeReadyStateChange();
      }

      // Set send flag
      this.__send = true;
      return this;
    },

    /**
     * Abort request - i.e. cancels any network activity.
     *
     * Note:
     *  On Windows 7 every browser strangely skips the loading phase
     *  when this method is called (because readyState never gets 3).
     *
     *  So keep this in mind if you rely on the phases which are
     *  passed through. They will be "opened", "sent", "abort"
     *  instead of normally "opened", "sent", "loading", "abort".
     *
     * @return {qx.bom.request.Xhr} Self for chaining.
     */
    abort: function() {
      this.__checkDisposed();

      this.__abort = true;
      this.__nativeXhr.abort();

      if (this.__nativeXhr) {
        this.readyState = this.__nativeXhr.readyState;
      }
      return this;
    },


    /**
     * Helper to emit events and call the callback methods.
     * @param event {String} The name of the event.
     */
    _emit: function(event) {
      if (this["on" + event]) {
        this["on" + event]();
      }
      this._emitter.emit(event, this);
    },

    /**
     * Event handler for XHR event that fires at every state change.
     *
     * Replace with custom method to get informed about the communication progress.
     */
    onreadystatechange: function() {},

    /**
     * Event handler for XHR event "load" that is fired on successful retrieval.
     *
     * Note: This handler is called even when the HTTP status indicates an error.
     *
     * Replace with custom method to listen to the "load" event.
     */
    onload: function() {},

    /**
     * Event handler for XHR event "loadend" that is fired on retrieval.
     *
     * Note: This handler is called even when a network error (or similar)
     * occurred.
     *
     * Replace with custom method to listen to the "loadend" event.
     */
    onloadend: function() {},

    /**
     * Event handler for XHR event "error" that is fired on a network error.
     *
     * Replace with custom method to listen to the "error" event.
     */
    onerror: function() {},

    /**
    * Event handler for XHR event "abort" that is fired when request
    * is aborted.
    *
    * Replace with custom method to listen to the "abort" event.
    */
    onabort: function() {},

    /**
    * Event handler for XHR event "timeout" that is fired when timeout
    * interval has passed.
    *
    * Replace with custom method to listen to the "timeout" event.
    */
    ontimeout: function() {},


    /**
     * Add an event listener for the given event name.
     *
     * @param name {String} The name of the event to listen to.
     * @param listener {Function} The function to execute when the event is fired
     * @param ctx {var?} The context of the listener.
     * @return {qx.bom.request.Xhr} Self for chaining.
     */
    on: function(name, listener, ctx) {
      this._emitter.on(name, listener, ctx);
      return this;
    },


    /**
     * Get a single response header from response.
     *
     * @param header {String}
     *  Key of the header to get the value from.
     * @return {String}
     *  Response header.
     */
    getResponseHeader: function(header) {
      this.__checkDisposed();

      return this.__nativeXhr.getResponseHeader(header);
    },

    /**
     * Get all response headers from response.
     *
     * @return {String} All response headers.
     */
    getAllResponseHeaders: function() {
      this.__checkDisposed();

      return this.__nativeXhr.getAllResponseHeaders();
    },

    /**
     * Overrides the MIME type returned by the server
     * and must be called before @send()@.
     *
     * Note:
     *
     * * IE doesn't support this method so in this case an Error is thrown.
     * * after calling this method @getResponseHeader("Content-Type")@
     *   may return the original (Firefox 23, IE 10, Safari 6) or
     *   the overriden content type (Chrome 28+, Opera 15+).
     *
     *
     * @param mimeType {String} The mimeType for overriding.
     * @return {qx.bom.request.Xhr} Self for chaining.
     */
    overrideMimeType: function(mimeType) {
      this.__checkDisposed();

      if (this.__nativeXhr.overrideMimeType) {
        this.__nativeXhr.overrideMimeType(mimeType);
      } else {
        throw new Error("Native XHR object doesn't support overrideMimeType.");
      }

      return this;
    },

    /**
     * Get wrapped native XMLHttpRequest (or equivalent).
     *
     * Can be XMLHttpRequest or ActiveX.
     *
     * @return {Object} XMLHttpRequest or equivalent.
     */
    getRequest: function() {
      return this.__nativeXhr;
    },

    /*
    ---------------------------------------------------------------------------
      HELPER
    ---------------------------------------------------------------------------
    */

    /**
     * Dispose object and wrapped native XHR.
     * @return {Boolean} <code>true</code> if the object was successfully disposed
     */
    dispose: function() {
      if (this.__disposed) {
        return false;
      }

      window.clearTimeout(this.__timerId);

      // Remove unload listener in IE. Aborting on unload is no longer required
      // for this instance.
      if (window.detachEvent) {
        window.detachEvent("onunload", this.__onUnloadBound);
      }

      // May fail in IE
      try {
        this.__nativeXhr.onreadystatechange;
      } catch(PropertiesNotAccessable) {
        return false;
      }

      // Clear out listeners
      var noop = function() {};
      this.__nativeXhr.onreadystatechange = noop;
      this.__nativeXhr.onload = noop;
      this.__nativeXhr.onerror = noop;

      // Abort any network activity
      this.abort();

      // Remove reference to native XHR
      this.__nativeXhr = null;

      this.__disposed = true;
      return true;
    },


    /**
     * Check if the request has already beed disposed.
     * @return {Boolean} <code>true</code>, if the request has been disposed.
     */
    isDisposed : function() {
      return !!this.__disposed;
    },


    /*
    ---------------------------------------------------------------------------
      PROTECTED
    ---------------------------------------------------------------------------
    */

    /**
     * Create XMLHttpRequest (or equivalent).
     *
     * @return {Object} XMLHttpRequest or equivalent.
     */
    _createNativeXhr: function() {
      var xhr = qx.core.Environment.get("io.xhr");

      if (xhr === "xhr") {
        return new XMLHttpRequest();
      }

      if (xhr == "activex") {
        return new window.ActiveXObject("Microsoft.XMLHTTP");
      }

      qx.Bootstrap.error(this, "No XHR support available.");
    },

    /**
     * Get protocol of requested URL.
     *
     * @return {String} The used protocol.
     */
    _getProtocol: function() {
      var url = this.__url;
      var protocolRe = /^(\w+:)\/\//;

      // Could be http:// from file://
      if (url !== null && url.match) {
        var match = url.match(protocolRe);
        if (match && match[1]) {
          return match[1];
        }
      }

      return window.location.protocol;
    },

    /*
    ---------------------------------------------------------------------------
      PRIVATE
    ---------------------------------------------------------------------------
    */

    /**
     * @type {Object} XMLHttpRequest or equivalent.
     */
    __nativeXhr: null,

    /**
     * @type {Boolean} Whether request is async.
     */
    __async: null,

    /**
     * @type {Function} Bound __onNativeReadyStateChange handler.
     */
    __onNativeReadyStateChangeBound: null,

    /**
     * @type {Function} Bound __onNativeAbort handler.
     */
    __onNativeAbortBound: null,

    /**
     * @type {Function} Bound __onUnload handler.
     */
    __onUnloadBound: null,

    /**
     * @type {Function} Bound __onTimeout handler.
     */
    __onTimeoutBound: null,

    /**
     * @type {Boolean} Send flag
     */
    __send: null,

    /**
     * @type {String} Requested URL
     */
    __url: null,

    /**
     * @type {Boolean} Abort flag
     */
    __abort: null,

    /**
     * @type {Boolean} Timeout flag
     */
    __timeout: null,

    /**
     * @type {Boolean} Whether object has been disposed.
     */
    __disposed: null,

    /**
     * @type {Number} ID of timeout timer.
     */
    __timerId: null,

    /**
     * @type {Error} Error thrown on open, if any.
     */
    __openError: null,

    /**
     * @type {Boolean} Conditional get flag
     */
     __conditional: null,

    /**
     * Init native XHR.
     */
    __initNativeXhr: function() {
      // Create native XHR or equivalent and hold reference
      this.__nativeXhr = this._createNativeXhr();

      // Track native ready state changes
      this.__nativeXhr.onreadystatechange = this.__onNativeReadyStateChangeBound;

      // Track native abort, when supported
      if (this.__nativeXhr.onabort) {
        this.__nativeXhr.onabort = this.__onNativeAbortBound;
      }

      // Reset flags
      this.__disposed = this.__send = this.__abort = false;
    },

    /**
     * Track native abort.
     *
     * In case the end user cancels the request by other
     * means than calling abort().
     */
    __onNativeAbort: function() {
      // When the abort that triggered this method was not a result from
      // calling abort()
      if (!this.__abort) {
        this.abort();
      }
    },

    /**
     * Handle native onreadystatechange.
     *
     * Calls user-defined function onreadystatechange on each
     * state change and syncs the XHR status properties.
     */
    __onNativeReadyStateChange: function() {
      var nxhr = this.__nativeXhr,
          propertiesReadable = true;

      if (qx.core.Environment.get("qx.debug.io")) {
        qx.Bootstrap.debug(qx.bom.request.Xhr, "Received native readyState: " + nxhr.readyState);
      }

      // BUGFIX: IE, Firefox
      // onreadystatechange() is called twice for readyState OPENED.
      //
      // Call onreadystatechange only when readyState has changed.
      if (this.readyState == nxhr.readyState) {
        return;
      }

      // Sync current readyState
      this.readyState = nxhr.readyState;

      // BUGFIX: IE
      // Superfluous onreadystatechange DONE when aborting OPENED
      // without send flag
      if (this.readyState === qx.bom.request.Xhr.DONE &&
          this.__abort && !this.__send) {
        return;
      }

      // BUGFIX: IE
      // IE fires onreadystatechange HEADERS_RECEIVED and LOADING when sync
      //
      // According to spec, only onreadystatechange OPENED and DONE should
      // be fired.
      if (!this.__async && (nxhr.readyState == 2 || nxhr.readyState == 3)) {
        return;
      }

      // Default values according to spec.
      this.status = 0;
      this.statusText = this.responseText = "";
      this.responseXML = null;

      if (this.readyState >= qx.bom.request.Xhr.HEADERS_RECEIVED) {
        // In some browsers, XHR properties are not readable
        // while request is in progress.
        try {
          this.status = nxhr.status;
          this.statusText = nxhr.statusText;
          this.responseText = nxhr.responseText;
          this.responseXML = nxhr.responseXML;
        } catch(XhrPropertiesNotReadable) {
          propertiesReadable = false;
        }

        if (propertiesReadable) {
          this.__normalizeStatus();
          this.__normalizeResponseXML();
        }
      }

      this.__readyStateChange();

      // BUGFIX: IE
      // Memory leak in XMLHttpRequest (on-page)
      if (this.readyState == qx.bom.request.Xhr.DONE) {
        // Allow garbage collecting of native XHR
        if (nxhr) {
          nxhr.onreadystatechange = function() {};
        }
      }

    },

    /**
     * Handle readystatechange. Called internally when readyState is changed.
     */
    __readyStateChange: function() {
      var that = this;

      // Cancel timeout before invoking handlers because they may throw
      if (this.readyState === qx.bom.request.Xhr.DONE) {
        // Request determined DONE. Cancel timeout.
        window.clearTimeout(this.__timerId);
      }

      // BUGFIX: IE
      // IE < 8 fires LOADING and DONE on open() - before send() - when from cache
      if (qx.core.Environment.get("engine.name") == "mshtml" &&
          qx.core.Environment.get("browser.documentmode") < 8) {

        // Detect premature events when async. LOADING and DONE is
        // illogical to happen before request was sent.
        if (this.__async && !this.__send && this.readyState >= qx.bom.request.Xhr.LOADING) {

          if (this.readyState == qx.bom.request.Xhr.LOADING) {
            // To early to fire, skip.
            return;
          }

          if (this.readyState == qx.bom.request.Xhr.DONE) {
            window.setTimeout(function() {
              if (that.__disposed) {
                return;
              }
              // Replay previously skipped
              that.readyState = 3;
              that._emit("readystatechange");

              that.readyState = 4;
              that._emit("readystatechange");
              that.__readyStateChangeDone();
            });
            return;
          }

        }
      }

      // Always fire "readystatechange"
      this._emit("readystatechange");
      if (this.readyState === qx.bom.request.Xhr.DONE) {
        this.__readyStateChangeDone();
      }
    },

    /**
     * Handle readystatechange. Called internally by
     * {@link #__readyStateChange} when readyState is DONE.
     */
    __readyStateChangeDone: function() {
      // Fire "timeout" if timeout flag is set
      if (this.__timeout) {
        this._emit("timeout");

        // BUGFIX: Opera
        // Since Opera does not fire "error" on network error, fire additional
        // "error" on timeout (may well be related to network error)
        if (qx.core.Environment.get("engine.name") === "opera") {
          this._emit("error");
        }

        this.__timeout = false;

      // Fire either "abort", "load" or "error"
      } else {
        if (this.__abort) {
          this._emit("abort");
        } else{
          if (this.__isNetworkError()) {
            this._emit("error");
          } else {
            this._emit("load");
          }
        }
      }

      // Always fire "onloadend" when DONE
      this._emit("loadend");
    },

    /**
     * Check for network error.
     *
     * @return {Boolean} Whether a network error occured.
     */
    __isNetworkError: function() {
      var error;

      // Infer the XHR internal error flag from statusText when not aborted.
      // See http://www.w3.org/TR/XMLHttpRequest2/#error-flag and
      // http://www.w3.org/TR/XMLHttpRequest2/#the-statustext-attribute
      //
      // With file://, statusText is always falsy. Assume network error when
      // response is empty.
      if (this._getProtocol() === "file:") {
        error = !this.responseText;
      } else {
        error = !this.statusText;
      }

      return error;
    },

    /**
     * Handle faked timeout.
     */
    __onTimeout: function() {
      // Basically, mimick http://www.w3.org/TR/XMLHttpRequest2/#timeout-error
      var nxhr = this.__nativeXhr;
      this.readyState = qx.bom.request.Xhr.DONE;

      // Set timeout flag
      this.__timeout = true;

      // No longer consider request. Abort.
      nxhr.abort();
      this.responseText = "";
      this.responseXML = null;

      // Signal readystatechange
      this.__readyStateChange();
    },

    /**
     * Normalize status property across browsers.
     */
    __normalizeStatus: function() {
      var isDone = this.readyState === qx.bom.request.Xhr.DONE;

      // BUGFIX: Most browsers
      // Most browsers tell status 0 when it should be 200 for local files
      if (this._getProtocol() === "file:" && this.status === 0 && isDone) {
        if (!this.__isNetworkError()) {
          this.status = 200;
        }
      }

      // BUGFIX: IE
      // IE sometimes tells 1223 when it should be 204
      if (this.status === 1223) {
        this.status = 204;
      }

      // BUGFIX: Opera
      // Opera tells 0 for conditional requests when it should be 304
      //
      // Detect response to conditional request that signals fresh cache.
      if (qx.core.Environment.get("engine.name") === "opera") {
        if (
          isDone &&                 // Done
          this.__conditional &&     // Conditional request
          !this.__abort &&          // Not aborted
          this.status === 0         // But status 0!
        ) {
          this.status = 304;
        }
      }
    },

    /**
     * Normalize responseXML property across browsers.
     */
    __normalizeResponseXML: function() {
      // BUGFIX: IE
      // IE does not recognize +xml extension, resulting in empty responseXML.
      //
      // Check if Content-Type is +xml, verify missing responseXML then parse
      // responseText as XML.
      if (qx.core.Environment.get("engine.name") == "mshtml" &&
          (this.getResponseHeader("Content-Type") || "").match(/[^\/]+\/[^\+]+\+xml/) &&
           this.responseXML && !this.responseXML.documentElement) {
        var dom = new window.ActiveXObject("Microsoft.XMLDOM");
        dom.async = false;
        dom.validateOnParse = false;
        dom.loadXML(this.responseText);
        this.responseXML = dom;
      }
    },

    /**
     * Handler for native unload event.
     */
    __onUnload: function() {
      try {
        // Abort and dispose
        if (this) {
          this.dispose();
        }
      } catch(e) {}
    },

    /**
     * Helper method to determine whether browser supports reusing the
     * same native XHR to send more requests.
     * @return {Boolean} <code>true</code> if request object reuse is supported
     */
    __supportsManyRequests: function() {
      var name = qx.core.Environment.get("engine.name");
      var version = qx.core.Environment.get("browser.version");

      return !(name == "mshtml" && version < 9 ||
               name == "gecko" && version < 3.5);
    },

    /**
     * Throw when already disposed.
     */
    __checkDisposed: function() {
      if (this.__disposed) {
        throw new Error("Already disposed");
      }
    }
  },

  defer: function() {
    qx.core.Environment.add("qx.debug.io", false);
  }
});
/* ************************************************************************

   qooxdoo - the new era of web development

   http://qooxdoo.org

   Copyright:
     2013 1&1 Internet AG, Germany, http://www.1und1.de

   License:
     LGPL: http://www.gnu.org/licenses/lgpl.html
     EPL: http://www.eclipse.org/org/documents/epl-v10.php
     See the LICENSE file in the project's top-level directory for details.

   Authors:
     * Richard Sternagel (rsternagel)

************************************************************************ */

/**
 * Parsers for parsing response strings (especially for XHR).
 *
 * Known parsers are: <code>"json"</code> and <code>"xml"</code>.
 *
 * @require(qx.util.ResponseParser#parse)
 */
qx.Bootstrap.define("qx.util.ResponseParser",
{

  /**
   * @param parser {String|Function} See {@link #setParser}.
   */
  construct: function(parser) {
    if (parser !== undefined) {
      this.setParser(parser);
    }
  },

  statics:
  {
    /**
     * @type {Map} Map of parser functions. Parsers defined here can be
     * referenced symbolically, e.g. with {@link #setParser}.
     *
     * Known parsers are: <code>"json"</code> and <code>"xml"</code>.
     */
    PARSER: {
      json: qx.lang.Json.parse,
      xml: qx.xml.Document.fromString
    }
  },

  members :
  {
    __parser: null,

    /**
     * Returns given response parsed with parser
     * determined by {@link #_getParser}.
     *
     * @param response {String} response (e.g JSON/XML string)
     * @param contentType {String} contentType (e.g. 'application/json')
     * @return {String|Object} The parsed response of the request.
     */
    parse: function(response, contentType) {
      var parser = this._getParser(contentType);

      if (typeof parser === "function") {
        if (response !== "") {
          return parser.call(this, response);
        }
      }

      return response;
    },


    /**
     * Set parser used to parse response once request has
     * completed successfully.
     *
     * Usually, the parser is correctly inferred from the
     * content type of the response. This method allows to force the
     * parser being used, e.g. if the content type returned from
     * the backend is wrong or the response needs special parsing.
     *
     * Parser most typically used can be referenced symbolically.
     * To cover edge cases, a function can be given. When parsing
     * the response, this function is called with the raw response as
     * first argument.
     *
     * @param parser {String|Function}
     *
     * Can be:
     *
     * <ul>
     *   <li>A parser defined in {@link qx.util.ResponseParser#PARSER},
     *       referenced by string.</li>
     *   <li>The function to invoke.
     *       Receives the raw response as argument.</li>
     * </ul>
     *
     * @return {Function} The parser function
     */
    setParser: function(parser) {
      // Symbolically given known parser
      if (typeof qx.util.ResponseParser.PARSER[parser] === "function") {
        return this.__parser = qx.util.ResponseParser.PARSER[parser];
      }

      // If parser is not a symbol, it must be a function
      if (qx.core.Environment.get("qx.debug")) {
        qx.core.Assert.assertFunction(parser);
      }

      return this.__parser = parser;
    },


    /**
     * Gets the parser.
     *
     * If not defined explicitly using {@link #setParser},
     * the parser is inferred from the content type.
     *
     * Override this method to extend the list of content types
     * being handled.
     *
     * @param contentType {String}
     * @return {Function|null} The parser function or <code>null</code> if the
     * content type is undetermined.
     *
     */
    _getParser: function(contentType) {
      var parser = this.__parser,
          contentTypeOrig = "",
          contentTypeNormalized = "";

      // Use user-provided parser, if any
      if (parser) {
        return parser;
      }

      // See http://restpatterns.org/Glossary/MIME_Type

      contentTypeOrig = contentType || "";

      // Ignore parameters (e.g. the character set)
      contentTypeNormalized = contentTypeOrig.replace(/;.*$/, "");

      if ((/^application\/(\w|\.)*\+?json$/).test(contentTypeNormalized)) {
        parser = qx.util.ResponseParser.PARSER.json;
      }

      if ((/^application\/xml$/).test(contentTypeNormalized)) {
        parser = qx.util.ResponseParser.PARSER.xml;
      }

      // Deprecated
      if ((/[^\/]+\/[^\+]+\+xml$/).test(contentTypeOrig)) {
        parser = qx.util.ResponseParser.PARSER.xml;
      }

      return parser;
    }
  }
});

